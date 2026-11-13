export type SeasonTypeSelectorOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  count: number;
};

type SeasonTypeSelectorProps<TValue extends string> = {
  ariaLabel: string;
  options: Array<SeasonTypeSelectorOption<TValue>>;
  selectedValue: TValue;
  onSelect: (option: SeasonTypeSelectorOption<TValue>) => void;
};

export function SeasonTypeSelector<TValue extends string>({
  ariaLabel,
  options,
  selectedValue,
  onSelect,
}: SeasonTypeSelectorProps<TValue>) {
  if (options.length < 2) {
    return null;
  }

  return (
    <div
      className="flex w-fit max-w-full overflow-x-auto rounded-full border border-border-strong bg-card-alt p-0.5"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isSelected = selectedValue === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option)}
            className={`shrink-0 whitespace-nowrap rounded-full border-0 px-3 py-1 text-xs font-semibold transition-colors ${
              isSelected
                ? "bg-selected text-heading"
                : "bg-transparent text-muted hover:text-foreground"
            }`}
            aria-pressed={isSelected}
          >
            {option.label}
            <span className="ml-1.5 font-normal tabular-nums opacity-70">
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
