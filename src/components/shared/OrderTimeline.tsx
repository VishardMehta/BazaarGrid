import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui";
import type { OrderStatus } from "@/shared/types";

/** Ordered fulfilment flow for APP/WhatsApp orders. */
export const ORDER_FLOW: { status: OrderStatus; label: string; icon: string }[] = [
  { status: "PLACED",    label: "Placed",     icon: "receipt_long" },
  { status: "CONFIRMED", label: "Confirmed",  icon: "task_alt" },
  { status: "PACKED",    label: "Packed",     icon: "inventory_2" },
  { status: "FULFILLED", label: "In Transit", icon: "local_shipping" },
  { status: "COMPLETED", label: "Delivered",  icon: "home" },
];

interface OrderTimelineProps {
  status: OrderStatus;
  className?: string;
}

/** Horizontal fulfilment stepper. Cancelled orders render a single state. */
export function OrderTimeline({ status, className }: OrderTimelineProps) {
  if (status === "CANCELLED") {
    return (
      <div className={cn("flex items-center gap-2 text-error", className)}>
        <Icon name="cancel" size={20} filled />
        <span className="text-label-md font-semibold">Order cancelled</span>
      </div>
    );
  }

  const currentIndex = ORDER_FLOW.findIndex((s) => s.status === status);

  return (
    <ol className={cn("flex items-center", className)}>
      {ORDER_FLOW.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const reached = done || current;
        return (
          <li key={step.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full border-2 transition-colors",
                  done && "border-secondary bg-secondary text-secondary-on",
                  current && "border-primary bg-primary text-primary-on animate-pulse",
                  !reached && "border-outline-variant bg-surface-lowest text-outline",
                )}
              >
                <Icon name={done ? "check" : step.icon} size={18} filled={current} />
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-label-sm font-medium",
                  reached ? "text-on-surface" : "text-outline",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < ORDER_FLOW.length - 1 && (
              <span
                className={cn(
                  "mx-1 mb-5 h-0.5 flex-1 rounded-full transition-colors",
                  i < currentIndex ? "bg-secondary" : "bg-outline-variant",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
