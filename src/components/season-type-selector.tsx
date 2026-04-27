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
  return (
    <div
      className="flex w-fit max-w-full overflow-x-auto overflow-y-hidden rounded-full border border-divider bg-card-alt"
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
            className={`shrink-0 whitespace-nowrap border-0 px-3 py-1.5 text-[0.72rem] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
              isSelected
                ? "bg-selected text-heading"
                : "bg-transparent text-muted hover:bg-hover hover:text-foreground"
            }`}
            aria-pressed={isSelected}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
