/* apps/web/src/app/app/housekeeping/SupervisorBoard.jsx — T2
 * Supervisor (dept-head) view: per-assignee columns, unassigned pool,
 * live SLA timers, reassign + force-override with audit trail.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { toast } from '../../../hooks/use-toast';
import { cn } from '../../../lib/utils';
import {
  fetchSupervisorBoard,
  reassignTask,
  overrideTask,
  fetchTaskAudit,
} from '../../../api/minibar';
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  UserMinus,
} from 'lucide-react';

const PRIORITY_BADGE = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-gray-400',
};

function slaInfo(task) {
  if (!task.dueAt) return { text: 'No SLA', cls: 'text-muted-foreground' };
  const ms = new Date(task.dueAt).getTime() - Date.now();
  if (task.slaBreached || ms < 0) return { text: 'SLA BREACHED', cls: 'text-red-600 font-bold' };
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return { text: `${mins}m left`, cls: 'text-orange-500 font-semibold' };
  return { text: `${Math.floor(mins / 60)}h ${mins % 60}m left`, cls: 'text-muted-foreground' };
}

function SupervisorTaskCard({ task, staff, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [audit, setAudit] = useState(null);
  const sla = slaInfo(task);

  const handleReassign = async (assigneeId) => {
    setBusy(true);
    try {
      await reassignTask(task.id, assigneeId);
      toast({ title: 'Task reassigned' });
      onChanged();
    } catch (err) {
      toast({ title: 'Reassign failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleOverride = async (action) => {
    const note = window.prompt(`Reason for "${action}" — written to the audit trail:`);
    if (!note) return;
    setBusy(true);
    try {
      await overrideTask(task.id, action, note);
      toast({ title: `Task ${action === 'force-complete' ? 'force-completed' : action + 'led'}` });
      onChanged();
    } catch (err) {
      toast({ title: 'Override failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const toggleAudit = async () => {
    if (audit) return setAudit(null);
    try {
      const res = await fetchTaskAudit(task.id);
      setAudit(res.data);
    } catch (err) {
      toast({ title: 'Audit load failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Card className={cn('p-3', task.slaBreached && 'border-red-300 bg-red-50 dark:bg-red-950/20')}>
      <div className="flex items-center justify-between mb-2">
        <Badge className={cn('text-xs', PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.normal)}>
          {task.priority}
        </Badge>
        <span className={cn('text-xs', sla.cls)}>{sla.text}</span>
      </div>

      <p className="text-sm font-medium leading-snug mb-1">{task.title}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        {task.room && <span>Room {task.room.number}</span>}
        {task.guest && (
          <span>
            · {task.guest.firstName} {task.guest.lastName}
          </span>
        )}
        <Badge variant="outline" className="ml-auto capitalize">
          {task.status.replace('_', ' ')}
        </Badge>
      </div>

      <Select value="" onValueChange={handleReassign} disabled={busy}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue placeholder="Reassign to…" />
        </SelectTrigger>
        <SelectContent>
          {staff
            .filter((s) => s.id !== task.assigneeId)
            .map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <div className="flex gap-1.5 mt-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 flex-1 text-xs"
          disabled={busy}
          onClick={() => handleOverride('force-complete')}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Force done
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 flex-1 text-xs"
          disabled={busy}
          onClick={() => handleOverride('cancel')}
        >
          <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={toggleAudit}
          title="Audit trail"
        >
          <History className="h-3.5 w-3.5" />
        </Button>
      </div>

      {audit && (
        <div className="mt-2 max-h-28 overflow-y-auto space-y-1 border-t pt-2">
          {audit.length === 0 && (
            <p className="text-[11px] text-muted-foreground">No audit entries yet.</p>
          )}
          {audit.map((a) => (
            <p key={a.id} className="text-[11px] text-muted-foreground">
              <span className="text-zinc-400">{new Date(a.createdAt).toLocaleString()}</span> —{' '}
              {a.action}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function SupervisorBoard({ department = 'housekeeping' }) {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchSupervisorBoard(department);
      setBoard(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [department]);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 30000); // live SLA timers
    return () => clearInterval(timer.current);
  }, [load]);

  if (error)
    return <EmptyState icon={AlertTriangle} title="Supervisor board failed" description={error} />;
  if (!board) return <LoadingSkeleton className="h-96" count={3} />;

  const { staff = [], unassignedPool, byAssignee, slaBreached, summary } = board;

  const summaryCards = [
    { label: 'Open', value: summary.open, icon: ClipboardList, cls: '' },
    {
      label: 'Unassigned',
      value: summary.unassigned,
      icon: UserMinus,
      cls: summary.unassigned > 0 ? 'text-orange-500' : '',
    },
    {
      label: 'SLA breached',
      value: summary.breached,
      icon: AlertTriangle,
      cls: summary.breached > 0 ? 'text-red-600' : '',
    },
    { label: 'Due < 60m', value: summary.dueWithin60Min, icon: Clock, cls: '' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <Card key={c.label} className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={cn('h-4 w-4', c.cls || 'text-muted-foreground')} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <div className={cn('text-2xl font-bold', c.cls)}>{c.value}</div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">By assignee ({byAssignee.length})</TabsTrigger>
          <TabsTrigger value="pool">Unassigned pool ({unassignedPool.length})</TabsTrigger>
          <TabsTrigger value="sla">SLA breached ({slaBreached.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          {byAssignee.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No assigned tasks"
              description="Every open task is in the unassigned pool."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {byAssignee.map(({ assignee, tasks }) => (
                <div key={assignee.id} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold">
                      {assignee.firstName} {assignee.lastName}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {tasks.length} task{tasks.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {tasks.map((t) => (
                      <SupervisorTaskCard key={t.id} task={t} staff={staff} onChanged={load} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pool" className="mt-4">
          {unassignedPool.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Pool is empty"
              description="Every task has an owner."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {unassignedPool.map((t) => (
                <SupervisorTaskCard key={t.id} task={t} staff={staff} onChanged={load} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sla" className="mt-4">
          {slaBreached.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No SLA breaches"
              description="Clean sheet — nothing past its due time."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {slaBreached.map((t) => (
                <SupervisorTaskCard key={t.id} task={t} staff={staff} onChanged={load} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
