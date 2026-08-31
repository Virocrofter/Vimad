/* src/app/admin/dashboard/QuickActions.jsx */
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ToggleLeft,
  Megaphone,
  Wrench,
  ScrollText,
  Download,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

const iconMap = {
  Building2,
  ToggleLeft,
  Megaphone,
  Wrench,
  ScrollText,
  Download,
};

const colorMap = {
  secondary: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    hover: 'hover:bg-secondary/20',
    ring: 'focus-visible:ring-secondary',
  },
  accent: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    hover: 'hover:bg-accent/20',
    ring: 'focus-visible:ring-accent',
  },
  info: {
    bg: 'bg-info/10',
    text: 'text-info',
    hover: 'hover:bg-info/20',
    ring: 'focus-visible:ring-info',
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    hover: 'hover:bg-warning/20',
    ring: 'focus-visible:ring-warning',
  },
  neutral: {
    bg: 'bg-neutral/10',
    text: 'text-text-muted',
    hover: 'hover:bg-neutral/20',
    ring: 'focus-visible:ring-neutral',
  },
};

export default function QuickActions({ actions }) {
  const navigate = useNavigate();

  const handleClick = (id) => {
    switch (id) {
      case 'new-tenant':
        navigate('/admin?action=new-tenant');
        break;
      case 'feature-flag':
        navigate('/admin/feature-flags');
        break;
      case 'announcement':
        // Could open a modal or navigate to comms page
        navigate('/admin/settings');
        break;
      case 'maintenance':
        navigate('/admin/health');
        break;
      case 'audit-log':
        navigate('/admin/audit');
        break;
      case 'export':
        // Trigger export
        break;
      default:
        break;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">Quick Actions</h3>
      </div>

      {/* Actions Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = iconMap[action.icon] || Building2;
            const colors = colorMap[action.color] || colorMap.secondary;

            return (
              <button
                key={action.id}
                onClick={() => handleClick(action.id)}
                className={cn(
                  'group flex flex-col items-start gap-2 rounded-lg border border-border bg-background p-3.5 text-left transition-all hover:shadow-sm',
                  colors.hover,
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  colors.ring
                )}
              >
                <div
                  className={cn('flex h-8 w-8 items-center justify-center rounded-md', colors.bg)}
                >
                  <Icon className={cn('h-4 w-4', colors.text)} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary group-hover:text-text-primary">
                    {action.label}
                  </p>
                  <p className="text-[11px] text-text-muted line-clamp-1">{action.description}</p>
                </div>
                <ChevronRight className="mt-auto h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
