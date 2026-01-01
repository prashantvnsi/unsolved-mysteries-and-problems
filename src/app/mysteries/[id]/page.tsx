import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrGenerateArticle } from "@/lib/getOrGenerateArticle";
import StyleSwitcher from "@/components/mysteries/StyleSwitcher";

export default async function MysteryArticlePage(props: any) {
    try {
        const params = await Promise.resolve(props.params);
        const searchParams = await Promise.resolve(props.searchParams);

        const id = params?.id as string;
        const style = (searchParams?.style as string) || "default";

        const { article, fromCache } = await getOrGenerateArticle(id, style);

        return (
            <div className="min-h-screen">
                <div className="mx-auto max-w-3xl px-4 py-10">
                    <div className="flex items-center justify-between gap-4">
                        <Link href="/mysteries" className="text-sm text-muted-foreground hover:underline">
                            ← Back to Mysteries
                        </Link>

                        <div className="text-xs text-muted-foreground">
                            {fromCache ? "Cached" : "Freshly generated"}
                            {article.meta?.generatedAt ? ` • ${new Date(article.meta.generatedAt).toLocaleString()}` : ""}
                        </div>
                    </div>

                    <h1 className="mt-6 text-3xl md:text-5xl font-semibold leading-tight">{article.title}</h1>
                    {article.subtitle ? (
                        <p className="mt-3 text-muted-foreground text-base md:text-lg">{article.subtitle}</p>
                    ) : null}

                    <div className="mt-3 text-sm text-muted-foreground">{article.readingMinutes} min read</div>

                    <div className="mt-6 rounded-2xl border bg-muted/10 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="text-xs text-muted-foreground">
                                Style: <span className="text-foreground">{article.meta?.style ?? style}</span>
                                {"  "}• Model: <span className="text-foreground">{article.meta?.model ?? "unknown"}</span>
                            </div>
                            <StyleSwitcher id={id} active={style} />
                        </div>
                    </div>

                    <article className="mt-10 space-y-10">
                        {article.sections.map((s) => (
                            <section key={s.heading} className="space-y-3">
                                <h2 className="text-xl md:text-2xl font-semibold">{s.heading}</h2>
                                <div className="space-y-4 text-muted-foreground leading-relaxed">
                                    {s.paragraphs.map((p: string, i: number) => (
                                        <p key={i}>{p}</p>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </article>

                    {article.keyTakeaways?.length ? (
                        <div className="mt-12 space-y-3">
                            <h3 className="text-lg font-semibold">Key takeaways</h3>
                            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
                                {article.keyTakeaways.map((x: string) => (
                                    <li key={x}>{x}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {article.sources?.length ? (
                        <div className="mt-12 space-y-3">
                            <h3 className="text-lg font-semibold">Sources</h3>
                            <ul className="space-y-2 text-sm">
                                {article.sources.map((s: any) => (
                                    <li key={s.url}>
                                        <a className="underline text-muted-foreground hover:text-foreground" href={s.url} target="_blank" rel="noreferrer">
                                            {s.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    } catch {
        notFound();
    }
}
