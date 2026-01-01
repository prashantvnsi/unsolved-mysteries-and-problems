import Link from "next/link";

const STYLES = [
    { key: "default", label: "Default" },
    { key: "short", label: "Short" },
    { key: "eli12", label: "Explain like I'm 12" },
    { key: "technical", label: "Technical" },
    { key: "analogies", label: "More analogies" },
];

export default function StyleSwitcher({ id, active }: { id: string; active: string }) {
    return (
        <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => {
                const isActive = s.key === active;
                return (
                    <Link
                        key={s.key}
                        href={`/mysteries/${id}?style=${encodeURIComponent(s.key)}`}
                        className={`rounded-full border px-3 py-1 text-xs transition ${isActive ? "bg-muted" : "hover:bg-muted/30"
                            }`}
                    >
                        {s.label}
                    </Link>
                );
            })}
        </div>
    );
}
