// pages/app/marketing/automation.jsx
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Copy,
  Settings,
  Zap,
  Mail,
  Clock,
  Users,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Save,
  Download,
  Undo,
  Redo,
  Eye,
  MousePointer,
  ArrowRight,
  Workflow,
  Timer,
  Bell,
  Send,
  Target,
  BarChart3,
  RefreshCw,
  X,
  Search,
  LayoutTemplate,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

/* ─── Node Type Definitions ─── */
const NODE_TYPES = {
  trigger: {
    label: 'Trigger',
    icon: Zap,
    color: 'bg-accent/10 text-accent border-accent/20',
    desc: 'Starts the workflow',
    category: 'triggers',
    inputs: 0,
    outputs: 1,
    configFields: [
      {
        key: 'triggerType',
        label: 'Trigger Type',
        type: 'select',
        options: [
          { value: 'guest_checkin', label: 'Guest Check-in' },
          { value: 'booking_confirmed', label: 'Booking Confirmed' },
          { value: 'booking_cancelled', label: 'Booking Cancelled' },
          { value: 'abandoned_cart', label: 'Abandoned Cart' },
          { value: 'birthday', label: 'Guest Birthday' },
          { value: 'loyalty_upgrade', label: 'Loyalty Tier Upgrade' },
          { value: 'manual', label: 'Manual Start' },
          { value: 'schedule', label: 'Scheduled' },
        ],
      },
      {
        key: 'schedule',
        label: 'Schedule (Cron)',
        type: 'text',
        placeholder: '0 9 * * *',
        showIf: (c) => c.triggerType === 'schedule',
      },
      {
        key: 'delayMinutes',
        label: 'Delay (minutes)',
        type: 'number',
        showIf: (c) => c.triggerType !== 'manual',
      },
    ],
  },
  delay: {
    label: 'Wait',
    icon: Timer,
    color: 'bg-info/10 text-info border-info/20',
    desc: 'Pause for a set time',
    category: 'flow',
    inputs: 1,
    outputs: 1,
    configFields: [
      {
        key: 'waitType',
        label: 'Wait Type',
        type: 'select',
        options: [
          { value: 'fixed', label: 'Fixed Duration' },
          { value: 'until_time', label: 'Until Specific Time' },
          { value: 'until_date', label: 'Until Specific Date' },
        ],
      },
      {
        key: 'duration',
        label: 'Duration',
        type: 'select',
        options: [
          { value: '1h', label: '1 Hour' },
          { value: '4h', label: '4 Hours' },
          { value: '12h', label: '12 Hours' },
          { value: '1d', label: '1 Day' },
          { value: '2d', label: '2 Days' },
          { value: '7d', label: '1 Week' },
          { value: 'custom', label: 'Custom' },
        ],
        showIf: (c) => c.waitType === 'fixed',
      },
      {
        key: 'customMinutes',
        label: 'Custom Minutes',
        type: 'number',
        showIf: (c) => c.waitType === 'fixed' && c.duration === 'custom',
      },
    ],
  },
  condition: {
    label: 'Condition',
    icon: Filter,
    color: 'bg-warning/10 text-warning border-warning/20',
    desc: 'Branch based on rules',
    category: 'flow',
    inputs: 1,
    outputs: 2,
    configFields: [
      {
        key: 'field',
        label: 'Field',
        type: 'select',
        options: [
          { value: 'guest_type', label: 'Guest Type' },
          { value: 'booking_value', label: 'Booking Value' },
          { value: 'loyalty_tier', label: 'Loyalty Tier' },
          { value: 'nights_stayed', label: 'Nights Stayed' },
          { value: 'room_type', label: 'Room Type' },
          { value: 'checkin_date', label: 'Check-in Date' },
          { value: 'email_opened', label: 'Email Opened' },
          { value: 'email_clicked', label: 'Email Clicked' },
        ],
      },
      {
        key: 'operator',
        label: 'Operator',
        type: 'select',
        options: [
          { value: 'eq', label: 'Equals' },
          { value: 'ne', label: 'Not Equals' },
          { value: 'gt', label: 'Greater Than' },
          { value: 'lt', label: 'Less Than' },
          { value: 'contains', label: 'Contains' },
          { value: 'in', label: 'In List' },
        ],
      },
      { key: 'value', label: 'Value', type: 'text' },
      { key: 'trueLabel', label: 'True Branch Label', type: 'text', defaultValue: 'Yes' },
      { key: 'falseLabel', label: 'False Branch Label', type: 'text', defaultValue: 'No' },
    ],
  },
  email: {
    label: 'Send Email',
    icon: Mail,
    color: 'bg-secondary/10 text-secondary border-secondary/20',
    desc: 'Send an email campaign',
    category: 'actions',
    inputs: 1,
    outputs: 1,
    configFields: [
      {
        key: 'template',
        label: 'Email Template',
        type: 'select',
        options: [
          { value: 'welcome', label: 'Welcome Email' },
          { value: 'promo', label: 'Promotional Offer' },
          { value: 'newsletter', label: 'Monthly Newsletter' },
          { value: 'thank_you', label: 'Thank You' },
          { value: 'review_request', label: 'Review Request' },
          { value: 'birthday', label: 'Birthday Special' },
          { value: 'abandoned_cart', label: 'Cart Recovery' },
        ],
      },
      { key: 'subject', label: 'Subject Line', type: 'text' },
      { key: 'fromName', label: 'From Name', type: 'text', defaultValue: 'Grand Hotel' },
      {
        key: 'fromEmail',
        label: 'From Email',
        type: 'text',
        defaultValue: 'noreply@grandhotel.com',
      },
      { key: 'trackOpens', label: 'Track Opens', type: 'checkbox', defaultValue: true },
      { key: 'trackClicks', label: 'Track Clicks', type: 'checkbox', defaultValue: true },
    ],
  },
  notification: {
    label: 'Push Notification',
    icon: Bell,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    desc: 'Send push or SMS',
    category: 'actions',
    inputs: 1,
    outputs: 1,
    configFields: [
      {
        key: 'channel',
        label: 'Channel',
        type: 'select',
        options: [
          { value: 'push', label: 'Push Notification' },
          { value: 'sms', label: 'SMS' },
          { value: 'in_app', label: 'In-App Message' },
        ],
      },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'actionUrl', label: 'Action URL', type: 'text' },
    ],
  },
  tag: {
    label: 'Add Tag',
    icon: Target,
    color: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    desc: 'Tag or segment guest',
    category: 'actions',
    inputs: 1,
    outputs: 1,
    configFields: [
      {
        key: 'action',
        label: 'Action',
        type: 'select',
        options: [
          { value: 'add_tag', label: 'Add Tag' },
          { value: 'remove_tag', label: 'Remove Tag' },
          { value: 'add_segment', label: 'Add to Segment' },
          { value: 'remove_segment', label: 'Remove from Segment' },
        ],
      },
      { key: 'tag', label: 'Tag / Segment', type: 'text' },
    ],
  },
  webhook: {
    label: 'Webhook',
    icon: Send,
    color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    desc: 'Call external API',
    category: 'actions',
    inputs: 1,
    outputs: 1,
    configFields: [
      {
        key: 'method',
        label: 'Method',
        type: 'select',
        options: [
          { value: 'POST', label: 'POST' },
          { value: 'GET', label: 'GET' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' },
        ],
      },
      { key: 'url', label: 'URL', type: 'text' },
      { key: 'headers', label: 'Headers (JSON)', type: 'textarea', defaultValue: '{}' },
    ],
  },
  analytics: {
    label: 'Track Event',
    icon: BarChart3,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    desc: 'Log analytics event',
    category: 'actions',
    inputs: 1,
    outputs: 1,
    configFields: [
      { key: 'eventName', label: 'Event Name', type: 'text' },
      { key: 'properties', label: 'Properties (JSON)', type: 'textarea', defaultValue: '{}' },
    ],
  },
  end: {
    label: 'End',
    icon: CheckCircle2,
    color: 'bg-danger/10 text-danger border-danger/20',
    desc: 'Terminate workflow',
    category: 'flow',
    inputs: 1,
    outputs: 0,
    configFields: [
      {
        key: 'endType',
        label: 'End Type',
        type: 'select',
        options: [
          { value: 'success', label: 'Success' },
          { value: 'failure', label: 'Failure' },
        ],
      },
    ],
  },
};

