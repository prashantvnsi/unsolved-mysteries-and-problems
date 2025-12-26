"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

import CoverArt from "@/components/mysteries/CoverArt";
import { CATEGORY_META, TOPICS } from "@/lib/mysteryTopics";

export default function MysteriesIndexPage() {
    const [q, setQ] = useState("");
    const [cat, setCat] = useState<string>("all");

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        return TOPICS
            .filter((p) => (cat === "all" ? true : p.category === cat))
            .filter((p) => {
                if (!query) return true;
                const hay = [p.title, p.hook].join(" ").toLowerCase();
                return hay.includes(query);
            });
    }, [q, cat]);

    const featured = filtered[0];

    return (
        <div className="min-h-screen">
            <div className="mx-auto max-w-6xl px-4 py-10">
                <div className="rounded-3xl border bg-gradient-to-br from-slate-900/30 via-background to-slate-900/20 p-6 md:p-10">
                    <div className="text-sm text-muted-foreground">Mysteries of Science</div>
                    <h1 className="mt-2 text-3xl md:text-5xl font-semibold tracking-tight">
                        Questions we still can’t answer
                    </h1>
                    <p className="mt-3 max-w-2xl text-muted-foreground">
                        Click a topic. The first visitor triggers AI generation; everyone else reads the cached article.
                    </p>

                    <div className="mt-6 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3.5" />
                            <Input
                                type="text"
                                className="pl-9 rounded-2xl"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search (dark matter, time, consciousness...)"
                            />
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                className={`rounded-full border px-4 py-2 text-sm ${cat === "all" ? "bg-muted" : "hover:bg-muted/40"
                                    }`}
                                onClick={() => setCat("all")}
                            >
                                All
                            </button>

                            {Object.entries(CATEGORY_META).map(([key, meta]) => (
                                <button
                                    key={key}
                                    className={`rounded-full border px-4 py-2 text-sm ${cat === key ? "bg-muted" : "hover:bg-muted/40"
                                        }`}
                                    onClick={() => setCat(key)}
                                >
                                    {meta.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {featured && (
                    <Link href={`/mysteries/${featured.id}`} className="block mt-8">
                        <Card className="rounded-3xl overflow-hidden border hover:bg-muted/20 transition-colors">
                            <div className={`grid md:grid-cols-2 bg-gradient-to-r ${CATEGORY_META[featured.category].gradientClass}`}>
                                <div className="aspect-[16/9] md:aspect-auto md:h-full text-white p-6">
                                    <div className="h-44 md:h-full rounded-2xl overflow-hidden border border-white/15">
                                        <CoverArt seed={featured.seed} />
                                    </div>
                                </div>

                                <CardContent className="p-6 md:p-8 space-y-3">
                                    <Badge className={`rounded-full border ${CATEGORY_META[featured.category].badgeClass}`}>
                                        {CATEGORY_META[featured.category].label}
                                    </Badge>
                                    <div className="text-2xl md:text-3xl font-semibold leading-tight">{featured.title}</div>
                                    <div className="text-muted-foreground">{featured.hook}</div>

                                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                        Open it to generate (first time) or read (cached).
                                    </p>
                                </CardContent>
                            </div>
                        </Card>
                    </Link>
                )}

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.slice(1).map((p) => (
                        <Link key={p.id} href={`/mysteries/${p.id}`}>
                            <Card className="rounded-3xl overflow-hidden hover:bg-muted/20 transition-colors">
                                <div className={`h-40 text-white bg-gradient-to-r ${CATEGORY_META[p.category].gradientClass} p-4`}>
                                    <div className="h-full rounded-2xl overflow-hidden border border-white/15">
                                        <CoverArt seed={p.seed} />
                                    </div>
                                </div>
                                <CardContent className="p-5 space-y-2">
                                    <Badge className={`rounded-full border ${CATEGORY_META[p.category].badgeClass}`}>
                                        {CATEGORY_META[p.category].label}
                                    </Badge>
                                    <div className="font-semibold leading-snug">{p.title}</div>
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{p.hook}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
