import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  icon?: string;
  className?: string;
}

const fieldBase =
  "w-full rounded bg-surface-lowest text-body-md text-on-surface placeholder:text-outline border border-outline-variant transition-colors duration-150 focus:outline-none focus:border-primary focus:border-2 disabled:opacity-60";

const labelBase = "block text-label-md font-semibold text-secondary mb-1.5";

export const Input = forwardRef<
  HTMLInputElement,
  FieldProps & React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ label, hint, error, required, icon, className, id, ...rest }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className={labelBase}>
          {label}
          {required && <span className="text-primary"> *</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <Icon
            name={icon}
            size={20}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(fieldBase, "h-11", icon ? "pl-10 pr-3" : "px-3.5", error && "border-error border-2")}
          {...rest}
        />
      </div>
      {(hint || error) && (
        <p className={cn("mt-1 text-label-sm", error ? "text-error" : "text-on-surface-variant")}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ label, hint, error, required, className, id, rows = 4, ...rest }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className={labelBase}>
          {label}
          {required && <span className="text-primary"> *</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={!!error}
        className={cn(fieldBase, "px-3.5 py-2.5 resize-y", error && "border-error border-2")}
        {...rest}
      />
      {(hint || error) && (
        <p className={cn("mt-1 text-label-sm", error ? "text-error" : "text-on-surface-variant")}>
          {error || hint}
        </p>
      )}
    </div>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  FieldProps & React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ label, hint, error, required, className, id, children, ...rest }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className={labelBase}>
          {label}
          {required && <span className="text-primary"> *</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={cn(fieldBase, "h-11 appearance-none pl-3.5 pr-10", error && "border-error border-2")}
          {...rest}
        >
          {children}
        </select>
        <Icon
          name="expand_more"
          size={20}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline"
        />
      </div>
      {(hint || error) && (
        <p className={cn("mt-1 text-label-sm", error ? "text-error" : "text-on-surface-variant")}>
          {error || hint}
        </p>
      )}
    </div>
  );
});
