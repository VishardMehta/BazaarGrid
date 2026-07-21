import { useState } from "react";
import { Badge, Button, Card, Icon, Input, Select } from "@/components/ui";
import { SellerBadge } from "@/components/shared";
import { PortalLayout } from "@/components/layout";
import { OPERATOR_NAV } from "@/features/seller/sellerNav";
import { useAuth } from "@/features/auth/AuthContext";
import { useAllSellers } from "@/lib/hooks/useSellers";
import { useVillages } from "@/lib/hooks/useVillages";
import { mapSeller } from "@/lib/mappers";

export function OperatorProducersPage() {
  const { profile } = useAuth();
  const { data: allSellers = [] } = useAllSellers();
  const { data: villages   = [] } = useVillages();

  const [villageFilter, setVillageFilter] = useState("ALL");
  const [search,        setSearch]        = useState("");

  const villageNames = villages.map((v) => v.name);

  const shown = allSellers.filter((s) => {
    const matchVillage = villageFilter === "ALL" || s.village === villageFilter;
    const matchSearch  = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchVillage && matchSearch;
  });

  return (
    <PortalLayout
      portalName="Local Operator Portal"
      items={OPERATOR_NAV}
      user={{ name: profile?.name ?? "Operator", meta: "Operator Portal" }}
      action={{ label: "Onboard Village", to: "/operator/villages", icon: "add_location_alt" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-headline-lg font-semibold text-on-surface">Producers</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {allSellers.length} verified producers across {villageNames.length} villages
          </p>
        </div>
        <Button icon="person_add" variant="secondary">Onboard producer</Button>
      </div>

      {/* Filters */}
      <div className="mt-token-md flex flex-wrap gap-3">
        <div className="w-64">
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search producers"
          />
        </div>
        <Select
          value={villageFilter}
          onChange={(e) => setVillageFilter(e.target.value)}
          className="w-48"
          aria-label="Filter by village"
        >
          <option value="ALL">All villages</option>
          {villageNames.map((v) => <option key={v}>{v}</option>)}
        </Select>
      </div>

      {/* Producer table */}
      <Card padding="none" className="mt-token-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-label-md">
            <thead className="bg-surface-low text-on-surface-variant">
              <tr>
                <th className="px-token-md py-2.5 font-semibold">Producer</th>
                <th className="px-token-md py-2.5 font-semibold">Village</th>
                <th className="px-token-md py-2.5 font-semibold">Region</th>
                <th className="px-token-md py-2.5 font-semibold">Traceability</th>
                <th className="px-token-md py-2.5 font-semibold">Status</th>
                <th className="px-token-md py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-highest">
              {shown.map((s) => (
                <tr key={s.id} className="hover:bg-surface-low">
                  <td className="px-token-md py-3"><SellerBadge seller={mapSeller(s)} link={false} /></td>
                  <td className="px-token-md py-3 text-on-surface-variant">{s.village ?? "—"}</td>
                  <td className="px-token-md py-3 text-on-surface-variant">{s.region ?? "—"}</td>
                  <td className="px-token-md py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-highest">
                        <div className="h-full rounded-full bg-secondary" style={{ width: `${s.traceability_score}%` }} />
                      </div>
                      <span className="text-on-surface-variant">{s.traceability_score}%</span>
                    </div>
                  </td>
                  <td className="px-token-md py-3">
                    <Badge tone={s.status === "ACTIVE" ? "green" : s.status === "PENDING" ? "turmeric" : "info"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-token-md py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-high">
                        <Icon name="open_in_new" size={16} />
                      </button>
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-high">
                        <Icon name="edit" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-token-md py-10 text-center text-on-surface-variant">
                    No producers match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PortalLayout>
  );
}
