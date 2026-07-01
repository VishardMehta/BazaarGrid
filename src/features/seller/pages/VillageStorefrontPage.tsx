import { useState } from "react";
import { Button, Card, Icon, Input, Textarea } from "@/components/ui";
import { PortalLayout } from "@/components/layout";
import { gradientFor } from "@/lib/placeholder";
import { VILLAGE_ADMIN_NAV } from "../sellerNav";
import { useAuth } from "@/features/auth/AuthContext";
import { useMySellerProfile, useSellers } from "@/lib/hooks/useSellers";

const PRESET_ACCENTS = [
  ["#C45C26", "#D4893A", "#6B8F47", "#3D5A2A"],
  ["#8B4513", "#D2691E", "#228B22", "#2E8B57"],
  ["#B5651D", "#F4A460", "#4682B4", "#6495ED"],
];

const DEFAULT_ACCENTS = ["#C45C26", "#D4893A"];

export function VillageStorefrontPage() {
  const { profile }      = useAuth();
  const { data: myProfile } = useMySellerProfile(profile?.id ?? null);
  const { data: allSellers = [] } = useSellers();
  const producers   = allSellers.filter((s) => s.village_id === myProfile?.village_id && s.status === "ACTIVE");
  const villageName = myProfile?.village ?? "Your Village";

  const [saved, setSaved]     = useState(false);
  const [accents, setAccents] = useState<string[]>(DEFAULT_ACCENTS);
  const [activePreset, setActivePreset] = useState<number | null>(null);

  function applyPreset(preset: string[], idx: number) {
    setAccents(preset);
    setActivePreset(idx);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <PortalLayout
      portalName="Village Admin Suite"
      items={VILLAGE_ADMIN_NAV}
      user={{ name: villageName, meta: `${producers.length} producers` }}
      action={{ label: "Add Producer", to: "/village-admin/producers", icon: "person_add" }}
    >
      <div>
        <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Storefront</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Customise how your village appears to buyers on the marketplace
        </p>
      </div>

      <div className="mt-token-md grid gap-token-md lg:grid-cols-[1.5fr_1fr]">
        {/* Editor */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Village branding</h2>
          <form onSubmit={handleSave} className="mt-token-md space-y-token-md">

            {/* Banner preview */}
            <div>
              <p className="mb-2 text-label-md font-semibold text-secondary">Banner image</p>
              <div
                className="relative grid h-28 place-items-center rounded-lg text-surface-lowest cursor-pointer group overflow-hidden"
                style={{ backgroundImage: gradientFor((myProfile?.village_id ?? "banner") + "banner") }}
              >
                <div className="absolute inset-0 bg-on-surface/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex flex-col items-center gap-1 text-surface-lowest/90">
                  <Icon name="cloud_upload" size={24} />
                  <span className="text-label-sm">Click to upload banner</span>
                </span>
              </div>
            </div>

            <Input label="Village name" defaultValue={villageName} required />
            <Input label="Tagline" defaultValue={myProfile?.tagline ?? ""} placeholder="A short tagline for your village…" />
            <Textarea label="Village story" defaultValue={myProfile?.story ?? ""} rows={5}
              placeholder="Tell the heritage story of your village…" />

            {/* Brand accents */}
            <div>
              <p className="mb-2 text-label-md font-semibold text-secondary">Brand accents</p>
              <div className="flex gap-2 mb-3">
                {accents.map((c, i) => (
                  <span
                    key={i}
                    className="h-9 w-9 rounded-full ring-2 ring-offset-2 ring-surface-lowest"
                    style={{ background: c }}
                    title={c}
                  />
                ))}
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-dashed border-outline text-outline hover:border-primary hover:text-primary"
                >
                  <Icon name="add" size={18} />
                </button>
              </div>
              <p className="mb-2 text-label-sm text-on-surface-variant">Or choose a preset palette</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_ACCENTS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset, idx)}
                    className={`flex items-center gap-1 rounded-full border px-2 py-1 transition-colors ${
                      activePreset === idx ? "border-secondary" : "border-outline-variant"
                    }`}
                  >
                    {preset.slice(0, 3).map((c) => (
                      <span key={c} className="h-4 w-4 rounded-full" style={{ background: c }} />
                    ))}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" icon={saved ? "check" : "save"}>
                {saved ? "Saved!" : "Save storefront"}
              </Button>
              <Button type="button" variant="secondary" icon="visibility">Preview</Button>
            </div>
          </form>
        </Card>

        {/* Preview card */}
        <div className="space-y-token-md">
          <Card padding="none" className="overflow-hidden">
            <div
              className="h-24 w-full"
              style={{ backgroundImage: gradientFor((myProfile?.village_id ?? "banner") + "preview") }}
            />
            <div className="p-token-md">
              <p className="text-label-sm font-semibold uppercase tracking-[0.1em] text-primary">Heritage Village</p>
              <h3 className="mt-1 font-serif text-headline-md font-semibold text-on-surface">{villageName}</h3>
              <p className="mt-1 text-body-md text-on-surface-variant">{myProfile?.tagline ?? ""}</p>
              <div className="mt-3 flex gap-1.5">
                {accents.slice(0, 4).map((c) => (
                  <span key={c} className="h-4 w-4 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-label-sm text-on-surface-variant">
                <span>{producers.length} producers</span>
                <span className="flex items-center gap-1">
                  <Icon name="verified" size={14} className="text-secondary" filled /> Verified village
                </span>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <h3 className="font-serif text-headline-md font-medium text-on-surface">SEO preview</h3>
            <div className="mt-3 rounded-lg bg-surface-low p-3 text-label-sm">
              <p className="text-blue-600 font-medium">{villageName} — Heritage Producers | BazaarGrid</p>
              <p className="text-on-surface-variant mt-0.5 line-clamp-2">{myProfile?.tagline ?? villageName} — Discover traceable goods from {producers.length} verified village producers.</p>
            </div>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
