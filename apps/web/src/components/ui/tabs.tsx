import {
  createContext,
  useCallback,
  useContext,
  useState,
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/utils';

/* ─── TabItem-array API (legacy) ─── */

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs?: TabItem[];
  defaultTab?: string;
  className?: string;
  onChange?: (id: string) => void;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}

/* ─── Compound tabs context ─── */

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>');
  return ctx;
}

function CompoundTabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: Omit<TabsProps, 'tabs' | 'defaultTab' | 'onChange'>) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const currentValue = isControlled ? (value as string) : internalValue;

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div className={cn('space-y-4', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn('flex w-full items-center border-b border-border', className)}>
      {children}
    </div>
  );
}

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(function TabsTrigger({ value, className, children, onClick, ...props }, ref) {
  const { value: active, setValue } = useTabsContext();
  const isActive = active === value;
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setValue(value);
      }}
      className={cn(
        'relative flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'border-secondary text-secondary'
          : 'border-transparent text-text-secondary hover:text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children?: ReactNode;
}) {
  const { value: active } = useTabsContext();
  if (active !== value) return null;
  return <div className={className}>{children}</div>;
}

/* ─── Root: branches between the legacy tabs-array API and the compound API ─── */

export function Tabs({ tabs, defaultTab, onChange, children, ...compoundProps }: TabsProps) {
  if (tabs) {
    return (
      <LegacyTabs tabs={tabs} defaultTab={defaultTab} onChange={onChange} {...compoundProps} />
    );
  }
  return <CompoundTabs {...compoundProps}>{children}</CompoundTabs>;
}

function LegacyTabs({
  tabs,
  defaultTab,
  className,
  onChange,
}: Required<Pick<TabsProps, 'tabs'>> & TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  const handleChange = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex w-full items-center border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => handleChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              active === tab.id
                ? 'border-secondary text-secondary'
                : 'border-transparent text-text-secondary hover:text-text-primary',
              tab.disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{activeTab?.content}</div>
    </div>
  );
}
