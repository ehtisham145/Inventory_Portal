interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const HEIGHTS: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-14",
  md: "h-20",
  lg: "h-24",
};

/** The logo has white text baked into the image, so it needs a dark backdrop to stay legible
 * on our light pages — this wraps it in one consistently everywhere it's used. */
export function Logo({ size = "md", className = "" }: LogoProps) {
  return (
    <div
      className={`inline-flex flex-col items-center gap-2 rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-black px-6 py-4 shadow-md ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.webp" alt="Al Merak Tax Consultant L.L.C." className={`w-auto ${HEIGHTS[size]}`} />
      <span className="h-px w-10 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
      <p className="text-center text-[11px] font-semibold uppercase leading-tight tracking-widest text-gray-300">
        Confirmation &amp; Approval Portal
      </p>
    </div>
  );
}
