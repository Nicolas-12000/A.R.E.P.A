import { cn } from "@/lib/cn";

/** Arepa mascot. Blinks on its own and tilts when its parent `group` is hovered. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className={cn(
        "size-7 transition-transform duration-300 ease-out motion-safe:group-hover:-rotate-8",
        className,
      )}
    >
      <ellipse cx="24" cy="25" rx="20" ry="18.5" fill="var(--color-mark)" stroke="var(--color-primary)" strokeWidth="1.75" />
      <ellipse cx="17" cy="13.5" rx="7" ry="2.6" transform="rotate(-18 17 13.5)" fill="var(--color-surface)" opacity="0.4" />

      <g fill="var(--color-primary)" opacity="0.16">
        <circle cx="34" cy="13.5" r="1.1" />
        <circle cx="38.5" cy="21" r="0.9" />
        <circle cx="9.5" cy="21.5" r="0.9" />
        <circle cx="30" cy="38.5" r="1.2" />
        <circle cx="16" cy="38" r="0.9" />
      </g>

      <g className="origin-center transform-fill motion-safe:animate-blink">
        <ellipse cx="17" cy="23" rx="2.4" ry="2.9" fill="var(--color-primary)" />
        <ellipse cx="31" cy="23" rx="2.4" ry="2.9" fill="var(--color-primary)" />
        <circle cx="17.9" cy="21.9" r="0.85" fill="var(--color-surface)" />
        <circle cx="31.9" cy="21.9" r="0.85" fill="var(--color-surface)" />
      </g>

      <ellipse cx="11.5" cy="29" rx="3.4" ry="2.1" fill="var(--color-mora)" opacity="0.35" />
      <ellipse cx="36.5" cy="29" rx="3.4" ry="2.1" fill="var(--color-mora)" opacity="0.35" />

      <path d="M19 28.6Q24 35.4 29 28.6Z" fill="var(--color-primary)" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="24" cy="32" rx="2.3" ry="1.3" fill="var(--color-mora)" opacity="0.9" />
    </svg>
  );
}
