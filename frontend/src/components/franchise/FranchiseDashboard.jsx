import { useMemo, useState } from "react";
import {
  ArrowLeft, MapPin, Pencil, Plus, Package, IndianRupee,
  AlertTriangle, CheckCircle2, Clock, Trash2,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  getFranchiseStats, getChartData, getFranchiseActivity,
} from "@/lib/franchiseDashboard";
import { fmtMoney } from "@/utils/format";
import StatusBadge from "./StatusBadge";
import FranchiseDeliveries from "./FranchiseDeliveries";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";

const chartConfig = {
  dispatched: { label: "Dispatched", color: "var(--chart-1)" },
  paid: { label: "Paid", color: "var(--chart-2)" },
};

export default function FranchiseDashboard({
  franchise,
  orders,
  payments,
  activityLog,
  isAdmin,
  onBack,
  onEdit,
  onDelete,
  onAddOrder,
  onAddPayment,
  onEditOrder,
  onDeleteOrder,
  onEditPayment,
  onDeletePayment,
  onSendReminder,
  lastReminderFor,
  reminderCountFor,
}) {
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await onDelete(franchise.id);
      setShowDelete(false);
    } catch {
      /* toast in hook */
    } finally {
      setDeleting(false);
    }
  }

  const stats = useMemo(() => getFranchiseStats(franchise, orders, payments), [franchise, orders, payments]);
  const chartData = useMemo(() => getChartData(orders, payments), [orders, payments]);
  const franchiseActivity = useMemo(
    () => getFranchiseActivity(activityLog, franchise.name),
    [activityLog, franchise.name]
  );

  const contactLine = [franchise.contact, franchise.phone, franchise.email]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={onBack}>
            <ArrowLeft /> Back to franchises
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{franchise.name}</h1>
            <StatusBadge status={franchise.status} />
          </div>
          {contactLine && (
            <p className="text-sm text-muted-foreground">{contactLine}</p>
          )}
          {franchise.address && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {franchise.address}
            </p>
          )}
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {isAdmin && (
            <Button variant="destructive" onClick={() => setShowDelete(true)}>
              <Trash2 /> Delete
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" onClick={onEdit}>
              <Pencil /> Edit
            </Button>
          )}
          <Button onClick={onAddOrder}>
            <Plus /> New delivery
          </Button>
          <Button
            variant="secondary"
            onClick={() => onAddPayment()}
            disabled={franchise.totalDue <= 0}
            title={franchise.totalDue <= 0 ? "No outstanding balance" : "Record payment against account balance"}
          >
            <IndianRupee /> Account payment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Package className="size-3.5" /> Total taken
            </CardDescription>
            <CardTitle className="font-mono text-2xl">{fmtMoney(franchise.totalTaken)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{stats.deliveryCount} deliveries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Total paid
            </CardDescription>
            <CardTitle className="font-mono text-2xl">{fmtMoney(franchise.totalPaid)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{stats.paidCount} fully paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <IndianRupee className="size-3.5" /> Outstanding
            </CardDescription>
            <CardTitle className={`font-mono text-2xl ${franchise.totalDue > 0 ? "text-amber-600" : ""}`}>
              {fmtMoney(franchise.totalDue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {franchise.status === "paid" ? "Fully paid" : franchise.status}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" /> Needs attention
            </CardDescription>
            <CardTitle className={`font-mono text-2xl ${stats.isOverdue ? "text-destructive" : ""}`}>
              {stats.isOverdue ? "Yes" : "No"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.isOverdue ? `${franchise.daysOverdue}d overdue` : "Within terms"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment health</CardTitle>
          <CardDescription>
            {stats.paidPercent}% of dispatched materials have been paid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={stats.paidPercent} className="h-2" />
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>Paid {fmtMoney(franchise.totalPaid)}</span>
            <span>Due {fmtMoney(franchise.totalDue)}</span>
          </div>
        </CardContent>
      </Card>

      <FranchiseDeliveries
        franchise={franchise}
        orders={orders}
        payments={payments}
        isAdmin={isAdmin}
        onAddOrder={onAddOrder}
        onAddPayment={onAddPayment}
        onEditOrder={onEditOrder}
        onDeleteOrder={onDeleteOrder}
        onEditPayment={onEditPayment}
        onDeletePayment={onDeletePayment}
        onSendReminder={onSendReminder}
        lastReminderFor={lastReminderFor}
        reminderCountFor={reminderCountFor}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dispatched vs paid</CardTitle>
                  <CardDescription>Last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[220px] w-full">
                    <BarChart data={chartData} accessibilityLayer>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="dispatched" fill="var(--color-dispatched)" radius={4} />
                      <Bar dataKey="paid" fill="var(--color-paid)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account status</CardTitle>
                <CardDescription>Combined franchise balance</CardDescription>
              </CardHeader>
              <CardContent>
                {!stats.isOverdue ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Account is within payment terms.
                  </p>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-900">
                      {fmtMoney(franchise.totalDue)} outstanding
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      {franchise.daysOverdue} days past due
                    </p>
                    <StatusBadge status={franchise.status} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-4" /> Recent activity
              </CardTitle>
              <CardDescription>Actions related to this franchise</CardDescription>
            </CardHeader>
            <CardContent>
              {franchiseActivity.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {franchiseActivity.map((a) => (
                    <div key={a.id} className="flex gap-3 border-b pb-3 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{a.details}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.user} · {new Date(a.timestamp).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`Delete "${franchise.name}"?`}
        description="This permanently removes the franchise and all deliveries, payments, and reminders. This cannot be undone."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
