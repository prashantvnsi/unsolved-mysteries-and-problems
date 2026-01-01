import OpenAI from "openai";
import { redis } from "@/lib/redis";
import { ArticleSchema, type Article } from "@/lib/articleSchema";
import { TOPICS } from "@/lib/mysteryTopics";

const CACHE_VERSION = "v1";
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY!,
    baseURL: "https://api.groq.com/openai/v1", // OpenAI-compatible Groq endpoint :contentReference[oaicite:11]{index=11}
});

function cacheKey(id: string, style: string) {
    return `mystery:${CACHE_VERSION}:${id}:style:${style}`;
}
function lockKey(id: string, style: string) {
    return `mystery:${CACHE_VERSION}:${id}:style:${style}:lock`;
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

export async function getOrGenerateArticle(id: string, style: string = "default"): Promise<{ article: Article; fromCache: boolean }> {
    const normalizedId = decodeURIComponent(id).trim().toLowerCase();

    // TEMP DEBUG (remove later)
    console.log("Requested id:", JSON.stringify(id), "normalized:", JSON.stringify(normalizedId));
    console.log("Known ids:", TOPICS.map(t => t.id));
    // Only allow known topics (prevents abuse of “generate anything”)
    const topic = TOPICS.find((m) => m.id === id);
    if (!topic) throw new Error("Unknown topic id");

    // 1) Cache hit?
    const cached = await redis.get<Article>(cacheKey(id, style));
    if (cached) return { article: cached, fromCache: true };

    // 2) Acquire a lock (prevents multiple users generating the same topic at the same time)
    // SET lock NX EX is supported by Upstash redis.set options :contentReference[oaicite:12]{index=12}
    const gotLock = await redis.set(lockKey(id, style), "1", { nx: true, ex: 60 });

    // If someone else is generating, wait briefly and re-check cache
    if (gotLock !== "OK") {
        for (let i = 0; i < 12; i++) {
            await sleep(1000);
            const c2 = await redis.get<Article>(cacheKey(id, style));
            if (c2) return { article: c2, fromCache: true };
        }
        // If still not ready, continue anyway (rare) — try generating ourselves.
    }

    // 3) Generate via Groq (JSON mode)
    // Groq supports JSON Object Mode via response_format {"type":"json_object"} :contentReference[oaicite:13]{index=13}
    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    const system = [
        "You write vivid, accurate science explainer articles.",
        "Return ONLY valid JSON (no markdown).",
        "The JSON MUST follow the requested shape.",
        "Include the word JSON in your output requirements.",
    ].join(" ");

    const styleInstruction =
        style === "short"
            ? "Write a shorter version. Keep sections tighter. Prefer punchy paragraphs."
            : style === "eli12"
                ? "Explain like the reader is 12. Use simple language and everyday examples."
                : style === "technical"
                    ? "Make it more technical. Include more precise language and mechanisms."
                    : style === "analogies"
                        ? "Use more analogies and vivid mental pictures, while staying accurate."
                        : "Write a balanced, magazine-style explainer.";

    const user = `
Write a blog-style article about this open scientific mystery.

STYLE:
${styleInstruction}

Topic:
- id: ${topic.id}
- title: ${topic.title}
- hook: ${topic.hook}
- category: ${topic.category}
- difficulty (1-5): ${topic.difficulty ?? 3}

What we know:
${(topic.known ?? []).map((x) => `- ${x}`).join("\n")}

What we don't know:
${(topic.unknown ?? []).map((x) => `- ${x}`).join("\n")}

Leading hypotheses:
${(topic.hypotheses ?? []).map((x) => `- ${x}`).join("\n")}

How to test / move forward:
${(topic.howToTest ?? []).map((x) => `- ${x}`).join("\n")}

Return JSON with this shape:
{
  "id": string,
  "title": string,
  "subtitle": string,
  "readingMinutes": number,
  "hero": { "unsplashQuery": string, "alt": string },
  "sections": [ { "heading": string, "paragraphs": string[] } ],
  "keyTakeaways": string[],
  "sources": [ { "label": string, "url": string } ]
}

Constraints:
- 4 to 7 sections, each section 2-4 paragraphs.
- Keep it exciting, but avoid fake certainty.
- paragraphs array must never be empty.
- Sources must be real-looking reputable orgs/journals (NASA/ESA, Nature/Science, university pages, etc.)
- Output MUST be valid JSON.
`.trim();


    const resp = await groq.chat.completions.create({
        model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: system },
            { role: "user", content: user },
        ],
    });

    const content = resp.choices?.[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
        parsed = JSON.parse(content);
    } catch {
        throw new Error("Model did not return valid JSON");
    }

    const obj = parsed as any;

    const sections = Array.isArray(obj?.sections) ? obj.sections : [];
    const cleanedSections = sections
        .map((s: any) => ({
            heading: String(s?.heading ?? "").trim() || "Untitled section",
            paragraphs: Array.isArray(s?.paragraphs)
                ? s.paragraphs.map((p: any) => String(p ?? "").trim()).filter(Boolean)
                : [],
        }))
        // remove sections that ended up with zero paragraphs
        .filter((s: any) => s.paragraphs.length >= 1);

    // If everything got filtered out, fail with a clear error so we can retry
    if (cleanedSections.length === 0) {
        throw new Error("MODEL_SECTIONS_EMPTY");
    }

    const modelUsed = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    const merged = {
        id: String(obj?.id ?? topic.id),
        title: String(obj?.title ?? topic.title),
        subtitle: String(obj?.subtitle ?? ""),
        readingMinutes: Number(obj?.readingMinutes ?? 8),
        hero: {
            unsplashQuery: String(obj?.hero?.unsplashQuery ?? topic.title),
            alt: String(obj?.hero?.alt ?? topic.title),
        },
        sections: cleanedSections,
        keyTakeaways: Array.isArray(obj?.keyTakeaways)
            ? obj.keyTakeaways.map((x: any) => String(x ?? "").trim()).filter(Boolean)
            : [],
        sources: Array.isArray(obj?.sources)
            ? obj.sources
                .map((s: any) => ({
                    label: String(s?.label ?? "").trim(),
                    url: String(s?.url ?? "").trim(),
                }))
                .filter((s: any) => s.label && s.url)
            : [],
        meta: {
            generatedAt: new Date().toISOString(),
            model: modelUsed,
            style,
            cacheVersion: CACHE_VERSION,
        },
    };

    const article = ArticleSchema.parse(merged);

    // 4) Cache forever (no TTL)
    await redis.set(cacheKey(id, style), article);

    // 5) Release lock (best-effort)
    await redis.del(lockKey(id, style));

    return { article, fromCache: false };
}
