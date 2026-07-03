import { Select } from "@/components/ui";
import { INDIA_STATES, districtsFor } from "@/shared/data/indiaLocations";

export interface LocationValue {
  state: string;
  district: string;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  className?: string;
  /** Labels shown above each select — defaults suit most contexts. */
  stateLabel?: string;
  districtLabel?: string;
}

/** State → District dropdown pair, sourced from the bundled India dataset. */
export function LocationPicker({
  value,
  onChange,
  className,
  stateLabel = "State",
  districtLabel = "District",
}: LocationPickerProps) {
  const districts = districtsFor(value.state);

  return (
    <div className={className ?? "grid gap-3 sm:grid-cols-2"}>
      <Select
        label={stateLabel}
        value={value.state}
        onChange={(e) => onChange({ state: e.target.value, district: "" })}
      >
        <option value="">Select state…</option>
        {INDIA_STATES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </Select>
      <Select
        label={districtLabel}
        value={value.district}
        onChange={(e) => onChange({ ...value, district: e.target.value })}
        disabled={!value.state}
      >
        <option value="">{value.state ? "Select district…" : "Pick a state first"}</option>
        {districts.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </Select>
    </div>
  );
}
