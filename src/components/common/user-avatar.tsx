import { cn } from "@/lib/utils";

const sizes = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

export function UserAvatar({
  src,
  name,
  size = "md",
  className,
}: {
  src: string | null;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full overflow-hidden border-2 border-border bg-muted text-muted-foreground font-bold shrink-0",
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </span>
  );
}
