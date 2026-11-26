import { Icon } from "../icon/Icon.tsx";

export type FilterOption<T extends string> = { value: T; label: string; count?: number };

/**
 * One choice among a few filters, as toggle buttons in a named group
 * (aria-pressed). The current one carries a check, not only a colour.
 */
export function FilterPills<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div class="sy-filters" role="group" aria-label={label}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button type="button" class="sy-filters__pill" aria-pressed={on} onClick={() => onChange(option.value)} key={option.value}>
            {on && <Icon name="check" size={16} />}
            {option.label}
            {option.count !== undefined && <span class="sy-filters__count sy-num">{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
