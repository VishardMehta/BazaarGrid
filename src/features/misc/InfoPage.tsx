import { SectionHeading } from "@/components/shared";
import { Card, Icon } from "@/components/ui";

const CONTENT = {
  about: {
    eyebrow: "Our Mission",
    title: "Connecting heritage craft with modern precision",
    body: "BazaarGrid is a decentralised marketplace of verified village producers and trusted local kirana stores. We make provenance visible — so every jar, bottle and weave can be traced back to the hands and hills it came from.",
    points: [
      { icon: "diversity_3", title: "Producer-first", text: "Fair reach and rewards for village makers." },
      { icon: "verified", title: "Verified trust", text: "Identity and origin checked on the grid." },
      { icon: "eco", title: "Carbon-neutral", text: "Sustainable delivery from source to door." },
    ],
  },
  help: {
    eyebrow: "Support",
    title: "Help & resources",
    body: "Find answers on ordering, traceability, returns and becoming a producer. Still stuck? Reach the BazaarGrid team any time.",
    points: [
      { icon: "qr_code_2", title: "Traceability guide", text: "How to scan and read a product passport." },
      { icon: "local_shipping", title: "Shipping & pickup", text: "Delivery windows and village pickup points." },
      { icon: "support_agent", title: "Contact us", text: "support@bazaargrid.example · Mon–Sat" },
    ],
  },
} as const;

export function InfoPage({ kind }: { kind: keyof typeof CONTENT }) {
  const c = CONTENT[kind];
  return (
    <div className="container-page py-token-lg">
      <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.body} align="center" />
      <div className="mt-token-lg grid gap-token-md md:grid-cols-3">
        {c.points.map((p) => (
          <Card key={p.title} padding="lg" className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary-container text-secondary-on-container">
              <Icon name={p.icon} size={28} />
            </span>
            <h3 className="mt-4 font-serif text-headline-md font-medium text-on-surface">{p.title}</h3>
            <p className="mt-1 text-body-md text-on-surface-variant">{p.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
