import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Eye,
  User,
  Clock,
  Monitor,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// ─── Mock Data ───

const mockSessions = [
  {
    id: '1',
    userId: 'user-1',
    userEmail: 'admin@vimad.io',
    userName: 'Admin User',
    sessionType: 'shadow',
    status: 'active',
    startTime: '2026-09-22T10:00:00Z',
    endTime: null,
    duration: null,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    location: 'Durban, South Africa',
    deviceType: 'desktop',
    browser: 'Chrome',
    os: 'macOS',
    actionsPerformed: 45,
    riskLevel: 'low',
    flaggedActions: 0,
  },
  {
    id: '2',
    userId: 'user-2',
    userEmail: 'manager@vimad.io',
    userName: 'Manager User',
    sessionType: 'shadow',
    status: 'completed',
    startTime: '2026-09-22T08:30:00Z',
    endTime: '2026-09-22T09:15:00Z',
    duration: 45,
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    location: 'Cape Town, South Africa',
    deviceType: 'desktop',
    browser: 'Firefox',
    os: 'Windows',
    actionsPerformed: 23,
    riskLevel: 'medium',
    flaggedActions: 2,
  },
  {
    id: '3',
    userId: 'user-3',
    userEmail: 'staff@vimad.io',
    userName: 'Staff User',
    sessionType: 'shadow',
    status: 'flagged',
    startTime: '2026-09-22T07:00:00Z',
    endTime: '2026-09-22T07:45:00Z',
    duration: 45,
    ipAddress: '10.0.0.50',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
    location: 'Johannesburg, South Africa',
    deviceType: 'mobile',
    browser: 'Safari',
    os: 'iOS',
    actionsPerformed: 67,
    riskLevel: 'high',
    flaggedActions: 8,
  },
  {
    id: '4',
    userId: 'user-4',
    userEmail: 'frontdesk@vimad.io',
    userName: 'Front Desk',
    sessionType: 'shadow',
    status: 'completed',
    startTime: '2026-09-21T22:00:00Z',
    endTime: '2026-09-21T23:30:00Z',
    duration: 90,
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    location: 'Durban, South Africa',
    deviceType: 'desktop',
    browser: 'Chrome',
    os: 'Linux',
    actionsPerformed: 12,
    riskLevel: 'low',
    flaggedActions: 0,
  },
  {
    id: '5',
    userId: 'user-5',
    userEmail: 'housekeeping@vimad.io',
    userName: 'Housekeeping',
    sessionType: 'shadow',
    status: 'terminated',
    startTime: '2026-09-21T20:00:00Z',
    endTime: '2026-09-21T20:10:00Z',
    duration: 10,
    ipAddress: '203.0.113.50',
    userAgent: 'Mozilla/5.0 (Android 13; Mobile)',
    location: 'Unknown',
    deviceType: 'mobile',
    browser: 'Chrome',
    os: 'Android',
    actionsPerformed: 3,
    riskLevel: 'critical',
    flaggedActions: 5,
  },
];

// ─── Helper Functions ───

function getStatusBadgeVariant(status) {
  switch (status) {
    case 'active':
      return 'success';
    case 'completed':
      return 'secondary';
    case 'flagged':
      return 'warning';
    case 'terminated':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getRiskBadgeVariant(riskLevel) {
  switch (riskLevel) {
    case 'low':
      return 'success';
    case 'medium':
      return 'warning';
    case 'high':
      return 'destructive';
    case 'critical':
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatDuration(minutes) {
  if (!minutes) return 'N/A';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
}

// ─── Component ───

export function ShadowSessionHistory({ sessions = mockSessions }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch =
        session.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.ipAddress?.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
      const matchesRisk = riskFilter === 'all' || session.riskLevel === riskFilter;
      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [sessions, searchQuery, statusFilter, riskFilter]);

  const stats = useMemo(() => {
    return {
      total: sessions.length,
      active: sessions.filter((s) => s.status === 'active').length,
      flagged: sessions.filter((s) => s.status === 'flagged').length,
      highRisk: sessions.filter((s) => s.riskLevel === 'high' || s.riskLevel === 'critical').length,
    };
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sessions
            </CardTitle>
            <Monitor className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Now</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flagged}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highRisk}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Session History</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{session.userName}</div>
                            <div className="text-sm text-muted-foreground">{session.userEmail}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(session.status)}>
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadgeVariant(session.riskLevel)}>
                          {session.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDuration(session.duration)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          {session.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {session.actionsPerformed} actions
                          {session.flaggedActions > 0 && (
                            <span className="text-red-600 ml-1">
                              ({session.flaggedActions} flagged)
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ShadowSessionHistory;
