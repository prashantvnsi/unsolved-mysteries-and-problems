import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { redis } from "@/lib/redis";

export const runtime = "nodejs"; // keep it simple on Vercel

const parser = new Parser();

const FEEDS = [
    { key: "arxiv-ai", name: "arXiv cs.AI", url: "https://rss.arxiv.org/rss/cs.AI" },
    // Add more later
    // { key: "deepmind", name: "DeepMind Blog", url: "https://deepmind.com/blog/feed/basic" },
];

const CACHE_KEY = "news:v1";
const TTL_SECONDS = 60 * 15;

export async function GET() {
    const cached = await redis.get<any>(CACHE_KEY);
    if (cached) return NextResponse.json({ fromCache: true, items: cached });

    const results: any[] = [];

    for (const feed of FEEDS) {
        try {
            const parsed = await parser.parseURL(feed.url);
            for (const item of parsed.items.slice(0, 8)) {
                results.push({
                    source: feed.name,
                    title: item.title ?? "",
                    link: item.link ?? "",
                    date: item.isoDate ?? item.pubDate ?? null,
                });
            }
        } catch (e) {
            // Don’t fail the whole endpoint if one feed fails
            results.push({
                source: feed.name,
                title: "(Feed temporarily unavailable)",
                link: "",
                date: null,
                error: true,
            });
        }
    }

    // Sort newest first
    results.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

    await redis.set(CACHE_KEY, results, { ex: TTL_SECONDS });

    return NextResponse.json({ fromCache: false, items: results });
}
