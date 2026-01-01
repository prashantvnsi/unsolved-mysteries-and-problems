"use client";

import { useEffect, useState } from "react";

type NewsItem = {
    source: string;
    title: string;
    link: string;
    date: string | null;
};

export default function LatestAI() {
    const [items, setItems] = useState<NewsItem[] | null>(null);
    const [fromCache, setFromCache] = useState<boolean | null>(null);

    useEffect(() => {
        let alive = true;
        fetch("/api/news")
            .then((r) => r.json())
            .then((data) => {
                if (!alive) return;
                setItems(Array.isArray(data.items) ? data.items : []);
                setFromCache(Boolean(data.fromCache));
            })
            .catch(() => {
                if (!alive) return;
                setItems([]);
                setFromCache(null);
            });

        return () => {
            alive = false;
        };
    }, []);

    return (
        <div className="rounded-3xl border bg-background p-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm text-muted-foreground">Fresh from the field</div>
                    <h2 className="mt-1 text-xl font-semibold">Latest AI papers & updates</h2>
                </div>

                <div className="text-xs text-muted-foreground">
                    {fromCache === null ? "" : fromCache ? "Cached" : "Live"}
                </div>
            </div>

            <div className="mt-4 space-y-3">
                {items === null ? (
                    <div className="text-sm text-muted-foreground">Loading news…</div>
                ) : items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                        News is temporarily unavailable. Try again in a minute.
                    </div>
                ) : (
                    items.slice(0, 8).map((it, idx) => (
                        <a
                            key={`${it.source}-${idx}-${it.link}`}
                            href={it.link || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-2xl border bg-muted/10 p-3 hover:bg-muted/20 transition"
                        >
                            <div className="text-xs text-muted-foreground">
                                {it.source}
                                {it.date ? ` • ${new Date(it.date).toDateString()}` : ""}
                            </div>
                            <div className="mt-1 font-medium leading-snug">{it.title}</div>
                        </a>
                    ))
                )}
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
                Tip: these are RSS-based (cheap + reliable). Later we can add “AI summary of today” with one cached Groq call per 15
                minutes.
            </div>
        </div>
    );
}
