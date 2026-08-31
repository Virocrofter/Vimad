/* src/app/admin/reports/page.jsx */
import { useState } from 'react';
import { Plus, LayoutGrid, Settings, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import ReportLibrary from './ReportLibrary';
import ReportBuilder from './ReportBuilder';
import ReportScheduler from './ReportScheduler';

const reportTabs = [
  { id: 'library', label: 'Library', icon: LayoutGrid },
  { id: 'builder', label: 'Report Builder', icon: Settings },
  { id: 'scheduler', label: 'Scheduler', icon: Clock },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('library');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports & Analytics</h1>
          <p className="text-sm text-text-secondary">
            Insights, custom reports, and automated scheduling
          </p>
        </div>
        {activeTab === 'library' && (
          <Button size="sm" onClick={() => setActiveTab('builder')}>
            <Plus className="mr-1.5 h-4 w-4" /> Build Custom Report
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {reportTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'library' && <ReportLibrary onOpenBuilder={() => setActiveTab('builder')} />}
      {activeTab === 'builder' && <ReportBuilder />}
      {activeTab === 'scheduler' && <ReportScheduler />}
    </div>
  );
}
