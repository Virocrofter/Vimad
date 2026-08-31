/* src/app/admin/onboarding/data.js */

/* ─── Onboarding Funnel Stages ─── */
export const funnelStages = [
  {
    id: 'signup',
    label: 'Sign Up',
    description: 'Account created, email verified',
    order: 1,
    isStart: true,
  },
  {
    id: 'property_setup',
    label: 'Property Setup',
    description: 'Property details, address, room count configured',
    order: 2,
    avgDuration: '4m 30s',
  },
  {
    id: 'room_config',
    label: 'Room Configuration',
    description: 'Room types, rates, and inventory defined',
    order: 3,
    avgDuration: '8m 15s',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Booking engine, channel manager, payments connected',
    order: 4,
    avgDuration: '6m 45s',
    optional: true,
  },
  {
    id: 'team_invite',
    label: 'Team Invites',
    description: 'First team member invited to property',
    order: 5,
    avgDuration: '2m 10s',
    optional: true,
  },
  {
    id: 'first_reservation',
    label: 'First Reservation',
    description: 'Created or imported first booking',
    order: 6,
    avgDuration: '5m 20s',
  },
  {
    id: 'first_checkin',
    label: 'First Check-in',
    description: 'Successfully checked in a guest',
    order: 7,
    avgDuration: '3m 00s',
  },
  {
    id: 'billing_setup',
    label: 'Billing Setup',
    description: 'Payment method added, plan selected',
    order: 8,
    avgDuration: '3m 45s',
  },
  {
    id: 'converted',
    label: 'Converted to Paid',
    description: 'First invoice paid, trial ended',
    order: 9,
    isEnd: true,
  },
];

