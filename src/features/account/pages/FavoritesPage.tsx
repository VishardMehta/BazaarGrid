import { Link } from "react-router-dom";
import { ProductCard, EmptyState, SectionHeading } from "@/components/shared";
import { useAuth } from "@/features/auth/AuthContext";
import { useCart } from "@/features/cart/CartContext";
import { useFavoriteProducts } from "@/lib/hooks/useFavorites";
import { mapProduct } from "@/lib/mappers";

export function FavoritesPage() {
  const { user } = useAuth();
  const { add } = useCart();
  const { data: dbProducts = [], isLoading } = useFavoriteProducts();
  const products = dbProducts.map(mapProduct);

  if (!user) {
    return (
      <div className="container-page py-token-lg">
        <EmptyState
          icon="favorite"
          title="Sign in to see your favorites"
          message="Save heritage goods you love and find them here anytime."
          action={{ label: "Sign in", to: "/login" }}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-token-md">
      <SectionHeading eyebrow="Saved for later" title="Your favorites" subtitle="Heritage goods you've hearted across the grid." />

      {isLoading ? (
        <div className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg bg-surface-low" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="favorite_border"
          title="No favorites yet"
          message="Tap the heart on any product to save it here."
          action={{ label: "Browse the shop", to: "/shop" }}
        />
      ) : (
        <div className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={() => add(p)} />
          ))}
        </div>
      )}

      <p className="mt-token-md text-center text-label-md text-on-surface-variant">
        Looking for something new? <Link to="/shop" className="font-semibold text-secondary hover:text-primary">Explore the catalog →</Link>
      </p>
    </div>
  );
}
