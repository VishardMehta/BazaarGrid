import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ButtonLink, Icon } from "@/components/ui";
import {
  ProductCard,
  Reveal,
  RevealItem,
  SectionHeading,
  TrustBadge,
} from "@/components/shared";
import { gradientFor } from "@/lib/placeholder";
import { useCart } from "@/features/cart/CartContext";
import { useSellers } from "@/lib/hooks/useSellers";
import { useProducts } from "@/lib/hooks/useProducts";
import { mapProduct, mapSeller } from "@/lib/mappers";
import { SearchBar } from "@/features/search/components/SearchBar";

const TRUST_STEPS = [
  { icon: "agriculture", title: "Sourced", text: "Grown or made by a verified village producer." },
  { icon: "verified", title: "Verified", text: "Identity and origin checked on the grid." },
  { icon: "qr_code_2", title: "Traceable", text: "Every batch carries a scannable passport." },
  { icon: "local_shipping", title: "Delivered", text: "Carbon-neutral, straight from source to you." },
];

export function LandingPage() {
  const { add } = useCart();
  const { data: dbSellers  = [] } = useSellers();
  const { data: dbProducts = [] } = useProducts();
  const villages = dbSellers.filter((s) => s.type === "VILLAGE_PRODUCER").slice(0, 3).map(mapSeller);
  const featured = dbProducts.slice(0, 4).map(mapProduct);

  return (
    <div className="pb-token-lg">
      {/* Hero */}
      <section className="container-page grid items-center gap-token-lg py-token-lg lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1 text-label-md font-semibold text-secondary-on-container">
            <Icon name="eco" size={16} filled /> Heritage marketplace
          </span>
          <h1 className="mt-4 font-serif text-[clamp(2.5rem,6vw,3.5rem)] font-semibold leading-[1.05] text-on-surface">
            Know Your <span className="text-primary italic">Village</span>.
            <br />
            Know Your Food.
          </h1>
          <p className="mt-5 max-w-md text-body-lg text-on-surface-variant">
            Discover packaged farm goods and handmade craft from verified village
            producers and trusted local kirana stores — with origin you can trace,
            scan and trust.
          </p>
          <SearchBar
            size="lg"
            placeholder="Try 'forest honey', 'cold-pressed oil', 'handmade pottery'…"
            className="mt-6 max-w-md"
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink to="/shop" size="lg" icon="storefront">
              Shop the grid
            </ButtonLink>
            <ButtonLink to="/become-a-producer" size="lg" variant="secondary" icon="add_business">
              Become a producer
            </ButtonLink>
          </div>
          <dl className="mt-9 flex gap-token-lg">
            {[
              ["24", "Heritage Villages"],
              ["600+", "Verified Producers"],
              ["100%", "Traceable Orders"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="font-serif text-headline-lg font-semibold text-on-surface">{n}</dt>
                <dd className="text-label-md text-on-surface-variant">{l}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-tinted-lg"
          style={{ backgroundImage: gradientFor("hero-landing") }}
        >
          <div className="absolute inset-0 grid place-items-center">
            <Icon name="potted_plant" size={120} className="text-surface-lowest/40" />
          </div>
          <div className="absolute bottom-4 left-4 rounded-lg bg-surface/90 px-4 py-3 backdrop-blur">
            <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">Now harvesting</p>
            <p className="font-serif text-body-lg font-medium text-on-surface">Val di Sole Heritage Valley</p>
          </div>
          <TrustBadge kind="verified" className="absolute right-4 top-4" />
        </motion.div>
      </section>

      {/* Pioneer villages */}
      <section className="container-page py-token-lg">
        <SectionHeading
          eyebrow="Pioneer Villages"
          title="Communities leading the harvest"
          action={{ label: "All villages", to: "/villages" }}
        />
        <Reveal as="div" stagger={0.12} className="mt-token-md grid gap-token-md md:grid-cols-3">
          {villages.map((s) => (
            <RevealItem key={s.id} as="article">
              <Link
                to={`/seller/${s.id}`}
                className="group block overflow-hidden rounded-lg border border-surface-highest bg-surface-lowest transition-all hover:border-primary hover:shadow-tinted"
              >
                <div
                  className="relative aspect-[16/10]"
                  style={{ backgroundImage: gradientFor(s.id) }}
                >
                  <TrustBadge kind="verified" compact className="absolute right-3 top-3" />
                  <div className="absolute inset-0 grid place-items-center">
                    <Icon name="cottage" size={56} className="text-surface-lowest/40" />
                  </div>
                </div>
                <div className="p-token-md">
                  <h3 className="font-serif text-headline-md font-medium text-on-surface group-hover:text-primary">
                    {s.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-body-md text-on-surface-variant">{s.tagline}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-label-md font-semibold text-secondary">
                    Visit storefront <Icon name="arrow_forward" size={16} />
                  </span>
                </div>
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      </section>

      {/* Curated harvest */}
      <section className="bg-surface-low py-token-lg">
        <div className="container-page">
          <SectionHeading
            eyebrow="Curated Harvest"
            title="Hand-picked from this week's makers"
            action={{ label: "Shop all", to: "/shop" }}
          />
          <Reveal as="div" stagger={0.08} className="mt-token-md grid grid-cols-2 gap-token-md lg:grid-cols-4">
            {featured.map((p) => (
              <RevealItem key={p.id}>
                <ProductCard product={p} onAdd={add} />
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Journey of trust */}
      <section className="container-page py-token-lg">
        <SectionHeading align="center" eyebrow="The Journey of Trust" title="Four steps from soil to table" />
        <Reveal as="div" stagger={0.1} className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_STEPS.map((step, i) => (
            <RevealItem key={step.title} className="relative text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary-container text-secondary-on-container">
                <Icon name={step.icon} size={30} />
              </div>
              <span className="absolute left-1/2 top-0 -translate-x-1/2 text-label-sm font-bold text-primary">
                0{i + 1}
              </span>
              <h3 className="mt-4 font-serif text-headline-md font-medium text-on-surface">{step.title}</h3>
              <p className="mt-1 text-body-md text-on-surface-variant">{step.text}</p>
            </RevealItem>
          ))}
        </Reveal>
      </section>

      {/* Dual CTA */}
      <section className="container-page grid gap-token-md py-token-md md:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl bg-primary p-token-md text-primary-on md:p-8">
          <h3 className="font-serif text-headline-lg font-medium">Are you a producer?</h3>
          <p className="mt-2 max-w-sm text-body-md text-primary-on/85">
            List your village goods, reach conscious buyers, and let the grid prove
            your provenance for you.
          </p>
          <ButtonLink to="/become-a-producer" variant="tertiary" className="mt-5">
            Start selling
          </ButtonLink>
          <Icon name="storefront" size={140} className="pointer-events-none absolute -bottom-6 -right-4 text-primary-on/10" />
        </div>
        <div className="relative overflow-hidden rounded-xl bg-secondary p-token-md text-secondary-on md:p-8">
          <h3 className="font-serif text-headline-lg font-medium">Scan. Trace. Trust.</h3>
          <p className="mt-2 max-w-sm text-body-md text-secondary-on/85">
            Every order ships with a QR passport — follow your purchase back to the
            exact hands and hills it came from.
          </p>
          <ButtonLink to="/shop" variant="tertiary" className="mt-5">
            See how it works
          </ButtonLink>
          <Icon name="qr_code_2" size={140} className="pointer-events-none absolute -bottom-6 -right-4 text-secondary-on/10" />
        </div>
      </section>
    </div>
  );
}
