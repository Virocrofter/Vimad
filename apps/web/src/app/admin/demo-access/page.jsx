'use client';

import { useState } from 'react';
import { useApiFetch } from '@/hooks/useApiFetch';
import { useApiMutation } from '@/hooks/useApiMutation';
import { fetchDemoRequests, updateDemoRequest, deleteDemoRequest } from '@/api/demo-access';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users, Mail, Calendar, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { color: 'secondary', icon: Clock },
  approved: { color: 'default', icon: CheckCircle2 },
  rejected: { color: 'destructive', icon: XCircle },
  expired: { color: 'outline', icon: Clock },
};

export default function DemoAccessPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    data: requests,
    loading,
    error,
    refetch,
  } = useApiFetch(() => fetchDemoRequests({ status: statusFilter }), [statusFilter]);

  const { mutate: updateRequest, loading: updating } = useApiMutation(updateDemoRequest);

  const { mutate: deleteRequest, loading: deleting } = useApiMutation(deleteDemoRequest);

  const handleStatusChange = async (id, status) => {
    try {
      await updateRequest({ id, status });
      refetch();
    } catch (err) {
      console.error('Failed to update request:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;

    try {
      await deleteRequest(selectedRequest.id);
      setDeleteDialogOpen(false);
      setSelectedRequest(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete request:', err);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r) => r.status === 'pending').length || 0,
    approved: requests?.filter((r) => r.status === 'approved').length || 0,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Demo Access Requests
          </h1>
          <p className="text-muted-foreground mt-1">Manage demo account requests and approvals</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <TableSkeleton rows={5} />
          ) : requests?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.companyName}</TableCell>
                      <TableCell>{request.contactName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {request.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(request.id, 'approved')}
                                disabled={updating}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(request.id, 'rejected')}
                                disabled={updating}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRequest(request);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No demo requests"
              description="Demo access requests will appear here."
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Demo Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the demo request from{' '}
              <strong>{selectedRequest?.companyName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
