/* apps/web/src/app/app/tasks/page.jsx — T1 + T5 */
import { useState, useMemo } from 'react';
import {
  useTaskList,
  useTaskSummary,
  useTaskRules,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useCancelTask,
  usePushTask,
  useCreateTaskRule,
  useUpdateTaskRule,
  useDeleteTaskRule,
  useRunTaskRuleNow,
} from '../../../hooks/useTasks';
import { useProperties } from '../../../hooks/useProperties';
import { useHousekeepingStaff } from '../../../hooks/useHousekeeping';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../../components/ui/ErrorState';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { toast } from '../../../hooks/use-toast';
import { cn } from '../../../lib/utils';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Plus,
  Zap,
  Trash2,
  Filter,
  MessageSquare,
} from 'lucide-react';

const DEPARTMENTS = [
  'housekeeping',
  'front_desk',
  'maintenance',
  'security',
  'management',
  'concierge',
];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

const PRIORITY_STYLE = {
  low: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  normal: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  high: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  urgent: 'bg-danger/10 text-danger border-danger/20',
};

const DEPT_LABEL = Object.fromEntries(DEPARTMENTS.map((d) => [d, d.replace(/_/g, ' ')]));

const extractList = (res) => res?.data?.data ?? res?.data ?? [];

function dueLabel(task) {
  if (!task.dueAt) return '—';
  const ms = new Date(task.dueAt).getTime() - Date.now();
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const txt = h >= 1 ? `${h}h ${m}m` : `${m}m`;
  return ms < 0 ? `overdue ${txt}` : `in ${txt}`;
}

