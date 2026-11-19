import { memo } from "react";

// gitone mascot — the Octocat-as-racing-driver waving the checkered flag
// (public/mascot.webp, background keyed out). Landing page only. `animate`
// adds a gentle float; reduced motion collapses it via the global reset.
interface MascotProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

function Mascot({ size = 140, className, animate = false }: MascotProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mascot.webp"
      alt="gitone mascot — an octocat racing driver waving the checkered flag"
      width={size}
      height={size}
      className={className ?? ""}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "block",
        animation: animate ? "trophy-float 5s ease-in-out infinite" : undefined,
      }}
    />
  );
}

export default memo(Mascot);