const NODE_CATEGORIES = [
  { id: 'triggers', label: 'Triggers' },
  { id: 'flow', label: 'Flow Control' },
  { id: 'actions', label: 'Actions' },
];

/* ─── Sample Workflows ─── */
const SAMPLE_WORKFLOWS = [
  {
    id: 'welcome_series',
    name: 'Welcome Series',
    description: 'Onboarding sequence for new guests',
    nodes: [
      { id: 't1', type: 'trigger', x: 300, y: 50, config: { triggerType: 'booking_confirmed' } },
      { id: 'd1', type: 'delay', x: 300, y: 180, config: { waitType: 'fixed', duration: '1h' } },
      {
        id: 'e1',
        type: 'email',
        x: 300,
        y: 310,
        config: { template: 'welcome', subject: 'Welcome to Grand Hotel!' },
      },
      { id: 'd2', type: 'delay', x: 300, y: 440, config: { waitType: 'fixed', duration: '1d' } },
      {
        id: 'c1',
        type: 'condition',
        x: 300,
        y: 570,
        config: {
          field: 'email_opened',
          operator: 'eq',
          value: 'true',
          trueLabel: 'Opened',
          falseLabel: 'Not Opened',
        },
      },
      {
        id: 'e2',
        type: 'email',
        x: 150,
        y: 720,
        config: { template: 'promo', subject: 'Exclusive Offer for You' },
      },
      {
        id: 'e3',
        type: 'email',
        x: 450,
        y: 720,
        config: { template: 'review_request', subject: 'How Was Your Stay?' },
      },
      { id: 'end1', type: 'end', x: 300, y: 850, config: { endType: 'success' } },
    ],
    edges: [
      { from: 't1', to: 'd1', fromOutput: 0, toInput: 0 },
      { from: 'd1', to: 'e1', fromOutput: 0, toInput: 0 },
      { from: 'e1', to: 'd2', fromOutput: 0, toInput: 0 },
      { from: 'd2', to: 'c1', fromOutput: 0, toInput: 0 },
      { from: 'c1', to: 'e2', fromOutput: 0, toInput: 0, label: 'Yes' },
      { from: 'c1', to: 'e3', fromOutput: 1, toInput: 0, label: 'No' },
      { from: 'e2', to: 'end1', fromOutput: 0, toInput: 0 },
      { from: 'e3', to: 'end1', fromOutput: 0, toInput: 0 },
    ],
  },
  {
    id: 'cart_recovery',
    name: 'Cart Recovery',
    description: 'Recover abandoned bookings',
    nodes: [
      { id: 't1', type: 'trigger', x: 300, y: 50, config: { triggerType: 'abandoned_cart' } },
      { id: 'd1', type: 'delay', x: 300, y: 180, config: { waitType: 'fixed', duration: '1h' } },
      {
        id: 'e1',
        type: 'email',
        x: 300,
        y: 310,
        config: { template: 'abandoned_cart', subject: 'Complete Your Reservation' },
      },
      { id: 'd2', type: 'delay', x: 300, y: 440, config: { waitType: 'fixed', duration: '1d' } },
      {
        id: 'c1',
        type: 'condition',
        x: 300,
        y: 570,
        config: {
          field: 'booking_value',
          operator: 'gt',
          value: '500',
          trueLabel: 'High Value',
          falseLabel: 'Standard',
        },
      },
      {
        id: 'e2',
        type: 'email',
        x: 150,
        y: 720,
        config: { template: 'promo', subject: 'We Miss You — 15% Off' },
      },
      {
        id: 'n1',
        type: 'notification',
        x: 450,
        y: 720,
        config: {
          channel: 'sms',
          title: 'Booking Reminder',
          body: 'Complete your booking and save 10%!',
        },
      },
      { id: 'end1', type: 'end', x: 300, y: 850, config: { endType: 'success' } },
    ],
    edges: [
      { from: 't1', to: 'd1', fromOutput: 0, toInput: 0 },
      { from: 'd1', to: 'e1', fromOutput: 0, toInput: 0 },
      { from: 'e1', to: 'd2', fromOutput: 0, toInput: 0 },
      { from: 'd2', to: 'c1', fromOutput: 0, toInput: 0 },
      { from: 'c1', to: 'e2', fromOutput: 0, toInput: 0, label: 'High' },
      { from: 'c1', to: 'n1', fromOutput: 1, toInput: 0, label: 'Standard' },
      { from: 'e2', to: 'end1', fromOutput: 0, toInput: 0 },
      { from: 'n1', to: 'end1', fromOutput: 0, toInput: 0 },
    ],
  },
  {
    id: 'birthday_reward',
    name: 'Birthday Rewards',
    description: 'Automatic birthday perks',
    nodes: [
      { id: 't1', type: 'trigger', x: 300, y: 50, config: { triggerType: 'birthday' } },
      {
        id: 'd1',
        type: 'delay',
        x: 300,
        y: 180,
        config: { waitType: 'fixed', duration: 'custom', customMinutes: 0 },
      },
      {
        id: 'e1',
        type: 'email',
        x: 300,
        y: 310,
        config: { template: 'birthday', subject: '🎂 Happy Birthday from Grand Hotel!' },
      },
      {
        id: 'tag1',
        type: 'tag',
        x: 300,
        y: 440,
        config: { action: 'add_tag', tag: 'birthday-reward-sent' },
      },
      { id: 'end1', type: 'end', x: 300, y: 570, config: { endType: 'success' } },
    ],
    edges: [
      { from: 't1', to: 'd1', fromOutput: 0, toInput: 0 },
      { from: 'd1', to: 'e1', fromOutput: 0, toInput: 0 },
      { from: 'e1', to: 'tag1', fromOutput: 0, toInput: 0 },
      { from: 'tag1', to: 'end1', fromOutput: 0, toInput: 0 },
    ],
  },
];