export default function TasksPage() {
  const [tab, setTab] = useState('tasks');
  const [filters, setFilters] = useState({
    status: 'open,in_progress',
    department: '',
    priority: '',
    slaBreached: '',
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleFilter, setRuleFilter] = useState('');

  const params = useMemo(
    () => ({
      status: filters.status || undefined,
      department: filters.department || undefined,
      priority: filters.priority || undefined,
      slaBreached: filters.slaBreached || undefined,
      pageSize: 100,
    }),
    [filters]
  );

  const listQuery = useTaskList(params);
  const summaryQuery = useTaskSummary();
  const rulesQuery = useTaskRules();

  const tasks = extractList(listQuery.data);
  const summary = summaryQuery.data;
  const rules = rulesQuery.data ?? [];

  const tasksForView = useMemo(
    () => (ruleFilter ? tasks.filter((t) => t.ruleId === ruleFilter) : tasks),
    [tasks, ruleFilter]
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" /> Tasks
          </h1>
          <p className="text-sm text-muted-foreground">
            Rules engine — new rule = new row, no deploy. Assigned tasks auto-push to staff phones
            (SMS/WhatsApp).
          </p>
        </div>
        <div className="flex gap-2">
          {ruleFilter && (
            <Button variant="outline" onClick={() => setRuleFilter('')}>
              <Filter className="mr-2 h-4 w-4" /> Clear rule filter
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New task
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Open"
            value={(summary.byStatus?.open ?? 0) + (summary.byStatus?.in_progress ?? 0)}
            icon={Clock}
          />
          <KpiCard
            label="SLA breached"
            value={summary.slaBreached}
            icon={AlertTriangle}
            danger={summary.slaBreached > 0}
          />
          <KpiCard label="Due today" value={summary.dueToday} icon={Clock} />
          <KpiCard label="Rules active" value={rules.filter((r) => r.isActive).length} icon={Zap} />
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="rules">Rules ({rules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open,in_progress">Open + In progress</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="">All</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.department}
              onValueChange={(v) => setFilters((f) => ({ ...f, department: v }))}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {DEPT_LABEL[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.priority}
              onValueChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any priority</SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.slaBreached}
              onValueChange={(v) => setFilters((f) => ({ ...f, slaBreached: v }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="SLA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any SLA</SelectItem>
                <SelectItem value="true">Breached only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {listQuery.isLoading ? (
            <LoadingSkeleton />
          ) : listQuery.isError ? (
            <ErrorState error={listQuery.error} onRetry={() => listQuery.refetch()} />
          ) : tasksForView.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No tasks"
              description="Rules fire automatically — departures, no-shows, SLA escalations. Create one manually to get started."
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasksForView.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setRuleDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New rule
            </Button>
          </div>
          {rulesQuery.isLoading ? (
            <LoadingSkeleton />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead>Runs every</TableHead>
                    <TableHead>Open tasks</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((r) => (
                    <RuleRow
                      key={r.id}
                      rule={r}
                      onViewTasks={() => {
                        setRuleFilter(r.id);
                        setTab('tasks');
                      }}
                    />
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CreateRuleDialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen} />
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, danger }) {
  return (
    <Card className={cn(danger && 'border-danger/40')}>
      <CardContent className="flex items-center gap-3 pt-6">
        <Icon className={cn('h-5 w-5', danger ? 'text-danger' : 'text-muted-foreground')} />
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskRow({ task }) {
  const completeMut = useCompleteTask();
  const updateMut = useUpdateTask();
  const cancelMut = useCancelTask();
  const pushMut = usePushTask();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isActive = task.status === 'open' || task.status === 'in_progress';

  const onPush = () =>
    pushMut.mutate(
      { id: task.id },
      {
        onSuccess: (d) =>
          toast({
            title: 'Pushed to phone',
            description:
              d?.data?.channel && d.data.channel !== 'default'
                ? `via ${d.data.channel}`
                : 'One-tap link queued for the assignee',
          }),
        onError: (e) =>
          toast({
            title: 'Push failed',
            description: e?.response?.data?.error?.message ?? String(e?.message ?? e),
            variant: 'destructive',
          }),
      }
    );

  return (
    <TableRow className={cn(!isActive && 'opacity-50')}>
      <TableCell className="max-w-md">
        <div className="font-medium">{task.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {task.room?.number && `Room ${task.room.number} · `}
          {task.reservation?.confirmationNumber && `${task.reservation.confirmationNumber} · `}
          {task.guest && `${task.guest.firstName} ${task.guest.lastName}`}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{DEPT_LABEL[task.department] ?? task.department}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={PRIORITY_STYLE[task.priority]}>
          {task.priority}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">
        {task.assignee
          ? `${task.assignee.firstName ?? ''} ${task.assignee.lastName ?? ''}`.trim() || '—'
          : '—'}
      </TableCell>
      <TableCell>
        {task.dueAt ? (
          <span
            className={cn(
              'text-sm',
              task.slaBreached ? 'text-danger font-semibold' : 'text-muted-foreground'
            )}
          >
            {task.slaBreached && <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />}
            {dueLabel(task)}
          </span>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>
        {task.ruleKey ? (
          <Badge variant="secondary" className="font-mono text-xs">
            {task.ruleKey}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            manual
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        {isActive && (
          <div className="flex justify-end gap-1">
            {task.assignee && (
              <Button
                size="sm"
                variant="ghost"
                title="Push one-tap link to assignee's phone (SMS/WhatsApp)"
                onClick={onPush}
                disabled={pushMut.isPending}
              >
                <MessageSquare
                  className={cn('h-4 w-4', task.pushSentAt ? 'text-green-500' : 'text-blue-500')}
                />
              </Button>
            )}
            {task.status === 'open' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateMut.mutate({ id: task.id, input: { status: 'in_progress' } })}
                disabled={updateMut.isPending}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                completeMut.mutate(task.id, {
                  onSuccess: () => toast({ title: 'Task completed' }),
                  onError: (e) =>
                    toast({ title: 'Failed', description: String(e), variant: 'destructive' }),
                })
              }
              disabled={completeMut.isPending}
            >
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(true)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        )}
      </TableCell>
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel task?"
        description="The task will be marked cancelled. If a rule generated it, a new one may be created on the next run if conditions still hold."
        confirmLabel="Cancel task"
        onConfirm={() =>
          cancelMut.mutate(
            { id: task.id },
            {
              onSuccess: () => toast({ title: 'Task cancelled' }),
            }
          )
        }
      />
    </TableRow>
  );
}

function RuleRow({ rule, onViewTasks }) {
  const updateMut = useUpdateTaskRule();
  const deleteMut = useDeleteTaskRule();
  const runMut = useRunTaskRuleNow();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const trigger = rule.trigger ?? {};
  const every = trigger.type === 'schedule' ? trigger.everyMinutes : null;

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{rule.name}</div>
        {rule.description && (
          <div className="text-xs text-muted-foreground">{rule.description}</div>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="font-mono text-xs">
          {rule.key}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{DEPT_LABEL[rule.department] ?? rule.department}</Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {every ? `${every} min` : 'manual'}
        {rule.lastRunAt && (
          <div className="text-xs">last: {new Date(rule.lastRunAt).toLocaleString()}</div>
        )}
      </TableCell>
      <TableCell>
        <Button variant="link" size="sm" onClick={onViewTasks} disabled={!rule.openTaskCount}>
          {rule.openTaskCount ?? 0}
        </Button>
      </TableCell>
      <TableCell>
        <Switch
          checked={rule.isActive}
          onCheckedChange={(v) => updateMut.mutate({ id: rule.id, input: { isActive: v } })}
          disabled={updateMut.isPending}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              runMut.mutate(rule.id, {
                onSuccess: (data) =>
                  toast({ title: `Rule ran — ${data?.created ?? 0} task(s) created` }),
              })
            }
            disabled={runMut.isPending}
          >
            <Zap className="mr-1 h-3.5 w-3.5" /> Run now
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4 text-danger" />
          </Button>
        </div>
      </TableCell>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete rule "${rule.name}"?`}
        description="Generated tasks keep their audit snapshot. This cannot be undone."
        confirmLabel="Delete rule"
        onConfirm={() =>
          deleteMut.mutate(rule.id, { onSuccess: () => toast({ title: 'Rule deleted' }) })
        }
      />
    </TableRow>
  );
}

function CreateTaskDialog({ open, onOpenChange }) {
  const createMut = useCreateTask();
  const propsQuery = useProperties();
  const staffQuery = useHousekeepingStaff();
  const properties = extractList(propsQuery.data);
  const staff = extractList(staffQuery.data);

  const [form, setForm] = useState({
    propertyId: '',
    department: 'housekeeping',
    title: '',
    description: '',
    priority: 'normal',
    assigneeId: '',
    slaMinutes: '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target?.value ?? e }));

  const submit = () => {
    createMut.mutate(
      {
        propertyId: form.propertyId,
        department: form.department,
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        assigneeId: form.assigneeId || undefined,
        slaMinutes: form.slaMinutes ? Number(form.slaMinutes) : undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Task created',
            description: form.assigneeId
              ? "It will auto-push to the assignee's phone within a minute."
              : undefined,
          });
          onOpenChange(false);
          setForm({
            propertyId: '',
            department: 'housekeeping',
            title: '',
            description: '',
            priority: 'normal',
            assigneeId: '',
            slaMinutes: '',
          });
        },
        onError: (e) =>
          toast({ title: 'Failed', description: String(e?.message ?? e), variant: 'destructive' }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Property</Label>
            <Select value={form.propertyId} onValueChange={set('propertyId')}>
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={set('department')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DEPT_LABEL[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={set('priority')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Fix AC in room 204"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={set('description')} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={form.assigneeId} onValueChange={set('assigneeId')}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name ?? `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() ?? s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SLA (minutes)</Label>
              <Input
                type="number"
                min="1"
                value={form.slaMinutes}
                onChange={set('slaMinutes')}
                placeholder="e.g. 60"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!form.propertyId || !form.title || createMut.isPending}
          >
            Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateRuleDialog({ open, onOpenChange }) {
  const createMut = useCreateTaskRule();
  const [form, setForm] = useState({
    key: '',
    name: '',
    department: 'housekeeping',
    description: '',
    everyMinutes: '30',
    priority: 'normal',
    slaMinutes: '',
    dedupe: 'open',
    title: '',
    conditions: '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target?.value ?? e }));

  const submit = () => {
    let conditions;
    try {
      conditions = form.conditions.trim() ? JSON.parse(form.conditions) : {};
    } catch {
      toast({ title: 'Conditions must be valid JSON', variant: 'destructive' });
      return;
    }
    createMut.mutate(
      {
        key: form.key,
        name: form.name,
        department: form.department,
        description: form.description || undefined,
        trigger: { type: 'schedule', everyMinutes: Number(form.everyMinutes) },
        conditions,
        action: {
          title: form.title,
          priority: form.priority,
          ...(form.slaMinutes ? { slaMinutes: Number(form.slaMinutes) } : {}),
          dedupe: form.dedupe,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Rule created — it fires on the next scan' });
          onOpenChange(false);
        },
        onError: (e) =>
          toast({ title: 'Failed', description: String(e?.message ?? e), variant: 'destructive' }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New rule</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Key (slug)</Label>
              <Input
                value={form.key}
                onChange={set('key')}
                placeholder="my-new-rule"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Runs every (min)</Label>
              <Input
                type="number"
                min="1"
                value={form.everyMinutes}
                onChange={set('everyMinutes')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={set('name')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={set('department')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DEPT_LABEL[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={set('priority')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Task title template</Label>
            <Input
              value={form.title}
              onChange={set('title')}
              placeholder="Clean room {{roomNumber}}"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {'{{field}}'} placeholders interpolate from the rule's candidate context.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SLA (minutes)</Label>
              <Input type="number" min="1" value={form.slaMinutes} onChange={set('slaMinutes')} />
            </div>
            <div className="space-y-2">
              <Label>Dedupe</Label>
              <Select value={form.dedupe} onValueChange={set('dedupe')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">One open task per entity</SelectItem>
                  <SelectItem value="daily">Once per day</SelectItem>
                  <SelectItem value="once">Once ever</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Conditions (JSON, optional)</Label>
            <Textarea
              value={form.conditions}
              onChange={set('conditions')}
              rows={3}
              className="font-mono text-xs"
              placeholder='{"all":[{"field":"guest.vipStatus","op":"truthy"}]}'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!form.key || !form.name || !form.title || createMut.isPending}
          >
            Create rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
