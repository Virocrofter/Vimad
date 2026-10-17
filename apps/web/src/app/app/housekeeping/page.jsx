/* apps/web/src/app/app/housekeeping/page.jsx */
import { useState, useMemo } from 'react';
import {
  useHousekeepingList,
  useHousekeepingStats,
  useHousekeepingStaff,
  useStartHousekeepingTask,
  useCompleteHousekeepingTask,
  useInspectHousekeepingTask,
  useSkipHousekeepingTask,
  useAssignHousekeepingTask,
  useBulkAssignHousekeeping,
} from '../../../hooks/useHousekeeping';
import { useRooms } from '../../../hooks/useRooms';
import { useProperties } from '../../../hooks/useProperties';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import SupervisorBoard from './SupervisorBoard';
import MinibarModal from './MinibarModal';
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
  Users,
  Filter,
  LayoutGrid,
  List,
  BarChart3,
  Play,
  CheckCircle,
  Eye,
  SkipForward,
  UserPlus,
  Calendar,
  Timer,
  ArrowRight,
  ShieldCheck,
  Wine,
} from 'lucide-react';

// ─── Constants ───

const STATUS_COLUMNS = [
  { key: 'pending', label: 'Pending', color: 'bg-yellow-500', icon: Clock },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-500', icon: Play },
  { key: 'completed', label: 'Completed', color: 'bg-green-500', icon: CheckCircle },
  { key: 'inspected', label: 'Inspected', color: 'bg-purple-500', icon: Eye },
];

const PRIORITY_COLORS = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-gray-400',
};

const TYPE_LABELS = {
  cleaning: 'Cleaning',
  deep_clean: 'Deep Clean',
  inspection: 'Inspection',
  turndown: 'Turndown',
  maintenance: 'Maintenance',
};

// ─── Helpers ───

function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function isOverdue(task) {
  if (task.status === 'completed' || task.status === 'inspected') return false;
  return new Date(task.scheduledAt) < new Date();
}

function getInitials(first, last) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

// ─── Sub-components ───

function StatsCards({ stats }) {
  if (!stats) return <LoadingSkeleton className="h-32" count={4} />;
  const { today, overdue, staffOnDuty, avgCleaningDuration } = stats;

  const cards = [
    { label: 'Total Today', value: today.total, icon: ClipboardList, color: 'text-blue-600' },
    { label: 'Pending', value: today.pending, icon: Clock, color: 'text-yellow-600' },
    { label: 'In Progress', value: today.inProgress, icon: Play, color: 'text-blue-600' },
    {
      label: 'Completed',
      value: today.completed + today.inspected,
      icon: CheckCircle2,
      color: 'text-green-600',
    },
    { label: 'Overdue', value: overdue, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Staff On Duty', value: staffOnDuty, icon: Users, color: 'text-purple-600' },
    {
      label: 'Avg Duration',
      value: `${avgCleaningDuration}m`,
      icon: Timer,
      color: 'text-gray-600',
    },
    {
      label: 'Completion',
      value: `${today.completionRate}%`,
      icon: BarChart3,
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <c.icon className={cn('h-4 w-4', c.color)} />
            <span className="text-xs text-muted-foreground">{c.label}</span>
          </div>
          <div className="text-2xl font-bold">{c.value}</div>
        </Card>
      ))}
    </div>
  );
}

