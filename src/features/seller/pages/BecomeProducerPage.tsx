import { ButtonLink, Card, Icon } from "@/components/ui";
import { SectionHeading, Reveal, RevealItem } from "@/components/shared";

const STEPS = [
  { icon: "badge", title: "Claim your identity", text: "Register your village producer or kirana store and verify who you are." },
  { icon: "inventory_2", title: "List your goods", text: "Add products one by one or bulk-upload a CSV with images and pricing." },
  { icon: "qr_code_2", title: "Get traceable", text: "We mint a QR passport per batch so buyers can trust every order." },
  { icon: "payments", title: "Earn & grow", text: "Reach conscious buyers, fulfil by delivery or pickup, and collect rewards." },
];

const BENEFITS = [
  ["storefront", "Your own storefront", "A branded village page with your story, products and trust badges."],
  ["insights", "Real demand signals", "See what buyers search for and which goods are trending."],
  ["verified", "Verified credibility", "Stand out with producer verification and full origin traceability."],
];

export function BecomeProducerPage() {
  return (
    <div className="pb-token-lg">
      <section className="bg-secondary py-token-lg text-secondary-on">
        <div className="container-page max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary-on/15 px-3 py-1 text-label-md font-semibold">
            <Icon name="add_business" size={16} /> Sell on BazaarGrid
          </span>
          <h1 className="mt-4 font-serif text-display-lg text-[2.75rem] font-semibold leading-tight">
            Bring your village goods to the grid
          </h1>
          <p className="mt-4 text-body-lg text-secondary-on/85">
            Whether you're a heritage producer or a neighbourhood kirana store, list
            your goods, prove your provenance, and reach buyers who care where their
            food comes from.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <ButtonLink to="/producer" variant="tertiary" size="lg" icon="dashboard">
              Open producer portal
            </ButtonLink>
            <ButtonLink to="/village-admin" variant="primary" size="lg" icon="groups">
              Village admin
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="container-page py-token-lg">
        <SectionHeading align="center" eyebrow="How it works" title="Four steps to your first sale" />
        <Reveal as="div" stagger={0.1} className="mt-token-md grid gap-token-md sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <RevealItem key={s.title}>
              <Card padding="md" className="h-full">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-on">
                  <Icon name={s.icon} size={24} />
                </span>
                <p className="mt-3 text-label-sm font-bold text-primary">STEP 0{i + 1}</p>
                <h3 className="mt-1 font-serif text-headline-md font-medium text-on-surface">{s.title}</h3>
                <p className="mt-1 text-body-md text-on-surface-variant">{s.text}</p>
              </Card>
            </RevealItem>
          ))}
        </Reveal>
      </section>

      <section className="container-page grid gap-token-md md:grid-cols-3">
        {BENEFITS.map(([icon, title, text]) => (
          <Card key={title} padding="lg">
            <Icon name={icon} size={30} className="text-secondary" />
            <h3 className="mt-3 font-serif text-headline-md font-medium text-on-surface">{title}</h3>
            <p className="mt-1 text-body-md text-on-surface-variant">{text}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