/* ─── Helpers ─── */
function generateId() {
  return `node-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ─── Connection Path ─── */
function getConnectionPath(x1, y1, x2, y2) {
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

/* ─── Mini Node Component ─── */
function WorkflowNode({
  node,
  isSelected,
  isExecuting,
  executionStatus,
  onSelect,
  onDragStart,
  onDrag,
  onDragEnd,
  onConnectStart,
  onConnectEnd,
  scale,
}) {
  const typeDef = NODE_TYPES[node.type];
  const Icon = typeDef.icon;
  const isCondition = node.type === 'condition';
  const outputCount = typeDef.outputs;
  const inputCount = typeDef.inputs;

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onDragStart(node.id, e.clientX, e.clientY);
  };

  const handleOutputMouseDown = (e, outputIndex) => {
    e.stopPropagation();
    onConnectStart(node.id, outputIndex, e);
  };

  const handleInputMouseUp = (e, inputIndex) => {
    e.stopPropagation();
    onConnectEnd(node.id, inputIndex);
  };

  return (
    <div
      className={cn('absolute select-none', isSelected && 'z-20', !isSelected && 'z-10')}
      style={{
        left: node.x,
        top: node.y,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {/* Node Card */}
      <div
        className={cn(
          'w-52 rounded-xl border bg-surface shadow-sm transition-all',
          isSelected
            ? 'border-secondary ring-2 ring-secondary/30'
            : 'border-border hover:border-secondary/50',
          isExecuting && executionStatus === 'running' && 'ring-2 ring-accent animate-pulse',
          isExecuting && executionStatus === 'success' && 'border-accent',
          isExecuting && executionStatus === 'error' && 'border-danger'
        )}
      >
        {/* Header */}
        <div
          className={cn('flex items-center gap-2 px-3 py-2 rounded-t-xl border-b', typeDef.color)}
        >
          <Icon className="h-4 w-4" />
          <span className="text-xs font-semibold truncate">{typeDef.label}</span>
          {isExecuting && executionStatus === 'running' && (
            <RefreshCw className="h-3 w-3 ml-auto animate-spin" />
          )}
          {isExecuting && executionStatus === 'success' && (
            <CheckCircle2 className="h-3 w-3 ml-auto text-accent" />
          )}
          {isExecuting && executionStatus === 'error' && (
            <XCircle className="h-3 w-3 ml-auto text-danger" />
          )}
        </div>

        {/* Body */}
        <div className="px-3 py-2">
          <p className="text-[10px] text-text-muted truncate">
            {node.config?.subject ||
              node.config?.triggerType ||
              node.config?.waitType ||
              typeDef.desc}
          </p>
        </div>

        {/* Input Handles */}
        {inputCount > 0 && (
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {Array.from({ length: inputCount }).map((_, i) => (
              <div
                key={`in-${i}`}
                className="w-3 h-3 rounded-full bg-surface border-2 border-secondary cursor-crosshair hover:scale-125 transition-transform"
                title="Input"
                onMouseUp={(e) => handleInputMouseUp(e, i)}
              />
            ))}
          </div>
        )}

        {/* Output Handles */}
        {outputCount > 0 && (
          <div
            className={cn(
              'absolute -right-1.5 flex flex-col gap-2',
              isCondition ? 'top-1/4' : 'top-1/2 -translate-y-1/2'
            )}
          >
            {Array.from({ length: outputCount }).map((_, i) => (
              <div
                key={`out-${i}`}
                className="w-3 h-3 rounded-full bg-surface border-2 border-accent cursor-crosshair hover:scale-125 transition-transform"
                title={
                  isCondition && i === 0 ? 'True' : isCondition && i === 1 ? 'False' : 'Output'
                }
                onMouseDown={(e) => handleOutputMouseDown(e, i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Condition branch labels */}
      {isCondition && (
        <>
          <div className="absolute -right-16 top-0 text-[10px] font-medium text-accent">
            {node.config?.trueLabel || 'Yes'}
          </div>
          <div className="absolute -right-16 bottom-0 text-[10px] font-medium text-text-muted">
            {node.config?.falseLabel || 'No'}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Edge Component ─── */
function WorkflowEdge({ edge, nodes, isSelected, onSelect, onDelete, label }) {
  const fromNode = nodes.find((n) => n.id === edge.from);
  const toNode = nodes.find((n) => n.id === edge.to);
  if (!fromNode || !toNode) return null;

  const typeDef = NODE_TYPES[fromNode.type];
  const isCondition = fromNode.type === 'condition';
  const outputY = isCondition
    ? edge.fromOutput === 0
      ? fromNode.y - 25
      : fromNode.y + 25
    : fromNode.y;

  const x1 = fromNode.x + 104;
  const y1 = outputY;
  const x2 = toNode.x - 104;
  const y2 = toNode.y;

  const midX = (x1 + x2) / 2;

  return (
    <g
      className="group cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(edge.id);
      }}
    >
      {/* Invisible wider path for easier clicking */}
      <path
        d={getConnectionPath(x1, y1, x2, y2)}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
      />
      {/* Visible path */}
      <path
        d={getConnectionPath(x1, y1, x2, y2)}
        className={cn(
          'transition-all',
          isSelected
            ? 'stroke-secondary stroke-[3]'
            : 'stroke-border stroke-2 group-hover:stroke-text-muted'
        )}
        fill="none"
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <polygon
        points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`}
        className={cn(isSelected ? 'fill-secondary' : 'fill-border group-hover:fill-text-muted')}
      />
      {/* Label */}
      {label && (
        <rect
          x={midX - 20}
          y={(y1 + y2) / 2 - 10}
          width="40"
          height="18"
          rx="4"
          className="fill-surface stroke-border"
          strokeWidth="1"
        />
      )}
      {label && (
        <text
          x={midX}
          y={(y1 + y2) / 2 + 2}
          textAnchor="middle"
          className="fill-text-muted text-[9px] font-medium"
        >
          {label}
        </text>
      )}
      {/* Delete button on hover */}
      {isSelected && (
        <g
          transform={`translate(${midX}, ${(y1 + y2) / 2 - 20})`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(edge.id);
          }}
        >
          <circle r="8" className="fill-danger cursor-pointer" />
          <text
            y="3"
            textAnchor="middle"
            className="fill-white text-[10px] font-bold cursor-pointer"
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
}

