import { useState } from "react";
import { Button, Card, Icon } from "@/components/ui";
import { SectionHeading, Reveal, RevealItem } from "@/components/shared";
import { compact } from "@/lib/format";
import { gradientFor } from "@/lib/placeholder";
import { rewards } from "@/shared/mocks";
import { useAuth } from "@/features/auth/AuthContext";
import { useRewardBalance, useRedeemReward } from "@/lib/hooks/useRewards";

/**
 * Harvest Rewards maths
 * ──────────────────────
 * EARN:  1 Harvest Token per ₹10 spent  (₹1000 order → 100 tokens)
 * REDEEM: 100 tokens = ₹10 discount
 * FREE DELIVERY: 500 tokens = free delivery on next 3 orders
 * TIERS (lifetime tokens earned, not balance):
 *   BRONZE   0–999
 *   SILVER   1000–4999
 *   GOLD     5000–9999
 *   PLATINUM 10000+
 */

const TIER_CONFIG = [
  { name: "BRONZE",   min: 0,     max: 999,   color: "bg-primary/70",            icon: "grade" },
  { name: "SILVER",   min: 1000,  max: 4999,  color: "bg-outline",               icon: "grade" },
  { name: "GOLD",     min: 5000,  max: 9999,  color: "bg-tertiary-fixed-dim",    icon: "workspace_premium" },
  { name: "PLATINUM", min: 10000, max: Infinity, color: "bg-secondary",          icon: "diamond" },
] as const;

const EARN_HISTORY = [
  { label: "Order BG-8401 (₹1,200 spend)",  tokens: "+120", date: "2 days ago" },
  { label: "Verified producer review",       tokens: "+50",  date: "5 days ago" },
  { label: "Referred a friend",              tokens: "+200", date: "1 week ago" },
  { label: "Order BG-7890 (₹3,000 spend)",  tokens: "+300", date: "2 weeks ago" },
  { label: "First QR scan (onboarding)",     tokens: "+100", date: "1 month ago" },
];

function tierForBalance(balance: number) {
  return TIER_CONFIG.find((t) => balance >= t.min && balance <= t.max) ?? TIER_CONFIG[0];
}

function progressToNextTier(balance: number): { pct: number; next: string; needed: number } {
  const tier = tierForBalance(balance);
  if (tier.name === "PLATINUM") return { pct: 100, next: "Platinum", needed: 0 };
  const nextTier = TIER_CONFIG[TIER_CONFIG.indexOf(tier) + 1];
  const range = nextTier.min - tier.min;
  const progress = balance - tier.min;
  return {
    pct: Math.min(100, Math.round((progress / range) * 100)),
    next: nextTier.name.charAt(0) + nextTier.name.slice(1).toLowerCase(),
    needed: nextTier.min - balance,
  };
}

