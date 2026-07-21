import { ButtonLink, Icon } from "@/components/ui";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: { label: string; to: string };
}

/** Friendly empty/placeholder state. */
export function EmptyState({ icon = "inventory_2", title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-outline-variant bg-surface-low px-6 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-surface-high text-outline">
        <Icon name={icon} size={32} />
      </span>
      <h3 className="font-serif text-headline-md text-on-surface">{title}</h3>
      {message && <p className="max-w-sm text-body-md text-on-surface-variant">{message}</p>}
      {action && (
        <ButtonLink to={action.to} className="mt-2">
          {action.label}
        </ButtonLink>
      )}
    </div>
  );
}
