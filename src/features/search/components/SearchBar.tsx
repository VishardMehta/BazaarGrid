import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  getSuggestions,
  getRecentSearches,
  addRecentSearch,
  POPULAR_SEARCHES,
} from "../suggestions";

interface SearchBarProps {
  defaultValue?: string;
  size?: "sm" | "lg";
  placeholder?: string;
  className?: string;
  /** Called on submit instead of navigating — used inside SearchResultsPage */
  onSearch?: (q: string) => void;
}

export function SearchBar({
  defaultValue = "",
  size = "sm",
  placeholder = "Search heritage goods…",
  className,
  onSearch,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Keep in sync when parent drives value (e.g. URL query changes externally)
  useEffect(() => { setValue(defaultValue ?? ""); }, [defaultValue]);

  useEffect(() => {
    setSuggestions(getSuggestions(value));
    setActiveIdx(-1);
  }, [value]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function handleFocus() {
    setRecents(getRecentSearches());
    setOpen(true);
  }

  function submit(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    setOpen(false);
    inputRef.current?.blur();
    if (onSearch) {
      onSearch(trimmed);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const items = value.trim() ? suggestions : recents;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = activeIdx >= 0 ? items[activeIdx] : undefined;
      if (chosen) { setValue(chosen); submit(chosen); }
      else submit(value);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showSuggestions = open && suggestions.length > 0;
  const showRecent = open && !value.trim() && recents.length > 0;
  const showPopular = open && !value.trim() && recents.length === 0;
  const hasDropdown = showSuggestions || showRecent || showPopular;

  const isLg = size === "lg";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={(e) => { e.preventDefault(); submit(value); }}>
        <Icon
          name="search"
          size={isLg ? 22 : 18}
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-outline",
            isLg ? "left-4" : "left-3",
          )}
        />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-expanded={hasDropdown}
          className={cn(
            "w-full rounded-full border border-outline-variant bg-surface-lowest placeholder:text-outline transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
            isLg ? "h-14 pl-12 pr-12 text-body-lg" : "h-10 pl-9 pr-9 text-body-md",
          )}
        />
        {value && (
          <button
            type="button"
            onClick={() => { setValue(""); inputRef.current?.focus(); }}
            aria-label="Clear search"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full p-0.5 text-outline hover:text-on-surface",
              isLg ? "right-4" : "right-3",
            )}
          >
            <Icon name="close" size={isLg ? 20 : 16} />
          </button>
        )}
      </form>

      {hasDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-surface-highest bg-surface shadow-tinted-lg">
          {showSuggestions && (
            <ul role="listbox" aria-label="Search suggestions">
              {suggestions.map((s, i) => (
                <li key={s} role="option" aria-selected={i === activeIdx}>
                  <button
                    type="button"
                    onMouseDown={() => { setValue(s); submit(s); }}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-md transition-colors",
                      i === activeIdx
                        ? "bg-surface-low text-on-surface"
                        : "text-on-surface-variant hover:bg-surface-low",
                    )}
                  >
                    <Icon name="search" size={15} className="shrink-0 text-outline" />
                    <span>{s}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showRecent && (
            <div>
              <p className="px-4 pb-1 pt-3 text-label-sm font-semibold uppercase tracking-[0.05em] text-outline">
                Recent
              </p>
              <ul>
                {recents.map((r, i) => (
                  <li key={r}>
                    <button
                      type="button"
                      onMouseDown={() => { setValue(r); submit(r); }}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-md transition-colors",
                        i === activeIdx
                          ? "bg-surface-low text-on-surface"
                          : "text-on-surface-variant hover:bg-surface-low",
                      )}
                    >
                      <Icon name="history" size={15} className="shrink-0 text-outline" />
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showPopular && (
            <div className="p-3">
              <p className="px-1 pb-2 text-label-sm font-semibold uppercase tracking-[0.05em] text-outline">
                Trending
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onMouseDown={() => { setValue(p); submit(p); }}
                    className="inline-flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1 text-label-md text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon name="trending_up" size={13} />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
