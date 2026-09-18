import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
  onChange?: (id: string) => void;
}

export function Tabs({ tabs, defaultTab, className, onChange }: TabsProps) {
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
