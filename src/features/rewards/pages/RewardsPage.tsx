import { Button, Card, Icon } from "@/components/ui";
import { SectionHeading, Reveal, RevealItem } from "@/components/shared";
import { compact } from "@/lib/format";
import { gradientFor } from "@/lib/placeholder";
import { rewards, currentBuyer } from "@/shared/mocks";

const EARN_HISTORY = [
  { label: "Order BG-8401 reward", tokens: "+120" },
  { label: "Verified producer review", tokens: "+50" },
  { label: "Referred a friend", tokens: "+200" },
];

export function RewardsPage() {
  const balance = currentBuyer.rewardsBalance ?? 0;
  const featured = rewards.find((r) => r.featured);
  const rest = rewards.filter((r) => !r.featured);

  return (
    <div className="container-page py-token-md">
      {/* Hero */}
      <section className="grid items-center gap-token-md rounded-xl bg-surface-low p-token-md md:grid-cols-[1.4fr_1fr] md:p-token-lg">
        <div>
          <p className="text-label-md uppercase tracking-[0.1em] text-primary">Harvest Rewards</p>
          <h1 className="mt-2 font-serif text-display-lg text-[2.5rem] font-semibold leading-tight text-on-surface">
            Your seasonal yield is flourishing
          </h1>
          <p className="mt-3 max-w-md text-body-lg text-on-surface-variant">
            Every purchase supports local artisans and earns you Harvest Tokens.
            Redeem them for tours, discounts and exclusive community benefits.
          </p>
          <div className="mt-5 flex gap-3">
            <Button icon="redeem">Redeem now</Button>
            <Button variant="secondary" icon="help">How it works</Button>
          </div>
        </div>
        <div className="relative mx-auto grid h-44 w-44 place-items-center rounded-full" style={{ backgroundImage: gradientFor("rewards") }}>
          <div className="grid h-36 w-36 place-items-center rounded-full bg-surface text-center">
            <div>
              <p className="font-serif text-[2.5rem] font-semibold leading-none text-primary">{compact(balance)}</p>
              <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">Harvest Tokens</p>
            </div>
          </div>
          <Icon name="star" size={28} filled className="absolute -right-1 top-4 text-tertiary-fixed-dim" />
        </div>
      </section>

      <div className="mt-token-lg grid gap-token-md lg:grid-cols-[1.6fr_1fr]">
        {/* Available rewards */}
        <div>
          <SectionHeading eyebrow="Available Rewards" title="Redeem your harvest" />
          {featured && (
            <div
              className="mt-token-md relative overflow-hidden rounded-xl p-token-md text-surface-lowest md:p-token-lg"
              style={{ backgroundImage: gradientFor(featured.id) }}
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 text-label-sm font-semibold text-on-surface">
                <Icon name="star" size={14} filled /> Featured
              </span>
              <h3 className="mt-3 font-serif text-headline-lg font-medium">{featured.title}</h3>
              <p className="mt-1 max-w-md text-body-md text-surface-lowest/90">{featured.description}</p>
              <div className="mt-4 flex items-center gap-3">
                <Button variant="tertiary" icon="redeem">Redeem · {compact(featured.costTokens)} tokens</Button>
              </div>
            </div>
          )}
          <Reveal as="div" stagger={0.08} className="mt-token-md grid gap-token-md sm:grid-cols-2">
            {rest.map((r) => (
              <RevealItem key={r.id}>
                <Card padding="md" interactive className="flex h-full flex-col">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-tertiary-fixed text-tertiary-on-container">
                    <Icon name="card_giftcard" size={22} />
                  </span>
                  <h3 className="mt-3 font-serif text-headline-md font-medium text-on-surface">{r.title}</h3>
                  <p className="mt-1 flex-1 text-body-md text-on-surface-variant">{r.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-label-md font-semibold text-primary">{compact(r.costTokens)} tokens</span>
                    <Button size="sm" disabled={balance < r.costTokens}>
                      {balance < r.costTokens ? "Not enough" : "Redeem"}
                    </Button>
                  </div>
                </Card>
              </RevealItem>
            ))}
          </Reveal>
        </div>

        {/* Earning history */}
        <aside className="space-y-token-md">
          <Card padding="md" className="bg-primary text-primary-on">
            <h3 className="font-serif text-headline-md font-medium">Harvest Festival</h3>
            <p className="mt-1 text-body-md text-primary-on/85">
              Double tokens on all village producer orders this week.
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-on/20">
              <div className="h-full w-2/3 rounded-full bg-tertiary-fixed" />
            </div>
            <p className="mt-1 text-label-sm text-primary-on/80">670 / 1000 tokens to next tier</p>
          </Card>

          <Card padding="md">
            <h3 className="font-serif text-headline-md font-medium text-on-surface">Earning history</h3>
            <ul className="mt-2 divide-y divide-surface-highest">
              {EARN_HISTORY.map((e) => (
                <li key={e.label} className="flex items-center justify-between py-2.5 text-body-md">
                  <span className="text-on-surface-variant">{e.label}</span>
                  <span className="font-semibold text-secondary">{e.tokens}</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
