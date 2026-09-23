import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

export function RoleCard({ role, onEdit }: { role: any; onEdit: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{role.name}</CardTitle>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{role.description}</p>
        <div className="mt-4">
          <Badge variant={role.isLocked ? 'secondary' : 'default'}>
            {role.isLocked ? 'System Role' : 'Custom Role'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function PermissionMatrixRow({ permission, roles, onToggle }: any) {
  return (
    <tr>
      <td className="px-4 py-2 font-medium">{permission.label}</td>
      {roles.map((role: any) => (
        <td key={role.id} className="px-4 py-2 text-center">
          <input
            type="checkbox"
            checked={role.permissions?.includes(permission.id)}
            onChange={() => onToggle(role.id, permission.id)}
          />
        </td>
      ))}
    </tr>
  );
}

export function ApiKeyRow({ apiKey, onRevoke }: any) {
  return (
    <tr>
      <td className="px-4 py-2 font-mono text-sm">{apiKey.prefix}...</td>
      <td className="px-4 py-2">{apiKey.name}</td>
      <td className="px-4 py-2">
        <Badge variant={apiKey.status === 'active' ? 'default' : 'danger'}>{apiKey.status}</Badge>
      </td>
      <td className="px-4 py-2">
        {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : 'Never'}
      </td>
      <td className="px-4 py-2">
        <Button variant="danger" size="sm" onClick={() => onRevoke(apiKey.id)}>
          Revoke
        </Button>
      </td>
    </tr>
  );
}

export function SSOCard({ provider }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{provider.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{provider.description}</p>
        <Button className="mt-4" variant={provider.enabled ? 'outline' : 'primary'}>
          {provider.enabled ? 'Configure' : 'Enable'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function RbacStatCard({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className="flex items-center p-6">
        <div className="rounded-full bg-primary/10 p-3 mr-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserAssignmentRow({ assignment, onRemove }: any) {
  return (
    <tr>
      <td className="px-4 py-2">{assignment.userName}</td>
      <td className="px-4 py-2">{assignment.roleName}</td>
      <td className="px-4 py-2">{assignment.propertyName || 'All Properties'}</td>
      <td className="px-4 py-2">
        <Button variant="ghost" size="sm" onClick={() => onRemove(assignment.id)}>
          Remove
        </Button>
      </td>
    </tr>
  );
}
