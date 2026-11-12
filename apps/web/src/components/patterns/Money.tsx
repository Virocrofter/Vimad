interface MoneyProps {
  amountMinor: number;
  currency?: string;
  className?: string;
}

const formatters = new Map<string, Intl.NumberFormat>();

export function Money({ amountMinor, currency = 'ZAR', className }: MoneyProps) {
  let fmt = formatters.get(currency);
  if (!fmt) {
    fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency });
    formatters.set(currency, fmt);
  }
  return (
    <span className={'hq-tnum ' + (className ?? '')} data-currency={currency}>
      {fmt.format(amountMinor / 100)}
    </span>
  );
}