/* ─── Mock Tenant Onboarding Progress ─── */
export const onboardingTenants = [
  {
    id: 'TNT-003',
    name: 'Mountain Lodge Aspen',
    subdomain: 'mountainlodge',
    plan: 'Professional',
    trialStart: '2026-08-01',
    trialEnd: '2026-08-15',
    daysRemaining: -2,
    status: 'trial_expired',
    progress: {
      signup: { completed: true, completedAt: '2026-08-01 09:15:00', duration: 120 },
      property_setup: { completed: true, completedAt: '2026-08-01 09:22:00', duration: 270 },
      room_config: { completed: true, completedAt: '2026-08-01 09:35:00', duration: 480 },
      integrations: { completed: false, startedAt: '2026-08-01 09:40:00', progress: 30 },
      team_invite: { completed: false },
      first_reservation: { completed: false },
      first_checkin: { completed: false },
      billing_setup: { completed: false },
      converted: { completed: false },
    },
    lastActivity: '2026-08-05 14:20:00',
    sessions: 4,
    totalTimeOnPlatform: 1850,
    dropOffStage: 'integrations',
    dropOffReason: 'confusion',
    assignedCSM: 'Sarah Johnson',
    interventions: [
      { id: 'INT-001', type: 'email', sentAt: '2026-08-03 10:00:00', status: 'opened', subject: 'Let us help you connect your channels' },
      { id: 'INT-002', type: 'call', scheduledAt: '2026-08-06 14:00:00', status: 'no_answer', notes: 'Left voicemail' },
    ],
    revenueAtRisk: 499,
    healthScore: 42,
  },
  {
    id: 'TNT-011',
    name: 'Riverside Inn Portland',
    subdomain: 'riversideinn',
    plan: 'Starter',
    trialStart: '2026-08-10',
    trialEnd: '2026-08-24',
    daysRemaining: 7,
    status: 'active_trial',
    progress: {
      signup: { completed: true, completedAt: '2026-08-10 08:30:00', duration: 90 },
      property_setup: { completed: true, completedAt: '2026-08-10 08:38:00', duration: 310 },
      room_config: { completed: true, completedAt: '2026-08-10 09:00:00', duration: 520 },
      integrations: { completed: true, completedAt: '2026-08-10 09:15:00', duration: 380 },
      team_invite: { completed: false },
      first_reservation: { completed: true, completedAt: '2026-08-11 11:20:00', duration: 180 },
      first_checkin: { completed: false },
      billing_setup: { completed: false },
      converted: { completed: false },
    },
    lastActivity: '2026-08-16 16:45:00',
    sessions: 12,
    totalTimeOnPlatform: 4200,
    dropOffStage: null,
    assignedCSM: 'David Park',
    interventions: [
      { id: 'INT-003', type: 'in_app', sentAt: '2026-08-12 09:00:00', status: 'clicked', subject: 'Try your first check-in' },
    ],
    revenueAtRisk: 199,
    healthScore: 78,
  },
  {
    id: 'TNT-012',
    name: 'Ocean View Resort Malibu',
    subdomain: 'oceanview',
    plan: 'Enterprise',
    trialStart: '2026-08-05',
    trialEnd: '2026-08-19',
    daysRemaining: 2,
    status: 'at_risk',
    progress: {
      signup: { completed: true, completedAt: '2026-08-05 10:00:00', duration: 110 },
      property_setup: { completed: true, completedAt: '2026-08-05 10:08:00', duration: 290 },
      room_config: { completed: false, startedAt: '2026-08-05 10:15:00', progress: 45 },
      integrations: { completed: false },
      team_invite: { completed: false },
      first_reservation: { completed: false },
      first_checkin: { completed: false },
      billing_setup: { completed: false },
      converted: { completed: false },
    },
    lastActivity: '2026-08-08 09:30:00',
    sessions: 2,
    totalTimeOnPlatform: 890,
    dropOffStage: 'room_config',
    dropOffReason: 'complexity',
    assignedCSM: 'Sarah Johnson',
    interventions: [],
    revenueAtRisk: 999,
    healthScore: 28,
  },
  {
    id: 'TNT-013',
    name: 'Historic Downtown Charleston',
    subdomain: 'historiccharleston',
    plan: 'Professional',
    trialStart: '2026-08-12',
    trialEnd: '2026-08-26',
    daysRemaining: 9,
    status: 'active_trial',
    progress: {
      signup: { completed: true, completedAt: '2026-08-12 14:00:00', duration: 95 },
      property_setup: { completed: true, completedAt: '2026-08-12 14:10:00', duration: 340 },
      room_config: { completed: true, completedAt: '2026-08-12 14:25:00', duration: 490 },
      integrations: { completed: true, completedAt: '2026-08-12 14:40:00', duration: 410 },
      team_invite: { completed: true, completedAt: '2026-08-13 09:15:00', duration: 130 },
      first_reservation: { completed: true, completedAt: '2026-08-13 10:30:00', duration: 200 },
      first_checkin: { completed: true, completedAt: '2026-08-14 15:00:00', duration: 150 },
      billing_setup: { completed: false, startedAt: '2026-08-14 15:30:00', progress: 60 },
      converted: { completed: false },
    },
    lastActivity: '2026-08-16 11:00:00',
    sessions: 8,
    totalTimeOnPlatform: 3600,
    dropOffStage: null,
    assignedCSM: 'David Park',
    interventions: [
      { id: 'INT-004', type: 'email', sentAt: '2026-08-15 10:00:00', status: 'opened', subject: "You're almost there — complete billing" },
      { id: 'INT-005', type: 'call', scheduledAt: '2026-08-17 11:00:00', status: 'scheduled', notes: 'Billing walkthrough' },
    ],
    revenueAtRisk: 499,
    healthScore: 92,
  },
  {
    id: 'TNT-014',
    name: 'Lake House Minneapolis',
    subdomain: 'lakehouse',
    plan: 'Starter',
    trialStart: '2026-08-08',
    trialEnd: '2026-08-22',
    daysRemaining: 5,
    status: 'active_trial',
    progress: {
      signup: { completed: true, completedAt: '2026-08-08 11:00:00', duration: 85 },
      property_setup: { completed: true, completedAt: '2026-08-08 11:10:00', duration: 300 },
      room_config: { completed: false, startedAt: '2026-08-08 11:20:00', progress: 20 },
      integrations: { completed: false },
      team_invite: { completed: false },
      first_reservation: { completed: false },
      first_checkin: { completed: false },
      billing_setup: { completed: false },
      converted: { completed: false },
    },
    lastActivity: '2026-08-09 16:00:00',
    sessions: 3,
    totalTimeOnPlatform: 1200,
    dropOffStage: 'room_config',
    dropOffReason: 'time_constraints',
    assignedCSM: 'Mike Chen',
    interventions: [
      { id: 'INT-006', type: 'email', sentAt: '2026-08-10 09:00:00', status: 'unopened', subject: 'Need help setting up your rooms?' },
    ],
    revenueAtRisk: 199,
    healthScore: 35,
  },
  {
    id: 'TNT-015',
    name: 'Boutique Hotel Nashville',
    subdomain: 'boutiquenashville',
    plan: 'Enterprise',
    trialStart: '2026-08-14',
    trialEnd: '2026-08-28',
    daysRemaining: 11,
    status: 'active_trial',
    progress: {
      signup: { completed: true, completedAt: '2026-08-14 09:00:00', duration: 100 },
      property_setup: { completed: false, startedAt: '2026-08-14 09:10:00', progress: 70 },
      room_config: { completed: false },
      integrations: { completed: false },
      team_invite: { completed: false },
      first_reservation: { completed: false },
      first_checkin: { completed: false },
      billing_setup: { completed: false },
      converted: { completed: false },
    },
    lastActivity: '2026-08-16 10:30:00',
    sessions: 3,
    totalTimeOnPlatform: 950,
    dropOffStage: 'property_setup',
    dropOffReason: 'interruption',
    assignedCSM: 'Sarah Johnson',
    interventions: [],
    revenueAtRisk: 999,
    healthScore: 40,
  },
  {
    id: 'TNT-016',
    name: 'Ski Resort Vail',
    subdomain: 'skivail',
    plan: 'Professional',
    trialStart: '2026-08-01',
    trialEnd: '2026-08-15',
    daysRemaining: -2,
    status: 'converted',
    progress: {
      signup: { completed: true, completedAt: '2026-08-01 08:00:00', duration: 105 },
      property_setup: { completed: true, completedAt: '2026-08-01 08:12:00', duration: 320 },
      room_config: { completed: true, completedAt: '2026-08-01 08:30:00', duration: 510 },
      integrations: { completed: true, completedAt: '2026-08-01 08:50:00', duration: 400 },
      team_invite: { completed: true, completedAt: '2026-08-02 09:00:00', duration: 140 },
      first_reservation: { completed: true, completedAt: '2026-08-02 10:15:00', duration: 190 },
      first_checkin: { completed: true, completedAt: '2026-08-03 14:00:00', duration: 160 },
      billing_setup: { completed: true, completedAt: '2026-08-05 11:00:00', duration: 280 },
      converted: { completed: true, completedAt: '2026-08-05 11:30:00', duration: 0 },
    },
    lastActivity: '2026-08-16 09:00:00',
    sessions: 18,
    totalTimeOnPlatform: 6800,
    dropOffStage: null,
    assignedCSM: 'David Park',
    interventions: [
      { id: 'INT-007', type: 'email', sentAt: '2026-08-04 10:00:00', status: 'clicked', subject: 'Ready to go live?' },
    ],
    revenueAtRisk: 0,
    healthScore: 100,
    conversionTime: '4 days 3h 30m',
  },
  {
    id: 'TNT-017',
    name: 'Garden Inn Savannah',
    subdomain: 'gardensavannah',
    plan: 'Starter',
    trialStart: '2026-08-06',
    trialEnd: '2026-08-20',
    daysRemaining: 3,
    status: 'active_trial',
    progress: {
      signup: { completed: true, completedAt: '2026-08-06 13:00:00', duration: 88 },
      property_setup: { completed: true, completedAt: '2026-08-06 13:10:00', duration: 295 },
      room_config: { completed: true, completedAt: '2026-08-06 13:28:00', duration: 505 },
      integrations: { completed: false, startedAt: '2026-08-06 13:35:00', progress: 50 },
      team_invite: { completed: false },
      first_reservation: { completed: false },
      first_checkin: { completed: false },
      billing_setup: { completed: false },
      converted: { completed: false },
    },
    lastActivity: '2026-08-12 14:00:00',
    sessions: 5,
    totalTimeOnPlatform: 2100,
    dropOffStage: 'integrations',
    dropOffReason: 'technical_issue',
    assignedCSM: 'Mike Chen',
    interventions: [
      { id: 'INT-008', type: 'email', sentAt: '2026-08-08 09:00:00', status: 'opened', subject: 'Trouble with integrations? We can help' },
      { id: 'INT-009', type: 'call', scheduledAt: '2026-08-10 15:00:00', status: 'completed', notes: 'Walked through Stripe connect' },
    ],
    revenueAtRisk: 199,
    healthScore: 55,
  },
  {
    id: 'TNT-018',
    name: 'Metro Hotel Seattle',
    subdomain: 'metroseattle',
    plan: 'Professional',
    trialStart: '2026-08-03',
    trialEnd: '2026-08-17',
    daysRemaining: 1,
    status: 'at_risk',
    progress: {
      signup: { completed: true, completedAt: '2026-08-03 10:00:00', duration: 92 },
      property_setup: { completed: true, completedAt: '2026-08-03 10:12:00', duration: 315 },
      room_config: { completed: true, completedAt: '2026-08-03 10:30:00', duration: 480 },
      integrations: { completed: true, completedAt: '2026-08-03 10:50:00', duration: 390 },
      team_invite: { completed: false },
      first_reservation: { completed: false },
      first_checkin: { completed: false },
      billing_setup: { completed: false },
      converted: { completed: false },
    },
    lastActivity: '2026-08-10 11:00:00',
    sessions: 6,
    totalTimeOnPlatform: 2800,
    dropOffStage: 'first_reservation',
    dropOffReason: 'no_need',
    assignedCSM: 'Sarah Johnson',
    interventions: [
      { id: 'INT-010', type: 'email', sentAt: '2026-08-08 10:00:00', status: 'unopened', subject: 'Import your existing reservations' },
      { id: 'INT-011', type: 'in_app', sentAt: '2026-08-10 09:00:00', status: 'dismissed', subject: 'Create your first reservation' },
    ],
    revenueAtRisk: 499,
    healthScore: 50,
  },
  {
    id: 'TNT-019',
    name: 'Palm Springs Resort',
    subdomain: 'palmsprings',
    plan: 'Enterprise',
    trialStart: '2026-08-15',
    trialEnd: '2026-08-29',
    daysRemaining: 12,
    status: 'active_trial',
    progress: {
      signup: { completed: true, completedAt: '2026-08-15 08:00:00', duration: 115 },
      property_setup: { completed: true, completedAt: '2026-08-15 08:15:00', duration: 350 },
      room_config: { completed: true, completedAt: '2026-08-15 08:35:00', duration: 520 },
      integrations: { completed: true, completedAt: '2026-08-15 08:55:00', duration: 420 },
      team_invite: { completed: true, completedAt: '2026-08-15 09:15:00', duration: 155 },
      first_reservation: { completed: true, completedAt: '2026-08-15 10:00:00', duration: 210 },
      first_checkin: { completed: false },
      billing_setup: { completed: false },
      converted: { completed: false },
    },
    lastActivity: '2026-08-16 18:00:00',
    sessions: 4,
    totalTimeOnPlatform: 3100,
    dropOffStage: null,
    assignedCSM: 'David Park',
    interventions: [],
    revenueAtRisk: 999,
    healthScore: 85,
  },
];

