import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { LocationPicker, type LocationValue } from "./LocationPicker";
import { useAuth } from "@/features/auth/AuthContext";
import { useUpdateProfile } from "@/lib/hooks/useProfile";

const STORAGE_KEY = "bg_location";

function readGuestLocation(): LocationValue {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LocationValue;
  } catch {
    // ignore malformed storage
  }
  return { state: "", district: "" };
}

/** Current buyer location — profile if signed in, else guest localStorage. */
export function useCurrentLocation(): LocationValue {
  const { user, profile } = useAuth();
  if (user && profile) return { state: profile.state ?? "", district: profile.district ?? "" };
  return readGuestLocation();
}

/**
 * Shows the buyer's current shopping location (state/district) and lets
 * them change it. Signed-in users persist to their profile; guests persist
 * to localStorage. Deliberately not shown on the landing page — only where
 * it's relevant to what's being browsed (shop, villages).
 */
export function LocationBadge({ className }: { className?: string }) {
  const { user, profile, refreshProfile } = useAuth();
  const updateProfile = useUpdateProfile();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LocationValue>({ state: "", district: "" });
  const ref = useRef<HTMLDivElement>(null);

  const current = useCurrentLocation();

  useEffect(() => {
    if (open) setDraft(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function save() {
    if (user && profile) {
      await updateProfile.mutateAsync({ id: profile.id, state: draft.state, district: draft.district });
      await refreshProfile();
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
    setOpen(false);
  }

  const label = current.district && current.state
    ? `${current.district}, ${current.state}`
    : "Set your location";

  return (
    <div className={`relative ${className ?? ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-lowest px-3 py-1.5 text-label-md font-medium text-on-surface-variant transition-colors hover:border-primary hover:text-on-surface"
      >
        <Icon name="location_on" size={16} className="text-secondary" />
        {label}
        <Icon name={open ? "expand_less" : "expand_more"} size={16} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-80 rounded-xl border border-surface-highest bg-surface p-4 shadow-tinted">
          <p className="mb-3 text-label-md font-semibold text-on-surface">Shopping location</p>
          <LocationPicker value={draft} onChange={setDraft} />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-1.5 text-label-md font-medium text-on-surface-variant hover:bg-surface-low"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!draft.state || !draft.district || updateProfile.isPending}
              className="rounded-lg bg-primary px-3 py-1.5 text-label-md font-semibold text-primary-on disabled:opacity-50"
            >
              {updateProfile.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
