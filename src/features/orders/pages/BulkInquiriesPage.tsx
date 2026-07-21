import { useState } from "react";
import { Button, Card, Icon, Input, Select } from "@/components/ui";
import { Badge, Chip } from "@/components/ui";
import { SectionHeading } from "@/components/shared";

const INQUIRIES = [
  { ref: "BG-INQ-01", product: "High-Altitude Arabica Beans", qty: "250 KG", freq: "Monthly", status: "Logistics Review", tone: "turmeric" as const, eta: "Oct 12, 2024" },
  { ref: "BG-INQ-02", product: "Hand-Pressed Ceramic Plates", qty: "120 units", freq: "One-time", status: "In Production", tone: "terracotta" as const, eta: "Nov 03, 2024" },
  { ref: "BG-INQ-03", product: "Linen Table Runners", qty: "80 units", freq: "One-time", status: "Delivered", tone: "green" as const, eta: "Aug 18, 2024" },
];

export function BulkInquiriesPage() {
  const [filter, setFilter] = useState<"all" | "active">("all");
  const shown = filter === "active" ? INQUIRIES.filter((i) => i.status !== "Delivered") : INQUIRIES;

  return (
    <div className="container-page py-token-md">
      <SectionHeading
        eyebrow="Institutional Partnership"
        title="Bulk & wholesale inquiries"
        subtitle="BazaarGrid bridges the gap between artisanal heritage and institutional demand — secure, predictable, high-volume supply chains with full traceability for restaurants, hotels and boutiques."
      />

      <div className="mt-token-md grid gap-token-md lg:grid-cols-[1.3fr_1fr]">
        {/* Inquiry form */}
        <Card padding="md">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Bulk inquiry request</h2>
          <form onSubmit={(e) => e.preventDefault()} className="mt-token-sm grid gap-token-md sm:grid-cols-2">
            <Input label="Institution name" placeholder="e.g. Green Valley Resorts" required />
            <Input label="Contact person" placeholder="Full name" required />
            <Select label="Product category" defaultValue="" required>
              <option value="" disabled>Select a category</option>
              <option>Artisanal Textiles</option>
              <option>Heritage Pantry</option>
              <option>Pottery &amp; Ceramics</option>
              <option>Oils &amp; Honey</option>
            </Select>
            <Input label="Quantity (units / KG)" placeholder="Min. 50" required />
            <Select label="Preferred village / region" defaultValue="">
              <option value="">No preference</option>
              <option>Green Valley</option>
              <option>Val di Sole</option>
              <option>Coast Village</option>
            </Select>
            <Select label="Delivery frequency" defaultValue="One-time">
              <option>One-time</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Quarterly</option>
            </Select>
            <div className="sm:col-span-2">
              <Button type="submit" icon="send">Submit institutional inquiry</Button>
            </div>
          </form>
        </Card>

        {/* Value props */}
        <div className="grid gap-token-md">
          <Card padding="md" className="bg-primary text-primary-on">
            <Icon name="verified_user" size={28} filled />
            <h3 className="mt-2 font-serif text-headline-md font-medium">Heritage verification</h3>
            <p className="mt-1 text-body-md text-primary-on/85">
              Every bulk order includes QR-traceable provenance data and artisan
              certification for your marketing transparency.
            </p>
          </Card>
          <Card padding="md" className="bg-secondary text-secondary-on">
            <Icon name="hub" size={28} />
            <h3 className="mt-2 font-serif text-headline-md font-medium">Global logistics network</h3>
            <p className="mt-1 text-body-md text-secondary-on/85">
              Climate-controlled fulfilment from 12 regional hubs with predictable
              lead times.
            </p>
          </Card>
        </div>
      </div>

      {/* Inquiry status */}
      <Card padding="none" className="mt-token-md overflow-hidden">
        <div className="flex items-center justify-between border-b border-surface-highest px-token-md py-3">
          <h2 className="font-serif text-headline-md font-medium text-on-surface">Recent inquiry status</h2>
          <div className="flex gap-2">
            <Chip selected={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
            <Chip selected={filter === "active"} onClick={() => setFilter("active")}>Active</Chip>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-label-md">
            <thead className="bg-surface-low text-on-surface-variant">
              <tr>
                <th className="px-token-md py-2.5 font-semibold">Reference</th>
                <th className="px-token-md py-2.5 font-semibold">Product</th>
                <th className="px-token-md py-2.5 font-semibold">Quantity</th>
                <th className="px-token-md py-2.5 font-semibold">Frequency</th>
                <th className="px-token-md py-2.5 font-semibold">Status</th>
                <th className="px-token-md py-2.5 font-semibold">Expected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-highest">
              {shown.map((i) => (
                <tr key={i.ref} className="hover:bg-surface-low">
                  <td className="px-token-md py-3 font-medium text-on-surface">{i.ref}</td>
                  <td className="px-token-md py-3 text-on-surface-variant">{i.product}</td>
                  <td className="px-token-md py-3 text-on-surface-variant">{i.qty}</td>
                  <td className="px-token-md py-3 text-on-surface-variant">{i.freq}</td>
                  <td className="px-token-md py-3"><Badge tone={i.tone}>{i.status}</Badge></td>
                  <td className="px-token-md py-3 text-on-surface-variant">{i.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