/* ─── Funnel Aggregate Metrics ─── */
export const funnelMetrics = {
  totalTrials: 142,
  activeTrials: 38,
  converted: 89,
  churned: 15,
  conversionRate: 62.7,
  avgTimeToConvert: '5d 8h 15m',
  avgTrialLength: 14,
  revenueConverted: 84720,
  revenueAtRisk: 18450,
  interventionSuccessRate: 68.4,
};

/* ─── Stage-level Drop-off Data ─── */
export const stageDropOffs = [
  { stage: 'signup', entered: 142, completed: 142, dropOff: 0, dropOffRate: 0.0, topReason: null },
  { stage: 'property_setup', entered: 142, completed: 138, dropOff: 4, dropOffRate: 2.8, topReason: 'interruption' },
  { stage: 'room_config', entered: 138, completed: 124, dropOff: 14, dropOffRate: 10.1, topReason: 'complexity' },
  { stage: 'integrations', entered: 124, completed: 98, dropOff: 26, dropOffRate: 21.0, topReason: 'technical_issue' },
  { stage: 'team_invite', entered: 98, completed: 72, dropOff: 26, dropOffRate: 26.5, topReason: 'solo_operator' },
  { stage: 'first_reservation', entered: 72, completed: 65, dropOff: 7, dropOffRate: 9.7, topReason: 'no_need' },
  { stage: 'first_checkin', entered: 65, completed: 58, dropOff: 7, dropOffRate: 10.8, topReason: 'no_guests' },
  { stage: 'billing_setup', entered: 58, completed: 52, dropOff: 6, dropOffRate: 10.3, topReason: 'price_sensitivity' },
  { stage: 'converted', entered: 52, completed: 89, dropOff: 0, dropOffRate: 0.0, topReason: null },
];

