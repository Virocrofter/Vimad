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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Trash2,
  Edit,
  Eye,
  Mail,
  Phone,
  Calendar,
  Activity,
  Lock,
  Unlock,
  Users,
  UserCheck,
  Building2,
} from 'lucide-react';

// ─── Constants ───

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const roleConfig = {
  owner: {
    label: 'Owner',
    icon: ShieldAlert,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950',
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950',
  },
  manager: {
    label: 'Manager',
    icon: Shield,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  staff: {
    label: 'Staff',
    icon: Shield,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950',
  },
  housekeeper: {
    label: 'Housekeeper',
    icon: Shield,
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950',
  },
};

const statusConfig = {
  active: {
    label: 'Active',
    variant: 'success',
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950',
  },
  inactive: {
    label: 'Inactive',
    variant: 'secondary',
    color: 'text-gray-600',
    bg: 'bg-gray-50 dark:bg-gray-950',
  },
  suspended: {
    label: 'Suspended',
    variant: 'destructive',
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950',
  },
  pending: {
    label: 'Pending',
    variant: 'outline',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-950',
  },
};

const departmentConfig = {
  front_desk: { label: 'Front Desk', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
  housekeeping: {
    label: 'Housekeeping',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950',
  },
  management: { label: 'Management', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
  accounting: { label: 'Accounting', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
  sales: { label: 'Sales', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950' },
};

// ─── Mock Data (replace with API data) ───

const mockUsers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@vimad.io',
    phone: '+1 555-0100',
    role: 'owner',
    status: 'active',
    department: 'management',
    lastLogin: '2026-09-22T10:00:00Z',
    createdAt: '2026-01-15T09:00:00Z',
    properties: ['DEMO-01'],
    twoFactorEnabled: true,
    activeSessions: 2,
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@vimad.io',
    phone: '+1 555-0101',
    role: 'admin',
    status: 'active',
    department: 'management',
    lastLogin: '2026-09-22T12:30:00Z',
    createdAt: '2026-02-01T10:00:00Z',
    properties: ['DEMO-01'],
    twoFactorEnabled: true,
    activeSessions: 1,
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.c@vimad.io',
    phone: '+1 555-0102',
    role: 'manager',
    status: 'active',
    department: 'front_desk',
    lastLogin: '2026-09-22T08:00:00Z',
    createdAt: '2026-02-15T11:00:00Z',
    properties: ['DEMO-01'],
    twoFactorEnabled: false,
    activeSessions: 3,
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.d@vimad.io',
    phone: '+1 555-0103',
    role: 'staff',
    status: 'active',
    department: 'front_desk',
    lastLogin: '2026-09-21T11:00:00Z',
    createdAt: '2026-03-01T08:00:00Z',
    properties: ['DEMO-01'],
    twoFactorEnabled: false,
    activeSessions: 1,
  },
  {
    id: '5',
    firstName: 'Carlos',
    lastName: 'Rodriguez',
    email: 'carlos.r@vimad.io',
    phone: '+1 555-0104',
    role: 'housekeeper',
    status: 'active',
    department: 'housekeeping',
    lastLogin: '2026-09-22T10:30:00Z',
    createdAt: '2026-03-10T07:00:00Z',
    properties: ['DEMO-01'],
    twoFactorEnabled: false,
    activeSessions: 1,
  },
  {
    id: '6',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.a@vimad.io',
    phone: '+1 555-0105',
    role: 'staff',
    status: 'inactive',
    department: 'accounting',
    lastLogin: '2026-09-08T09:00:00Z',
    createdAt: '2026-04-01T09:00:00Z',
    properties: ['DEMO-01'],
    twoFactorEnabled: false,
    activeSessions: 0,
  },
  {
    id: '7',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.k@vimad.io',
    phone: '+1 555-0106',
    role: 'manager',
    status: 'suspended',
    department: 'sales',
    lastLogin: '2026-08-23T14:00:00Z',
    createdAt: '2026-04-15T10:00:00Z',
    properties: ['DEMO-01'],
    twoFactorEnabled: false,
    activeSessions: 0,
  },
  {
    id: '8',
    firstName: 'Anna',
    lastName: 'Wilson',
    email: 'anna.w@vimad.io',
    phone: '+1 555-0107',
    role: 'staff',
    status: 'pending',
    department: 'front_desk',
    lastLogin: null,
    createdAt: '2026-09-20T14:00:00Z',
    properties: [],
    twoFactorEnabled: false,
    activeSessions: 0,
  },
];

// ─── Helper Functions ───

function getInitials(firstName, lastName) {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
}

function getLastLoginText(lastLogin) {
  if (!lastLogin) return 'Never';
  const now = new Date();
  const diff = now.getTime() - new Date(lastLogin).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Badge Components ───

export function UserStatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.active;
  return (
    <Badge variant={config.variant} className={config.color}>
      {config.label}
    </Badge>
  );
}

export function RoleBadge({ role }) {
  const config = roleConfig[role] || roleConfig.staff;
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-1.5 ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-sm">{config.label}</span>
    </div>
  );
}

export function DepartmentBadge({ department }) {
  const config = departmentConfig[department] || {
    label: department,
    color: 'text-gray-600',
    bg: '',
  };
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

export function MfaBadge({ enabled }) {
  return enabled ? (
    <Badge variant="success" className="flex items-center gap-1">
      <Lock className="h-3 w-3" />
      Enabled
    </Badge>
  ) : (
    <Badge variant="secondary" className="flex items-center gap-1">
      <Unlock className="h-3 w-3" />
      Disabled
    </Badge>
  );
}

export function SessionBadge({ count }) {
  if (count === 0) {
    return (
      <Badge variant="secondary" className="text-gray-500">
        No sessions
      </Badge>
    );
  }
  return <Badge variant={count > 2 ? 'warning' : 'success'}>{count} active</Badge>;
}

export function UserAvatar({ user, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
  };

  const role = roleConfig[user.role] || roleConfig.staff;

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarFallback className={`${role.bg} ${sizeClasses[size]}`}>
        {getInitials(user.firstName, user.lastName)}
      </AvatarFallback>
    </Avatar>
  );
}

// ─── Stat Card Component ───

export function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
    green: 'text-green-600 bg-green-50 dark:bg-green-950',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-950',
    red: 'text-red-600 bg-red-50 dark:bg-red-950',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Stats Component ───

export function UsersStats({ users = mockUsers }) {
  const [now] = useState(() => Date.now());

  const stats = useMemo(() => {
    const dayAgo = new Date(now - DAY_IN_MS);
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const adminUsers = users.filter((u) => u.role === 'admin' || u.role === 'owner').length;
    const recentLogins = users.filter((u) => {
      if (!u.lastLogin) return false;
      const lastLogin = new Date(u.lastLogin);
      return lastLogin >= dayAgo;
    }).length;
    const twoFactorCount = users.filter((u) => u.twoFactorEnabled).length;

    return {
      total: users.length,
      active: activeUsers,
      admins: adminUsers,
      recentLogins,
      twoFactorCount,
    };
  }, [users, now]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.total,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Active Users',
      value: stats.active,
      icon: UserCheck,
      color: 'green',
    },
    {
      title: 'Admins & Owners',
      value: stats.admins,
      icon: ShieldCheck,
      color: 'purple',
    },
    {
      title: 'Recent Logins (24h)',
      value: stats.recentLogins,
      icon: Calendar,
      color: 'orange',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}

// ─── Table Component ───

export function UsersTable({ users = mockUsers, onEdit, onDelete, onView }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const roles = ['all', ...new Set(users.map((u) => u.role))];
  const statuses = ['all', ...new Set(users.map((u) => u.status))];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Team Members</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-[250px]"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : roleConfig[role]?.label || role}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : statusConfig[status]?.label || status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="sm" />
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      <DepartmentBadge department={user.department} />
                    </TableCell>
                    <TableCell>
                      <UserStatusBadge status={user.status} />
                    </TableCell>
                    <TableCell>
                      <MfaBadge enabled={user.twoFactorEnabled} />
                    </TableCell>
                    <TableCell>
                      <SessionBadge count={user.activeSessions} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onView?.(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit?.(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Detail Drawer Component ───

export function UserDetailDrawer({ user, open, onClose, onEdit }) {
  if (!user) return null;

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-background border-l shadow-lg transform transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">User Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size="lg" />
            <div>
              <h3 className="text-xl font-semibold">
                {user.firstName} {user.lastName}
              </h3>
              <RoleBadge role={user.role} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span>Last login: {getLastLoginText(user.lastLogin)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Status & Security</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm">Account Status</span>
              <UserStatusBadge status={user.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Department</span>
              <DepartmentBadge department={user.department} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Two-Factor Auth</span>
              <MfaBadge enabled={user.twoFactorEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Sessions</span>
              <SessionBadge count={user.activeSessions} />
            </div>
          </div>

          {user.properties?.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Properties</h4>
              <div className="flex flex-wrap gap-2">
                {user.properties.map((prop) => (
                  <Badge key={prop} variant="outline">
                    <Building2 className="h-3 w-3 mr-1" />
                    {prop}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1" onClick={() => onEdit?.(user)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit User
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite Modal Component ───

export function InviteUserModal({ open, onClose, onInvite }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'staff',
    department: 'front_desk',
    properties: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onInvite?.(formData);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invite Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone (optional)</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="staff">Staff</option>
                  <option value="housekeeper">Housekeeper</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="front_desk">Front Desk</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="accounting">Accounting</option>
                  <option value="sales">Sales</option>
                  <option value="management">Management</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Send Invite
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page Component ───

export function UsersPage() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const handleView = (user) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const handleEdit = (user) => {
    console.log('Edit user:', user);
  };

  const handleDelete = (user) => {
    console.log('Delete user:', user);
  };

  const handleInvite = (data) => {
    console.log('Invite user:', data);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users & Roles</h1>
          <p className="text-muted-foreground">Manage team members and their access permissions</p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      <UsersStats />
      <UsersTable onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />

      <UserDetailDrawer
        user={selectedUser}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={handleEdit}
      />

      <InviteUserModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvite={handleInvite}
      />
    </div>
  );
}

export default UsersPage;