function TaskCard({ task, onStart, onComplete, onInspect, onSkip, onAssign, staff }) {
  const overdue = isOverdue(task);
  const roomNum = task.room?.number ?? '—';
  const roomType = task.room?.roomType?.name ?? '';

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer hover:shadow-md transition-shadow',
        overdue && 'border-red-300 bg-red-50'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold text-sm">Room {roomNum}</div>
          <div className="text-xs text-muted-foreground">{roomType}</div>
        </div>
        <div className="flex items-center gap-1">
          <Badge className={cn('text-xs', PRIORITY_COLORS[task.priority])}>{task.priority}</Badge>
          {overdue && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-2">
        {TYPE_LABELS[task.type]} · Est. {task.estimatedDuration}m
      </div>

      {task.assignee ? (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
            {getInitials(task.assignee.firstName, task.assignee.lastName)}
          </div>
          <span className="text-xs">
            {task.assignee.firstName} {task.assignee.lastName}
          </span>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs mb-2"
          onClick={() => onAssign(task)}
        >
          <UserPlus className="h-3 w-3 mr-1" /> Assign
        </Button>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          <Clock className="h-3 w-3 inline mr-1" />
          {formatTime(task.scheduledAt)}
        </span>
        <div className="flex gap-1">
          {task.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => onStart(task.id)}
            >
              <Play className="h-3 w-3" />
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => onComplete(task.id)}
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
          )}
          {task.status === 'completed' && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => onInspect(task.id)}
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function KanbanBoard({ tasks, onStart, onComplete, onInspect, onSkip, onAssign, staff }) {
  const grouped = useMemo(() => {
    const g = { pending: [], in_progress: [], completed: [], inspected: [] };
    tasks.forEach((t) => {
      if (g[t.status]) g[t.status].push(t);
    });
    return g;
  }, [tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {STATUS_COLUMNS.map((col) => (
        <div key={col.key} className="space-y-3">
          <div
            className="flex items-center gap-2 pb-2 border-b-2"
            style={{ borderColor: col.color.replace('bg-', '#') }}
          >
            <col.icon className="h-4 w-4" />
            <span className="font-medium text-sm">{col.label}</span>
            <Badge variant="secondary" className="ml-auto">
              {grouped[col.key]?.length ?? 0}
            </Badge>
          </div>
          <div className="space-y-2 min-h-50">
            {grouped[col.key]?.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStart={onStart}
                onComplete={onComplete}
                onInspect={onInspect}
                onSkip={onSkip}
                onAssign={onAssign}
                staff={staff}
              />
            ))}
            {grouped[col.key]?.length === 0 && (
              <div className="text-center text-muted-foreground text-xs py-8 border border-dashed rounded-lg">
                No tasks
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskListView({ tasks, onStart, onComplete, onInspect, onAssign, staff }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Room</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>Scheduled</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow key={task.id} className={cn(isOverdue(task) && 'bg-red-50')}>
            <TableCell className="font-medium">{task.room?.number}</TableCell>
            <TableCell>{TYPE_LABELS[task.type]}</TableCell>
            <TableCell>
              <Badge className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{task.status.replace('_', ' ')}</Badge>
            </TableCell>
            <TableCell>
              {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '—'}
            </TableCell>
            <TableCell>{formatTime(task.scheduledAt)}</TableCell>
            <TableCell>
              {task.actualDuration
                ? `${task.actualDuration}m`
                : task.estimatedDuration
                  ? `~${task.estimatedDuration}m`
                  : '—'}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {task.status === 'pending' && (
                  <Button size="sm" variant="outline" onClick={() => onStart(task.id)}>
                    Start
                  </Button>
                )}
                {task.status === 'in_progress' && (
                  <Button size="sm" variant="outline" onClick={() => onComplete(task.id)}>
                    Complete
                  </Button>
                )}
                {task.status === 'completed' && (
                  <Button size="sm" variant="outline" onClick={() => onInspect(task.id)}>
                    Inspect
                  </Button>
                )}
                {!task.assignee && (
                  <Button size="sm" variant="ghost" onClick={() => onAssign(task)}>
                    Assign
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ReportsView({ stats }) {
  if (!stats) return <LoadingSkeleton className="h-64" />;
  const { today, byPriority, byType, recentCompleted } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Today's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Pending', value: today.pending, color: 'bg-yellow-500' },
              { label: 'In Progress', value: today.inProgress, color: 'bg-blue-500' },
              { label: 'Completed', value: today.completed, color: 'bg-green-500' },
              { label: 'Inspected', value: today.inspected, color: 'bg-purple-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={cn('h-3 w-3 rounded-full', item.color)} />
                <span className="text-sm w-24">{item.label}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full', item.color)}
                    style={{ width: `${today.total > 0 ? (item.value / today.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">By Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {byType.map((t) => (
              <div key={t.type} className="flex justify-between text-sm">
                <span>{TYPE_LABELS[t.type] ?? t.type}</span>
                <Badge variant="secondary">{t.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">By Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {byPriority.map((p) => (
              <div key={p.priority} className="flex justify-between text-sm">
                <span className="capitalize">{p.priority}</span>
                <Badge className={PRIORITY_COLORS[p.priority]}>{p.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recently Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentCompleted.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span>Room {r.room.number}</span>
                <span className="text-muted-foreground">
                  {r.assignee ? `${r.assignee.firstName} ${r.assignee.lastName}` : '—'} ·{' '}
                  {formatTime(r.completedAt)}
                </span>
              </div>
            ))}
            {recentCompleted.length === 0 && (
              <p className="text-muted-foreground text-sm">No completed tasks yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───

export default function HousekeepingPage() {
  const [view, setView] = useState('board');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [bulkSelected, setBulkSelected] = useState([]);
  const [minibarOpen, setMinibarOpen] = useState(false);

  const { data: properties } = useProperties();
  const propertyId = properties?.[0]?.id;

  const { data: stats } = useHousekeepingStats(propertyId);
  const { data: staff } = useHousekeepingStaff();

  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useHousekeepingList({
    propertyId,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    type: typeFilter || undefined,
    assigneeId: assigneeFilter || undefined,
    pageSize: 100,
  });

  const tasks = tasksData?.data ?? [];

  // Mutations
  const { mutate: startTask } = useStartHousekeepingTask();
  const { mutate: completeTask } = useCompleteHousekeepingTask();
  const { mutate: inspectTask } = useInspectHousekeepingTask();
  const { mutate: skipTask } = useSkipHousekeepingTask();
  const { mutate: assignTask } = useAssignHousekeepingTask();
  const { mutate: bulkAssign } = useBulkAssignHousekeeping();

  const handleStart = (id) => {
    startTask(id, { onSuccess: () => toast({ title: 'Task started' }) });
  };

  const handleComplete = (id) => {
    completeTask({ id }, { onSuccess: () => toast({ title: 'Task completed' }) });
  };

  const handleInspect = (id) => {
    inspectTask(
      { id, passed: true },
      { onSuccess: () => toast({ title: 'Task inspected & verified' }) }
    );
  };

  const handleAssign = (task) => {
    setSelectedTask(task);
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = (assigneeId) => {
    if (selectedTask) {
      assignTask(
        { id: selectedTask.id, assigneeId },
        {
          onSuccess: () => {
            toast({ title: 'Task assigned' });
            setAssignModalOpen(false);
            setSelectedTask(null);
          },
        }
      );
    }
  };

  if (error) return <ErrorState message="Failed to load housekeeping data" onRetry={refetch} />;

  // Derive the assignee filter's display label from data we already hold —
  // never rely on Radix's selected-item text copy (it drops async-item labels).
  const selectedAssignee = assigneeFilter
    ? staff?.data?.find((s) => s.id === assigneeFilter)
    : null;
  const assigneeFilterLabel = selectedAssignee
    ? `${selectedAssignee.firstName} ${selectedAssignee.lastName}`
    : 'All Staff';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Housekeeping</h1>
          <p className="text-muted-foreground">Manage room cleaning and maintenance tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setMinibarOpen(true)}>
            <Wine className="h-4 w-4 mr-1" /> Log minibar
          </Button>
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="board">
                <LayoutGrid className="h-4 w-4 mr-1" /> Board
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-1" /> List
              </TabsTrigger>
              <TabsTrigger value="reports">
                <BarChart3 className="h-4 w-4 mr-1" /> Reports
              </TabsTrigger>
              <TabsTrigger value="supervisor">
                <ShieldCheck className="h-4 w-4 mr-1" /> Supervisor
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats?.data} />

      {/* Filters — hidden on supervisor tab (board has its own) */}
      {view !== 'supervisor' && (
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="inspected">Inspected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="deep_clean">Deep Clean</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="turndown">Turndown</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={assigneeFilter || 'all'}
            onValueChange={(v) => setAssigneeFilter(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-40">
              <span className="truncate">{assigneeFilterLabel}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff?.data?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {bulkSelected.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">{bulkSelected.length} selected</span>
              <Select
                onValueChange={(v) => {
                  bulkAssign(
                    { taskIds: bulkSelected, assigneeId: v },
                    {
                      onSuccess: () => {
                        toast({ title: 'Bulk assigned' });
                        setBulkSelected([]);
                      },
                    }
                  );
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Assign to…" />
                </SelectTrigger>
                <SelectContent>
                  {staff?.data?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => setBulkSelected([])}>
                Clear
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton className="h-96" count={3} />
      ) : (
        <Tabs value={view} onValueChange={setView}>
          <TabsContent value="board" className="mt-4">
            {tasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No tasks found"
                description="Try adjusting your filters or create a new task."
              />
            ) : (
              <KanbanBoard
                tasks={tasks}
                onStart={handleStart}
                onComplete={handleComplete}
                onInspect={handleInspect}
                onSkip={(id) => skipTask({ id, reason: 'Skipped from board' })}
                onAssign={handleAssign}
                staff={staff?.data}
              />
            )}
          </TabsContent>
          <TabsContent value="list" className="mt-4">
            {tasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No tasks found"
                description="Try adjusting your filters or create a new task."
              />
            ) : (
              <div className="rounded-md border">
                <TaskListView
                  tasks={tasks}
                  onStart={handleStart}
                  onComplete={handleComplete}
                  onInspect={handleInspect}
                  onAssign={handleAssign}
                  staff={staff?.data}
                />
              </div>
            )}
          </TabsContent>
          <TabsContent value="reports" className="mt-4">
            <ReportsView stats={stats?.data} />
          </TabsContent>
          <TabsContent value="supervisor" className="mt-4">
            <SupervisorBoard />
          </TabsContent>
        </Tabs>
      )}

      {/* Assign Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task — Room {selectedTask?.room?.number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Staff Member</label>
              <Select onValueChange={handleAssignSubmit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff?.data?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {s.firstName} {s.lastName}
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {s.todayTaskCount} tasks today
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTask && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Type: {TYPE_LABELS[selectedTask.type]}</p>
                <p>
                  Priority:{' '}
                  <Badge className={PRIORITY_COLORS[selectedTask.priority]}>
                    {selectedTask.priority}
                  </Badge>
                </p>
                <p>
                  Scheduled: {formatDate(selectedTask.scheduledAt)} at{' '}
                  {formatTime(selectedTask.scheduledAt)}
                </p>
                {selectedTask.estimatedDuration && (
                  <p>Est. duration: {selectedTask.estimatedDuration} min</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignModalOpen(false);
                setSelectedTask(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* T2: Minibar logging */}
      <MinibarModal open={minibarOpen} onClose={() => setMinibarOpen(false)} />
    </div>
  );
}
