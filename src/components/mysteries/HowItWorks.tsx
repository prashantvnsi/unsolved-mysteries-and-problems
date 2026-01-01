"use client";

import { useState } from "react";

export default function HowItWorks() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-full border px-4 py-2 text-sm hover:bg-muted/30 transition"
            >
                How articles are made
            </button>

            {open && (
                <div className="fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setOpen(false)}
                        aria-hidden="true"
                    />
                    <div className="absolute left-1/2 top-1/2 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-background p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Behind the scenes</div>
                                <h3 className="mt-1 text-2xl font-semibold">AI-generated, validated, cached forever</h3>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-full border px-3 py-1 text-sm hover:bg-muted/30"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
                            <div className="rounded-2xl border bg-muted/10 p-4">
                                <div className="font-medium text-foreground">1) Curated seed topics</div>
                                Each mystery has a curated “topic card” (id, hook, known/unknown, hypotheses, tests). That’s your grounding.
                            </div>

                            <div className="rounded-2xl border bg-muted/10 p-4">
                                <div className="font-medium text-foreground">2) LLM generation (Groq)</div>
                                First visitor triggers generation. The model returns structured JSON (not markdown), so the site can render reliably.
                            </div>

                            <div className="rounded-2xl border bg-muted/10 p-4">
                                <div className="font-medium text-foreground">3) Schema validation (Zod)</div>
                                We validate the JSON shape. If something is missing or malformed, we sanitize and/or retry once.
                            </div>

                            <div className="rounded-2xl border bg-muted/10 p-4">
                                <div className="font-medium text-foreground">4) Redis caching (Upstash)</div>
                                Once generated, it’s stored. Everyone else reads cached content — fast and cost-free.
                            </div>

                            <div className="rounded-2xl border bg-muted/10 p-4">
                                <div className="font-medium text-foreground">5) Locking to avoid duplicates</div>
                                A short lock key prevents 50 people from generating the same article at the same time.
                            </div>
                        </div>

                        <div className="mt-5 text-xs text-muted-foreground">
                            This is the “AI engineering” part: controlled generation + validation + caching + observability-friendly design.
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
