import { ButtonLink, Icon } from "@/components/ui";

export function NotFoundPage() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-token-lg text-center">
      <div>
        <Icon name="travel_explore" size={72} className="text-outline" />
        <h1 className="mt-4 font-serif text-display-lg text-[3rem] font-semibold text-on-surface">404</h1>
        <p className="mt-2 max-w-sm text-body-lg text-on-surface-variant">
          This path doesn't lead to a village. Let's get you back to the harvest.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink to="/" icon="home">Back home</ButtonLink>
          <ButtonLink to="/shop" variant="secondary" icon="storefront">Browse the grid</ButtonLink>
        </div>
      </div>
    </div>
  );
}