export function RewardsPage() {
  const { profile } = useAuth();
  const { data: liveBalance = 0 } = useRewardBalance(profile?.id ?? null);
  const redeemMutation = useRedeemReward();

  // Optimistic local balance for instant feedback
  const [localDeduct, setLocalDeduct] = useState(0);
  const balance = liveBalance - localDeduct;

  const [redeemed, setRedeemed] = useState<string[]>([]);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [redeemModal, setRedeemModal] = useState<string | null>(null);

  const featured = rewards.find((r) => r.featured);
  const rest = rewards.filter((r) => !r.featured);
  const tier = tierForBalance(balance);
  const { pct, next, needed } = progressToNextTier(balance);

  async function handleRedeem(rewardId: string, cost: number, description: string) {
    if (balance < cost || redeemed.includes(rewardId)) return;
    setLocalDeduct((d) => d + cost);
    setRedeemed((r) => [...r, rewardId]);
    setRedeemModal(rewardId);
    setTimeout(() => setRedeemModal(null), 3000);
    if (profile) {
      await redeemMutation.mutateAsync({ profileId: profile.id, points: cost, description });
      // Sync actual balance from server after mutation
      setLocalDeduct(0);
    }
  }

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
            Earn <strong>1 Harvest Token per ₹10 spent</strong>. Redeem for discounts, free delivery, and exclusive producer experiences.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button icon="redeem" onClick={() => document.getElementById("rewards-grid")?.scrollIntoView({ behavior: "smooth" })}>
              Redeem now
            </Button>
            <Button variant="secondary" icon={showHowItWorks ? "expand_less" : "help"} onClick={() => setShowHowItWorks((v) => !v)}>
              How it works
            </Button>
          </div>
        </div>

        {/* Balance ring */}
        <div className="relative mx-auto grid h-44 w-44 place-items-center rounded-full" style={{ backgroundImage: gradientFor("rewards") }}>
          <div className="grid h-36 w-36 place-items-center rounded-full bg-surface text-center">
            <div>
              <p className="font-serif text-[2.5rem] font-semibold leading-none text-primary">{compact(balance)}</p>
              <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">Harvest Tokens</p>
            </div>
          </div>
          <span className={`absolute -right-1 top-3 grid h-9 w-9 place-items-center rounded-full ${tier.color} text-surface-lowest shadow`}>
            <Icon name={tier.icon} size={18} filled />
          </span>
        </div>
      </section>

      {/* "How it works" expandable */}
      {showHowItWorks && (
        <Card padding="md" className="mt-token-md border border-secondary/20">
          <h2 className="font-serif text-headline-md font-medium text-on-surface flex items-center gap-2">
            <Icon name="help" size={20} className="text-secondary" /> How Harvest Rewards work
          </h2>
          <div className="mt-token-md grid gap-token-md sm:grid-cols-3">
            {[
              {
                icon: "shopping_bag",
                title: "Shop & Earn",
                body: "Earn 1 token for every ₹10 you spend. A ₹1,000 order earns you 100 tokens automatically.",
              },
              {
                icon: "redeem",
                title: "Redeem Anytime",
                body: "100 tokens = ₹10 discount on your next order. 500 tokens = free delivery on next 3 orders.",
              },
              {
                icon: "workspace_premium",
                title: "Climb the Tiers",
                body: "Bronze → Silver → Gold → Platinum. Higher tiers unlock exclusive events and double-token campaigns.",
              },
            ].map((step) => (
              <div key={step.title} className="rounded-lg bg-surface-low p-token-sm">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary-container text-secondary-on-container">
                  <Icon name={step.icon} size={20} />
                </span>
                <h3 className="mt-3 font-serif text-headline-md font-medium text-on-surface">{step.title}</h3>
                <p className="mt-1 text-body-md text-on-surface-variant">{step.body}</p>
              </div>
            ))}
          </div>

          {/* Tier breakdown */}
          <div className="mt-token-md">
            <h3 className="font-serif text-headline-md font-medium text-on-surface">Loyalty tiers</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-label-md">
                <thead className="text-on-surface-variant">
                  <tr>
                    <th className="py-2 font-semibold">Tier</th>
                    <th className="py-2 font-semibold">Token balance</th>
                    <th className="py-2 font-semibold">Perks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-highest">
                  {TIER_CONFIG.map((t) => (
                    <tr key={t.name} className={balance >= t.min && balance <= t.max ? "bg-secondary-container/30" : ""}>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-on-surface">
                          <span className={`grid h-5 w-5 place-items-center rounded-full ${t.color} text-surface-lowest`}>
                            <Icon name={t.icon} size={12} filled />
                          </span>
                          {t.name.charAt(0) + t.name.slice(1).toLowerCase()}
                          {balance >= t.min && balance <= t.max && (
                            <span className="ml-1 text-label-sm text-secondary">(You)</span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 text-on-surface-variant">
                        {t.max === Infinity ? `${t.min.toLocaleString()}+` : `${t.min.toLocaleString()} – ${t.max.toLocaleString()}`}
                      </td>
                      <td className="py-2.5 text-on-surface-variant">
                        {t.name === "BRONZE"   && "Standard token earn rate"}
                        {t.name === "SILVER"   && "1.5× earn rate, early sale access"}
                        {t.name === "GOLD"     && "2× earn rate, free monthly delivery"}
                        {t.name === "PLATINUM" && "3× earn rate, VIP producer tours, priority support"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Button className="mt-4" variant="secondary" onClick={() => setShowHowItWorks(false)} icon="expand_less">
            Close
          </Button>
        </Card>
      )}

      {/* Tier progress */}
      <Card padding="md" className="mt-token-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">Your tier</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-full ${tier.color} text-surface-lowest`}>
                <Icon name={tier.icon} size={16} filled />
              </span>
              <span className="font-serif text-headline-lg font-semibold text-on-surface">
                {tier.name.charAt(0) + tier.name.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
          {tier.name !== "PLATINUM" && (
            <div className="min-w-48 flex-1 max-w-xs">
              <div className="flex justify-between text-label-sm text-on-surface-variant mb-1">
                <span>{balance.toLocaleString()} tokens</span>
                <span>{needed.toLocaleString()} to {next}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-highest">
                <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Redemption options quick-access */}
      <div className="mt-token-md grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: "local_shipping", title: "Free Delivery",    cost: 500,  desc: "Next 3 orders" },
          { icon: "percent",        title: "₹10 Off",          cost: 100,  desc: "Any single order" },
          { icon: "percent",        title: "₹50 Off",          cost: 500,  desc: "Orders above ₹500" },
          { icon: "percent",        title: "₹120 Credit",      cost: 1000, desc: "Store credit, any time" },
        ].map((opt) => {
          const canRedeem = balance >= opt.cost;
          const key = `quick_${opt.title}`;
          const wasRedeemed = redeemed.includes(key);
          return (
            <button
              key={opt.title}
              disabled={!canRedeem || wasRedeemed}
              onClick={() => { if (canRedeem) handleRedeem(key, opt.cost, opt.title); }}
              className={`flex flex-col items-start rounded-lg border p-token-sm text-left transition-all ${
                wasRedeemed
                  ? "border-secondary bg-secondary-container/30"
                  : canRedeem
                  ? "border-outline-variant bg-surface-lowest hover:border-primary hover:shadow-tinted cursor-pointer"
                  : "border-surface-highest bg-surface-low opacity-60 cursor-not-allowed"
              }`}
            >
              <span className={`grid h-10 w-10 place-items-center rounded-full ${canRedeem ? "bg-secondary-container text-secondary-on-container" : "bg-surface-highest text-on-surface-variant"}`}>
                <Icon name={wasRedeemed ? "check" : opt.icon} size={20} />
              </span>
              <span className="mt-2 font-serif text-body-lg font-medium text-on-surface">{opt.title}</span>
              <span className="text-label-sm text-on-surface-variant">{opt.desc}</span>
              <span className={`mt-2 text-label-md font-semibold ${canRedeem ? "text-primary" : "text-on-surface-variant"}`}>
                {wasRedeemed ? "Redeemed ✓" : `${opt.cost} tokens`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Redemption success */}
      {redeemModal && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-secondary px-6 py-3 text-secondary-on shadow-tinted">
          <Icon name="check_circle" size={20} filled />
          <span className="font-semibold">Redeemed! Your balance: {balance.toLocaleString()} tokens</span>
        </div>
      )}

      <div className="mt-token-lg grid gap-token-md lg:grid-cols-[1.6fr_1fr]">
        {/* Available rewards */}
        <div id="rewards-grid">
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
                <Button
                  variant="tertiary"
                  icon={redeemed.includes(featured.id) ? "check" : "redeem"}
                  disabled={balance < featured.costTokens || redeemed.includes(featured.id)}
                  onClick={() => handleRedeem(featured.id, featured.costTokens, featured.title)}
                >
                  {redeemed.includes(featured.id)
                    ? "Redeemed!"
                    : balance < featured.costTokens
                    ? `Need ${(featured.costTokens - balance).toLocaleString()} more tokens`
                    : `Redeem · ${compact(featured.costTokens)} tokens`}
                </Button>
              </div>
            </div>
          )}
          <Reveal as="div" stagger={0.08} className="mt-token-md grid gap-token-md sm:grid-cols-2">
            {rest.map((r) => (
              <RevealItem key={r.id}>
                <Card padding="md" interactive className="flex h-full flex-col">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-tertiary-fixed text-tertiary-on-container">
                    <Icon name={redeemed.includes(r.id) ? "check" : "card_giftcard"} size={22} />
                  </span>
                  <h3 className="mt-3 font-serif text-headline-md font-medium text-on-surface">{r.title}</h3>
                  <p className="mt-1 flex-1 text-body-md text-on-surface-variant">{r.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-label-md font-semibold text-primary">{compact(r.costTokens)} tokens</span>
                    <Button
                      size="sm"
                      disabled={balance < r.costTokens || redeemed.includes(r.id)}
                      onClick={() => handleRedeem(r.id, r.costTokens, r.title)}
                    >
                      {redeemed.includes(r.id) ? "Redeemed ✓" : balance < r.costTokens ? "Not enough" : "Redeem"}
                    </Button>
                  </div>
                </Card>
              </RevealItem>
            ))}
          </Reveal>
        </div>

        {/* Earn history + promo */}
        <aside className="space-y-token-md">
          <Card padding="md" className="bg-primary text-primary-on">
            <h3 className="font-serif text-headline-md font-medium">Harvest Festival</h3>
            <p className="mt-1 text-body-md text-primary-on/85">
              Double tokens on all village producer orders this week.
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-on/20">
              <div className="h-full w-2/3 rounded-full bg-tertiary-fixed" />
            </div>
            <p className="mt-1 text-label-sm text-primary-on/80">{(balance % 1000)} / 1000 tokens to next tier bonus</p>
          </Card>

          <Card padding="md">
            <h3 className="font-serif text-headline-md font-medium text-on-surface">Earning rates</h3>
            <ul className="mt-3 divide-y divide-surface-highest">
              {[
                { action: "Every ₹10 spent",           tokens: "1 token" },
                { action: "Leave a verified review",    tokens: "50 tokens" },
                { action: "Refer a friend",             tokens: "200 tokens" },
                { action: "Scan a QR passport",         tokens: "5 tokens" },
                { action: "Double-token campaign",      tokens: "2× rate" },
              ].map((e) => (
                <li key={e.action} className="flex items-center justify-between py-2.5 text-body-md">
                  <span className="text-on-surface-variant">{e.action}</span>
                  <span className="font-semibold text-secondary">{e.tokens}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="md">
            <h3 className="font-serif text-headline-md font-medium text-on-surface">Earning history</h3>
            <ul className="mt-2 divide-y divide-surface-highest">
              {EARN_HISTORY.map((e) => (
                <li key={e.label} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-body-md text-on-surface-variant">{e.label}</p>
                    <p className="text-label-sm text-outline">{e.date}</p>
                  </div>
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