/* ─── Drop-off Reasons Metadata ─── */
export const dropOffReasons = {
  complexity: { label: 'Too Complex', description: 'User found the step confusing or overwhelming', color: 'text-warning', bg: 'bg-warning/10' },
  technical_issue: { label: 'Technical Issue', description: 'Integration or setup error occurred', color: 'text-danger', bg: 'bg-danger/10' },
  time_constraints: { label: 'No Time', description: 'User indicated they would return later', color: 'text-info', bg: 'bg-info/10' },
  interruption: { label: 'Interrupted', description: 'Session ended unexpectedly', color: 'text-text-muted', bg: 'bg-neutral/10' },
  no_need: { label: 'No Immediate Need', description: 'User does not need this feature now', color: 'text-text-muted', bg: 'bg-neutral/10' },
  solo_operator: { label: 'Solo Operator', description: 'No team to invite', color: 'text-info', bg: 'bg-info/10' },
  no_guests: { label: 'No Guests Yet', description: 'Property not yet open or no bookings', color: 'text-info', bg: 'bg-info/10' },
  price_sensitivity: { label: 'Price Concern', description: 'User hesitated at pricing', color: 'text-warning', bg: 'bg-warning/10' },
  confusion: { label: 'Confused', description: 'Unclear what to do next', color: 'text-warning', bg: 'bg-warning/10' },
};