/* ─── Property Panel ─── */
function PropertyPanel({ node, onChange, onDelete }) {
  const typeDef = NODE_TYPES[node.type];

  const handleConfigChange = (key, value) => {
    onChange(node.id, {
      ...node,
      config: { ...node.config, [key]: value },
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <typeDef.icon className={cn('h-4 w-4', typeDef.color.split(' ')[1])} />
          <h3 className="text-sm font-semibold text-text-primary">{typeDef.label}</h3>
        </div>
        <p className="text-xs text-text-muted">{typeDef.desc}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {typeDef.configFields.map((field) => {
          const shouldShow = !field.showIf || field.showIf(node.config || {});
          if (!shouldShow) return null;

          const value = node.config?.[field.key] ?? field.defaultValue ?? '';

          return (
            <div key={field.key} className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">{field.label}</label>
              {field.type === 'text' && (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              )}
              {field.type === 'number' && (
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleConfigChange(field.key, Number(e.target.value))}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              )}
              {field.type === 'textarea' && (
                <textarea
                  value={value}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              )}
              {field.type === 'select' && (
                <select
                  value={value}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              {field.type === 'checkbox' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => handleConfigChange(field.key, e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-xs text-text-secondary">Enabled</span>
                </label>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border p-4">
        <button
          onClick={() => onDelete(node.id)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" /> Delete Node
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function AutomationPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [activeCategory, setActiveCategory] = useState('triggers');
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [connectState, setConnectState] = useState(null);
  const [tempEdge, setTempEdge] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize with welcome series
  useEffect(() => {
    loadWorkflow(SAMPLE_WORKFLOWS[0]);
  }, []);

  // History management
  const pushHistory = useCallback(
    (newNodes, newEdges) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({
          nodes: deepClone(newNodes),
          edges: deepClone(newEdges),
          name: workflowName,
        });
        return newHistory;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex, workflowName]
  );

  const undo = () => {
    if (historyIndex > 0) {
      const state = history[historyIndex - 1];
      setNodes(deepClone(state.nodes));
      setEdges(deepClone(state.edges));
      setWorkflowName(state.name);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const state = history[historyIndex + 1];
      setNodes(deepClone(state.nodes));
      setEdges(deepClone(state.edges));
      setWorkflowName(state.name);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Load workflow
  const loadWorkflow = (template) => {
    const newNodes = deepClone(template.nodes).map((n) => ({ ...n, id: generateId() }));
    const idMap = {};
    template.nodes.forEach((old, i) => {
      idMap[old.id] = newNodes[i].id;
    });
    const newEdges = deepClone(template.edges).map((e) => ({
      ...e,
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      from: idMap[e.from],
      to: idMap[e.to],
    }));
    setNodes(newNodes);
    setEdges(newEdges);
    setWorkflowName(template.name);
    setWorkflowDescription(template.description || '');
    setSelectedId(null);
    pushHistory(newNodes, newEdges);
  };

  // Add node
  const addNode = (type, x, y) => {
    const newNode = {
      id: generateId(),
      type,
      x: x || 300,
      y: y || 100,
      config: {},
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    setSelectedId(newNode.id);
    pushHistory(newNodes, edges);
  };

  // Update node
  const updateNode = (id, updated) => {
    const newNodes = nodes.map((n) => (n.id === id ? updated : n));
    setNodes(newNodes);
    pushHistory(newNodes, edges);
  };

  // Delete node
  const deleteNode = (id) => {
    const newNodes = nodes.filter((n) => n.id !== id);
    const newEdges = edges.filter((e) => e.from !== id && e.to !== id);
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedId(null);
    pushHistory(newNodes, newEdges);
  };

  // Delete edge
  const deleteEdge = (id) => {
    const newEdges = edges.filter((e) => e.id !== id);
    setEdges(newEdges);
    setSelectedId(null);
    pushHistory(nodes, newEdges);
  };

  // Drag handlers
  const handleDragStart = (nodeId, clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const node = nodes.find((n) => n.id === nodeId);
    setDragState({
      nodeId,
      startX: clientX,
      startY: clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (dragState) {
        const dx = (e.clientX - dragState.startX) / scale;
        const dy = (e.clientY - dragState.startY) / scale;
        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragState.nodeId
              ? { ...n, x: dragState.nodeStartX + dx, y: dragState.nodeStartY + dy }
              : n
          )
        );
      }
      if (isPanning) {
        setPan((prev) => ({
          x: prev.x + e.movementX,
          y: prev.y + e.movementY,
        }));
      }
      if (connectState) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setTempEdge({
            x1: connectState.startX,
            y1: connectState.startY,
            x2: (e.clientX - rect.left - pan.x) / scale,
            y2: (e.clientY - rect.top - pan.y) / scale,
          });
        }
      }
    },
    [dragState, isPanning, connectState, scale, pan]
  );

  const handleMouseUp = useCallback(() => {
    if (dragState) {
      pushHistory(nodes, edges);
    }
    setDragState(null);
    setIsPanning(false);
    setConnectState(null);
    setTempEdge(null);
  }, [dragState, nodes, edges, pushHistory]);

  // Connection handlers
  const handleConnectStart = (nodeId, outputIndex, e) => {
    const node = nodes.find((n) => n.id === nodeId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!node || !rect) return;

    const typeDef = NODE_TYPES[node.type];
    const isCondition = node.type === 'condition';
    const outputY = isCondition ? (outputIndex === 0 ? node.y - 25 : node.y + 25) : node.y;

    setConnectState({
      fromNode: nodeId,
      fromOutput: outputIndex,
      startX: node.x + 104,
      startY: outputY,
    });
  };

  const handleConnectEnd = (nodeId, inputIndex) => {
    if (!connectState) return;
    if (connectState.fromNode === nodeId) return;

    // Check if connection already exists
    const exists = edges.some(
      (e) =>
        e.from === connectState.fromNode &&
        e.to === nodeId &&
        e.fromOutput === connectState.fromOutput
    );
    if (exists) return;

    const newEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      from: connectState.fromNode,
      to: nodeId,
      fromOutput: connectState.fromOutput,
      toInput: inputIndex,
    };
    const newEdges = [...edges, newEdge];
    setEdges(newEdges);
    pushHistory(nodes, newEdges);
    setConnectState(null);
    setTempEdge(null);
  };

  // Canvas click
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.tagName === 'svg') {
      setSelectedId(null);
    }
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(0.5, Math.min(2, prev * delta)));
  };

  // Execution simulation
  const runSimulation = async () => {
    setIsExecuting(true);
    setExecutionProgress({});

    const sorted = topologicalSort(nodes, edges);
    for (const nodeId of sorted) {
      setExecutionProgress((prev) => ({ ...prev, [nodeId]: 'running' }));
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      setExecutionProgress((prev) => ({ ...prev, [nodeId]: 'success' }));
    }

    setTimeout(() => {
      setIsExecuting(false);
      setExecutionProgress({});
    }, 2000);
  };

  function topologicalSort(nodes, edges) {
    const adj = {};
    const inDegree = {};
    nodes.forEach((n) => {
      adj[n.id] = [];
      inDegree[n.id] = 0;
    });
    edges.forEach((e) => {
      adj[e.from].push(e.to);
      inDegree[e.to]++;
    });
    const queue = nodes.filter((n) => inDegree[n.id] === 0).map((n) => n.id);
    const result = [];
    while (queue.length) {
      const curr = queue.shift();
      result.push(curr);
      adj[curr].forEach((next) => {
        inDegree[next]--;
        if (inDegree[next] === 0) queue.push(next);
      });
    }
    return result;
  }

  // Selected item
  const selectedNode = nodes.find((n) => n.id === selectedId);
  const selectedEdge = edges.find((e) => e.id === selectedId);

  // Export
  const exportWorkflow = () => {
    const data = {
      name: workflowName,
      description: workflowDescription,
      nodes,
      edges,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col -m-4 -mt-0 lg:-m-8 lg:-mt-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/marketing')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-surface-elevated"
          >
            <ChevronRight className="h-4 w-4 text-text-secondary rotate-180" />
          </button>
          <div>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="h-7 rounded-md border-0 bg-transparent px-1 text-sm font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-[10px] text-text-muted px-1">{workflowDescription}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center rounded-md border border-border bg-background p-0.5">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-surface-elevated disabled:opacity-30"
            >
              <Undo className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-surface-elevated disabled:opacity-30"
            >
              <Redo className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
            <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" /> Templates
          </Button>

          <Button variant="outline" size="sm" onClick={exportWorkflow}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>

          <Button
            variant={isExecuting ? 'danger' : 'outline'}
            size="sm"
            onClick={isExecuting ? () => setIsExecuting(false) : runSimulation}
          >
            {isExecuting ? (
              <>
                <Pause className="mr-1.5 h-3.5 w-3.5" /> Stop
              </>
            ) : (
              <>
                <Play className="mr-1.5 h-3.5 w-3.5" /> Test Run
              </>
            )}
          </Button>

          <Button size="sm">
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save
          </Button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Node palette */}
        <div className="w-56 border-r border-border bg-surface flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="flex gap-1">
              {NODE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
                    activeCategory === cat.id
                      ? 'bg-secondary text-white'
                      : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {Object.entries(NODE_TYPES)
              .filter(([_, def]) => def.category === activeCategory)
              .map(([type, def]) => {
                const Icon = def.icon;
                return (
                  <button
                    key={type}
                    onClick={() =>
                      addNode(
                        type,
                        300 + (Math.random() - 0.5) * 100,
                        150 + (Math.random() - 0.5) * 50
                      )
                    }
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-surface-elevated group"
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        def.color.split(' ')[0]
                      )}
                    >
                      <Icon className={cn('h-4 w-4', def.color.split(' ')[1])} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary">{def.label}</p>
                      <p className="text-[10px] text-text-muted truncate">{def.desc}</p>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A] relative overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            if (e.button === 1 || (e.button === 0 && e.target === canvasRef.current)) {
              setIsPanning(true);
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Grid pattern */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ minWidth: '2000px', minHeight: '2000px' }}
            >
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-border/30"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Edges SVG */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ minWidth: '2000px', minHeight: '2000px', pointerEvents: 'all' }}
            >
              {edges.map((edge) => (
                <WorkflowEdge
                  key={edge.id}
                  edge={edge}
                  nodes={nodes}
                  isSelected={selectedId === edge.id}
                  onSelect={setSelectedId}
                  onDelete={deleteEdge}
                  label={edge.label}
                />
              ))}
              {/* Temp edge while dragging */}
              {tempEdge && connectState && (
                <path
                  d={getConnectionPath(tempEdge.x1, tempEdge.y1, tempEdge.x2, tempEdge.y2)}
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <WorkflowNode
                key={node.id}
                node={node}
                isSelected={selectedId === node.id}
                isExecuting={isExecuting}
                executionStatus={executionProgress[node.id]}
                onSelect={setSelectedId}
                onDragStart={handleDragStart}
                onDrag={handleMouseMove}
                onDragEnd={handleMouseUp}
                onConnectStart={handleConnectStart}
                onConnectEnd={handleConnectEnd}
                scale={scale}
              />
            ))}
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-md border border-border bg-surface p-0.5 shadow-sm">
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-surface-elevated"
            >
              −
            </button>
            <span className="text-xs font-mono w-12 text-center text-text-secondary">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2, s + 0.1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-surface-elevated"
            >
              +
            </button>
            <button
              onClick={() => {
                setScale(1);
                setPan({ x: 0, y: 0 });
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-surface-elevated"
              title="Reset"
            >
              <Target className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Stats */}
          <div className="absolute top-4 left-4 rounded-md border border-border bg-surface/90 backdrop-blur px-3 py-1.5 shadow-sm">
            <p className="text-[10px] text-text-muted">
              {nodes.length} nodes · {edges.length} connections
            </p>
          </div>
        </div>

        {/* Right sidebar — Properties */}
        <div className="w-72 border-l border-border bg-surface overflow-hidden flex flex-col">
          {selectedNode ? (
            <PropertyPanel node={selectedNode} onChange={updateNode} onDelete={deleteNode} />
          ) : selectedEdge ? (
            <div className="h-full flex flex-col">
              <div className="border-b border-border p-4">
                <h3 className="text-sm font-semibold text-text-primary">Connection</h3>
                <p className="text-xs text-text-muted mt-1">
                  From {nodes.find((n) => n.id === selectedEdge.from)?.type} to{' '}
                  {nodes.find((n) => n.id === selectedEdge.to)?.type}
                </p>
              </div>
              <div className="flex-1 p-4">
                <button
                  onClick={() => deleteEdge(selectedEdge.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-4 w-4" /> Delete Connection
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <MousePointer className="h-10 w-10 text-text-muted mb-3" />
              <p className="text-sm text-text-muted">Select a node or connection to edit</p>
              <p className="text-xs text-text-muted mt-1">
                Drag from output handles to create connections
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowTemplates(false)} />
          <div className="relative w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Workflow Templates</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {SAMPLE_WORKFLOWS.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    loadWorkflow(template);
                    setShowTemplates(false);
                  }}
                  className="rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-secondary/50 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 mb-3">
                    <Workflow className="h-5 w-5 text-secondary" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">{template.name}</h3>
                  <p className="text-xs text-text-muted mt-1">{template.description}</p>
                  <p className="text-[10px] text-text-muted mt-2">
                    {template.nodes.length} nodes · {template.edges.length} connections
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomationPage;
