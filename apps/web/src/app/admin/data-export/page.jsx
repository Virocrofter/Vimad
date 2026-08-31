// src/app/admin/data-export/page.jsx
'use client';

import { useState } from 'react';
import {
  Download,
  Trash2,
  FileText,
  Shield,
  Activity,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  MoreHorizontal,
  Package,
  BarChart3,
  History,
} from 'lucide-react';

// ─── Tab Components ─────────────────────────────────────────────────

function DataExportRequestsTab() {
  const [filter, setFilter] = useState('all');

  const requests = [
    {
      id: 12847,
      user: 'john.doe@example.com',
      initials: 'JD',
      type: 'Full Data Export',
      status: 'processing',
      requested: '2026-08-15',
      deadline: '2026-09-14',
      format: 'JSON',
      color: 'blue',
    },
    {
      id: 12848,
      user: 'alice.smith@example.com',
      initials: 'AS',
      type: 'Activity Log Only',
      status: 'completed',
      requested: '2026-08-14',
      deadline: '2026-09-13',
      format: 'CSV',
      color: 'green',
    },
    {
      id: 12849,
      user: 'mike.k@example.com',
      initials: 'MK',
      type: 'Full Data Export',
      status: 'failed',
      requested: '2026-08-10',
      deadline: '2026-09-09',
      format: 'JSON',
      color: 'red',
    },
    {
      id: 12850,
      user: 'lisa.w@example.com',
      initials: 'LW',
      type: 'Selective Export',
      status: 'pending',
      requested: '2026-08-17',
      deadline: '2026-09-16',
      format: 'PDF',
      color: 'purple',
    },
  ];

  const statusBadge = (status) => {
    const styles = {
      pending: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or user ID..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-72 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500">
            <option value="all">All Types</option>
            <option value="full">Full Export</option>
            <option value="selective">Selective Export</option>
            <option value="activity">Activity Log</option>
          </select>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Download className="h-4 w-4" />
          New Export
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Request Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Requested
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Deadline
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Format
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div
                      className={`h-9 w-9 rounded-full bg-${req.color}-100 flex items-center justify-center text-${req.color}-600 font-bold text-sm`}
                    >
                      {req.initials}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{req.user}</div>
                      <div className="text-sm text-gray-500">User ID: #{req.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{req.type}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusBadge(req.status)}`}
                  >
                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{req.requested}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={
                      req.status === 'failed' ? 'text-red-600 font-medium' : 'text-gray-500'
                    }
                  >
                    {req.deadline} {req.status === 'failed' && '(Overdue)'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{req.format}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-3">
                    <button className="text-blue-600 hover:text-blue-900 font-medium">View</button>
                    {req.status === 'completed' && (
                      <button className="text-green-600 hover:text-green-900 font-medium">
                        Download
                      </button>
                    )}
                    {req.status === 'failed' && (
                      <button className="text-orange-600 hover:text-orange-900 font-medium">
                        Retry
                      </button>
                    )}
                    {req.status === 'pending' && (
                      <button className="text-blue-600 hover:text-blue-900 font-medium">
                        Process
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">Showing 1-4 of 156 requests</div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm">1</button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            2
          </button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            3
          </button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function RightToErasureTab() {
  const [deletionRequests] = useState([
    {
      id: 1,
      user: 'former.user@example.com',
      reason: 'Account closure',
      status: 'pending_verification',
      submitted: '2026-08-16',
      dataScope: 'All personal data',
    },
    {
      id: 2,
      user: 'privacy.conscious@example.com',
      reason: 'Right to be forgotten',
      status: 'approved',
      submitted: '2026-08-14',
      dataScope: 'All personal data + logs',
    },
    {
      id: 3,
      user: 'old.account@example.com',
      reason: 'Inactive account purge',
      status: 'completed',
      submitted: '2026-08-01',
      dataScope: 'All data including backups',
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-yellow-800">Critical: Irreversible Action</h4>
          <p className="text-sm text-yellow-700 mt-1">
            Deletion requests permanently remove user data. Ensure proper identity verification and
            legal review before proceeding.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deletionRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{req.user}</div>
                      <div className="text-xs text-gray-500">{req.dataScope}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.reason}</td>
                    <td className="px-6 py-4">
                      {req.status === 'pending_verification' && (
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending Verification
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Approved
                        </span>
                      )}
                      {req.status === 'completed' && (
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                          Review
                        </button>
                        {req.status === 'approved' && (
                          <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                            Execute
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Deletion Checklist</h4>
            <div className="space-y-2">
              {[
                'Identity verified',
                'Legal hold check passed',
                '30-day cooling period elapsed',
                'Third-party notifications sent',
                'Backup purge scheduled',
                'Audit log entry created',
              ].map((item, i) => (
                <label
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                >
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataPortabilityTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">JSON Export</h3>
          <p className="text-sm text-gray-500 mt-1">Machine-readable structured format</p>
          <button className="mt-4 text-blue-600 text-sm font-medium hover:underline">
            Configure →
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">CSV Export</h3>
          <p className="text-sm text-gray-500 mt-1">Spreadsheet-compatible format</p>
          <button className="mt-4 text-green-600 text-sm font-medium hover:underline">
            Configure →
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">PDF Report</h3>
          <p className="text-sm text-gray-500 mt-1">Human-readable formatted report</p>
          <button className="mt-4 text-purple-600 text-sm font-medium hover:underline">
            Configure →
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Data Categories for Portability
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              name: 'Profile Information',
              included: true,
              description: 'Name, email, phone, address',
            },
            {
              name: 'Account Activity',
              included: true,
              description: 'Login history, sessions, IPs',
            },
            { name: 'User Content', included: true, description: 'Posts, comments, uploads' },
            {
              name: 'Preferences',
              included: true,
              description: 'Settings, notifications, privacy',
            },
            {
              name: 'Transaction History',
              included: false,
              description: 'Payments, invoices, subscriptions',
            },
            {
              name: 'Analytics Data',
              included: false,
              description: 'Usage metrics, aggregated data',
            },
          ].map((cat) => (
            <div
              key={cat.name}
              className="flex items-start justify-between p-3 border border-gray-100 rounded-lg"
            >
              <div>
                <div className="font-medium text-gray-900">{cat.name}</div>
                <div className="text-sm text-gray-500">{cat.description}</div>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${cat.included ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
              >
                {cat.included ? 'Included' : 'Excluded'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RectificationLogsTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Track all data corrections and updates made by users or administrators.
        </p>
        <button className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
          Export Log
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Field Changed
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Old Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                New Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Changed By
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">john.doe@example.com</td>
              <td className="px-6 py-4 text-sm text-gray-600">Email Address</td>
              <td className="px-6 py-4 text-sm text-red-600 line-through">john.old@example.com</td>
              <td className="px-6 py-4 text-sm text-green-600">john.doe@example.com</td>
              <td className="px-6 py-4 text-sm text-gray-500">User (Self)</td>
              <td className="px-6 py-4 text-sm text-gray-500">2026-08-16 14:32</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                alice.smith@example.com
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">Phone Number</td>
              <td className="px-6 py-4 text-sm text-red-600 line-through">+1-555-0100</td>
              <td className="px-6 py-4 text-sm text-green-600">+1-555-0199</td>
              <td className="px-6 py-4 text-sm text-gray-500">Admin (Support)</td>
              <td className="px-6 py-4 text-sm text-gray-500">2026-08-15 09:15</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConsentManagementTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">12,847</div>
          <div className="text-sm text-blue-700">Active Consents</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-900">342</div>
          <div className="text-sm text-yellow-700">Withdrawn Consents</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">98.2%</div>
          <div className="text-sm text-green-700">Consent Rate</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Consent Types</h3>
        <div className="space-y-4">
          {[
            { type: 'Marketing Emails', granted: 11420, withdrawn: 1427, required: false },
            { type: 'Analytics Cookies', granted: 12450, withdrawn: 397, required: false },
            { type: 'Third-Party Sharing', granted: 8932, withdrawn: 3915, required: false },
            { type: 'Terms of Service', granted: 12847, withdrawn: 0, required: true },
            { type: 'Privacy Policy', granted: 12847, withdrawn: 0, required: true },
          ].map((consent) => (
            <div
              key={consent.type}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{consent.type}</span>
                  {consent.required && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      Required
                    </span>
                  )}
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(consent.granted / (consent.granted + consent.withdrawn)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="ml-6 text-right">
                <div className="text-sm font-medium text-gray-900">
                  {consent.granted.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">granted</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuditTrailTab() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input type="date" className="border border-gray-300 rounded-lg px-4 py-2" />
        <input type="date" className="border border-gray-300 rounded-lg px-4 py-2" />
        <select className="border border-gray-300 rounded-lg px-4 py-2">
          <option>All Actions</option>
          <option>Data Export</option>
          <option>Data Deletion</option>
          <option>Consent Change</option>
          <option>Admin Action</option>
        </select>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Filter
        </button>
      </div>

      <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
        {[
          {
            time: '2026-08-17 01:43',
            action: 'Data export initiated',
            user: 'admin@system.com',
            target: 'john.doe@example.com',
            type: 'export',
          },
          {
            time: '2026-08-16 22:15',
            action: 'Consent withdrawn',
            user: 'alice.smith@example.com',
            target: 'Marketing Emails',
            type: 'consent',
          },
          {
            time: '2026-08-16 14:32',
            action: 'Profile data rectified',
            user: 'john.doe@example.com',
            target: 'Email Address',
            type: 'rectification',
          },
          {
            time: '2026-08-15 09:15',
            action: 'Deletion request approved',
            user: 'admin@system.com',
            target: 'former.user@example.com',
            type: 'deletion',
          },
        ].map((event, i) => (
          <div key={i} className="relative pl-8">
            <div
              className={`absolute -left-2 top-1 h-4 w-4 rounded-full border-2 border-white ${
                event.type === 'export'
                  ? 'bg-blue-500'
                  : event.type === 'deletion'
                    ? 'bg-red-500'
                    : event.type === 'consent'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
              }`}
            />
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{event.action}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    by <span className="font-medium">{event.user}</span> on{' '}
                    <span className="font-medium">{event.target}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">{event.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────

export default function DataExportPage() {
  const [activeTab, setActiveTab] = useState('export');

  const tabs = [
    { id: 'export', label: 'Data Export Requests', icon: Download },
    { id: 'erasure', label: 'Right to Erasure', icon: Trash2 },
    { id: 'portability', label: 'Data Portability', icon: FileText },
    { id: 'rectification', label: 'Rectification Logs', icon: Shield },
    { id: 'consent', label: 'Consent Management', icon: CheckCircle },
    { id: 'audit', label: 'Audit Trail', icon: Activity },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'export':
        return <DataExportRequestsTab />;
      case 'erasure':
        return <RightToErasureTab />;
      case 'portability':
        return <DataPortabilityTab />;
      case 'rectification':
        return <RectificationLogsTab />;
      case 'consent':
        return <ConsentManagementTab />;
      case 'audit':
        return <AuditTrailTab />;
      default:
        return <DataExportRequestsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GDPR Data Export & Compliance</h1>
          <p className="text-gray-500 mt-2">
            Manage data subject rights, exports, and privacy operations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
            <div className="text-sm text-gray-500 font-medium">Pending Requests</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">12</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
            <div className="text-sm text-gray-500 font-medium">Completed Today</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">8</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-500 font-medium">Avg Response Time</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">4.2 days</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500">
            <div className="text-sm text-gray-500 font-medium">Overdue</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">2</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-6 text-sm font-medium border-b-2 whitespace-nowrap
                      ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">{renderTab()}</div>
        </div>

        {/* Quick Actions Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Operations</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-sm">Export All Pending</div>
                  <div className="text-xs text-gray-500">Process 12 pending requests</div>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors">
                <Trash2 className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-sm">Purge Old Exports</div>
                  <div className="text-xs text-gray-500">Delete exports older than 30 days</div>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-sm">Generate Report</div>
                  <div className="text-xs text-gray-500">Monthly compliance summary</div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h3>
            <div className="space-y-4">
              {[
                { label: 'Response Time < 30 days', value: 94, color: 'bg-green-500' },
                { label: 'Successful Exports', value: 87, color: 'bg-blue-500' },
                { label: 'User Verification', value: 100, color: 'bg-green-500' },
                { label: 'Audit Logging', value: 100, color: 'bg-green-500' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{stat.label}</span>
                    <span className="font-medium text-gray-900">{stat.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${stat.color} h-2 rounded-full transition-all`}
                      style={{ width: `${stat.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[
                { text: 'Export completed for #12848', time: '2 hours ago', color: 'bg-green-500' },
                {
                  text: 'Processing started for #12847',
                  time: '5 hours ago',
                  color: 'bg-yellow-500',
                },
                { text: 'Export failed for #12849', time: '1 day ago', color: 'bg-red-500' },
                { text: 'New request received #12850', time: '1 day ago', color: 'bg-blue-500' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`h-2 w-2 rounded-full ${activity.color} mt-2`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{activity.text}</div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