/* ─── Intervention Types ─── */
export const interventionTypes = [
  { id: 'email', label: 'Email', icon: 'Mail', color: 'text-secondary', bg: 'bg-secondary/10' },
  { id: 'call', label: 'Phone Call', icon: 'Phone', color: 'text-accent', bg: 'bg-accent/10' },
  { id: 'in_app', label: 'In-App Guide', icon: 'Monitor', color: 'text-info', bg: 'bg-info/10' },
  { id: 'demo', label: 'Live Demo', icon: 'Video', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'discount', label: 'Discount Offer', icon: 'Tag', color: 'text-warning', bg: 'bg-warning/10' },
  { id: 'extend_trial', label: 'Extend Trial', icon: 'Clock', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

/* ─── CSM Team ─── */
export const csmTeam = [
  { id: 'sarah', name: 'Sarah Johnson', activeCases: 4, conversionRate: 71.2 },
  { id: 'david', name: 'David Park', activeCases: 3, conversionRate: 65.8 },
  { id: 'mike', name: 'Mike Chen', activeCases: 2, conversionRate: 58.3 },
];

/* ─── Time-series: Daily conversions (last 30 days) ─── */
export const dailyConversions = [
  { date: '2026-07-18', trials: 3, conversions: 2, dropOffs: 1 },
  { date: '2026-07-19', trials: 2, conversions: 1, dropOffs: 1 },
  { date: '2026-07-20', trials: 5, conversions: 3, dropOffs: 2 },
  { date: '2026-07-21', trials: 4, conversions: 2, dropOffs: 2 },
  { date: '2026-07-22', trials: 3, conversions: 2, dropOffs: 1 },
  { date: '2026-07-23', trials: 6, conversions: 4, dropOffs: 2 },
  { date: '2026-07-24', trials: 2, conversions: 1, dropOffs: 1 },
  { date: '2026-07-25', trials: 1, conversions: 1, dropOffs: 0 },
  { date: '2026-07-26', trials: 4, conversions: 3, dropOffs: 1 },
  { date: '2026-07-27', trials: 5, conversions: 3, dropOffs: 2 },
  { date: '2026-07-28', trials: 3, conversions: 2, dropOffs: 1 },
  { date: '2026-07-29', trials: 4, conversions: 2, dropOffs: 2 },
  { date: '2026-07-30', trials: 6, conversions: 4, dropOffs: 2 },
  { date: '2026-07-31', trials: 2, conversions: 1, dropOffs: 1 },
  { date: '2026-08-01', trials: 5, conversions: 3, dropOffs: 2 },
  { date: '2026-08-02', trials: 4, conversions: 3, dropOffs: 1 },
  { date: '2026-08-03', trials: 3, conversions: 2, dropOffs: 1 },
  { date: '2026-08-04', trials: 2, conversions: 1, dropOffs: 1 },
  { date: '2026-08-05', trials: 4, conversions: 3, dropOffs: 1 },
  { date: '2026-08-06', trials: 5, conversions: 3, dropOffs: 2 },
  { date: '2026-08-07', trials: 3, conversions: 2, dropOffs: 1 },
  { date: '2026-08-08', trials: 4, conversions: 2, dropOffs: 2 },
  { date: '2026-08-09', trials: 2, conversions: 1, dropOffs: 1 },
  { date: '2026-08-10', trials: 5, conversions: 3, dropOffs: 2 },
  { date: '2026-08-11', trials: 3, conversions: 2, dropOffs: 1 },
  { date: '2026-08-12', trials: 4, conversions: 3, dropOffs: 1 },
  { date: '2026-08-13', trials: 2, conversions: 1, dropOffs: 1 },
  { date: '2026-08-14', trials: 3, conversions: 2, dropOffs: 1 },
  { date: '2026-08-15', trials: 4, conversions: 2, dropOffs: 2 },
  { date: '2026-08-16', trials: 2, conversions: 1, dropOffs: 1 },
];

/* ─── Helpers ─── */
export function getStageProgress(tenant, stageId) {
  const stage = tenant.progress[stageId];
  if (!stage) return { status: 'not_started', pct: 0 };
  if (stage.completed) return { status: 'completed', pct: 100 };
  if (stage.startedAt) return { status: 'in_progress', pct: stage.progress || 0 };
  return { status: 'not_started', pct: 0 };
}

export function getOverallProgress(tenant) {
  const stages = funnelStages.filter(s => !s.optional);
  const completed = stages.filter(s => tenant.progress[s.id]?.completed).length;
  return Math.round((completed / stages.length) * 100);
}

export function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function getHealthScoreColor(score) {
  if (score >= 80) return 'text-accent';
  if (score >= 50) return 'text-warning';
  return 'text-danger';
}

export function getHealthScoreBg(score) {
  if (score >= 80) return 'bg-accent/10';
  if (score >= 50) return 'bg-warning/10';
  return 'bg-danger/10';
}

export function getStatusMeta(status) {
  const configs = {
    active_trial: { label: 'Active Trial', dot: 'bg-info', class: 'bg-info/10 text-info border-info/20' },
    at_risk: { label: 'At Risk', dot: 'bg-warning', class: 'bg-warning/10 text-warning border-warning/20' },
    trial_expired: { label: 'Trial Expired', dot: 'bg-danger', class: 'bg-danger/10 text-danger border-danger/20' },
    converted: { label: 'Converted', dot: 'bg-accent', class: 'bg-accent/10 text-accent border-accent/20' },
    churned: { label: 'Churned', dot: 'bg-text-muted', class: 'bg-neutral/10 text-text-muted border-border' },
  };
  return configs[status] || configs.active_trial;
}

export function getInterventionStatusMeta(status) {
  const configs = {
    scheduled: { label: 'Scheduled', dot: 'bg-info', class: 'bg-info/10 text-info border-info/20' },
    sent: { label: 'Sent', dot: 'bg-secondary', class: 'bg-secondary/10 text-secondary border-secondary/20' },
    opened: { label: 'Opened', dot: 'bg-warning', class: 'bg-warning/10 text-warning border-warning/20' },
    clicked: { label: 'Clicked', dot: 'bg-accent', class: 'bg-accent/10 text-accent border-accent/20' },
    completed: { label: 'Completed', dot: 'bg-accent', class: 'bg-accent/10 text-accent border-accent/20' },
    no_answer: { label: 'No Answer', dot: 'bg-danger', class: 'bg-danger/10 text-danger border-danger/20' },
    unopened: { label: 'Unopened', dot: 'bg-text-muted', class: 'bg-neutral/10 text-text-muted border-border' },
    dismissed: { label: 'Dismissed', dot: 'bg-danger', class: 'bg-danger/10 text-danger border-danger/20' },
  };
  return configs[status] || configs.sent;
}