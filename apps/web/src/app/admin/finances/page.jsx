'use client';

import { useState } from 'react';
import { useApiFetch } from '@/hooks/useApiFetch';
import { fetchFinancialSummary, fetchExpenses } from '@/api/finances';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Download } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function FinancesPage() {
  const [expenseFilters, setExpenseFilters] = useState({
    page: 1,
    pageSize: 20,
    category: '',
    status: '',
  });

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useApiFetch(fetchFinancialSummary, []);

  const {
    data: expenses,
    loading: expensesLoading,
    refetch: refetchExpenses,
  } = useApiFetch(() => fetchExpenses(expenseFilters), [expenseFilters]);

  if (summaryLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSkeleton count={5} />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState error={summaryError} onRetry={refetchSummary} />
      </div>
    );
  }

  if (!summary) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: summary.currentMonth.currency,
    }).format(amount);
  };

  const getChangeIndicator = (current, previous) => {
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    return (
      <div
        className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}
      >
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        {Math.abs(change).toFixed(1)}%
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Overview</h1>
          <p className="text-muted-foreground mt-1">
            Platform revenue, expenses, and profitability
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.currentMonth.revenue)}</div>
            <div className="flex items-center gap-2 mt-1">
              {getChangeIndicator(summary.currentMonth.revenue, summary.lastMonth.revenue)}
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.currentMonth.expenses)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getChangeIndicator(summary.currentMonth.expenses, summary.lastMonth.expenses)}
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.currentMonth.profit)}</div>
            <div className="flex items-center gap-2 mt-1">
              {getChangeIndicator(summary.currentMonth.profit, summary.lastMonth.profit)}
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.currentMonth.margin.toFixed(1)}%</div>
            <div className="flex items-center gap-2 mt-1">
              {getChangeIndicator(summary.currentMonth.margin, summary.lastMonth.margin)}
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Invoices</TabsTrigger>
        </TabsList>

        {/* Revenue Trends Chart */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Trends (Last 12 Months)</CardTitle>
              <CardDescription>Revenue, expenses, and profit over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={summary.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
                  <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Year to Date Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Year to Date Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.yearToDate.revenue)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Year to Date Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.yearToDate.expenses)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Year to Date Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.yearToDate.profit)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {summary.yearToDate.margin.toFixed(1)}% margin
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expenses Table */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>Track and manage platform expenses</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={expenseFilters.category}
                    onValueChange={(value) =>
                      setExpenseFilters((prev) => ({ ...prev, category: value, page: 1 }))
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="personnel">Personnel</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={expenseFilters.status}
                    onValueChange={(value) =>
                      setExpenseFilters((prev) => ({ ...prev, status: value, page: 1 }))
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <LoadingSkeleton count={5} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses?.data.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category}</Badge>
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.vendor || '-'}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              expense.status === 'paid'
                                ? 'default'
                                : expense.status === 'approved'
                                  ? 'secondary'
                                  : 'outline'
                            }
                          >
                            {expense.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Invoices */}
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Invoices</CardTitle>
              <CardDescription>Pending and overdue customer invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Total Pending</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary.upcoming.amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {summary.upcoming.invoices} invoices
                    </p>
                  </div>
                </div>

                {summary.upcoming.overdue > 0 && (
                  <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <p className="font-medium text-red-900">Overdue Amount</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(summary.upcoming.overdue)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
