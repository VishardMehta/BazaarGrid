import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";
import { useAuth } from "@/features/auth/AuthContext";
import { useFavoriteIds, useToggleFavorite } from "@/lib/hooks/useFavorites";

interface Props {
  productId: string;
  className?: string;
  size?: number;
}

/** Heart toggle. Adds/removes a favorite; sends signed-out users to login once. */
export function FavoriteButton({ productId, className, size = 18 }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: favIds } = useFavoriteIds();
  const toggle = useToggleFavorite();
  const active = favIds?.has(productId) ?? false;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/login", { state: { from: { pathname: window.location.pathname } } }); return; }
    toggle.mutate({ productId, on: !active });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={active}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-surface/90 backdrop-blur transition-transform hover:scale-105 active:scale-95",
        active ? "text-primary" : "text-on-surface-variant",
        className,
      )}
    >
      <Icon name="favorite" size={size} filled={active} />
    </button>
  );
}
