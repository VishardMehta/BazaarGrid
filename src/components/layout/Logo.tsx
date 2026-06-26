import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  to?: string;
  onDark?: boolean;
}

/** BazaarGrid wordmark — serif, terracotta "Bazaar" + ink "Grid". */
export function Logo({ className, to = "/", onDark = false }: LogoProps) {
  return (
    <Link
      to={to}
      className={cn(
        "font-serif text-[22px] font-semibold leading-none tracking-tight",
        className,
      )}
    >
      <span className="text-primary">Bazaar</span>
      <span className={onDark ? "text-surface" : "text-on-surface"}>Grid</span>
    </Link>
  );
}
