import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getBusinessChartData, getChartPeriodDescription } from "@/lib/businessChart";
import { fmtMoney } from "@/utils/format";

const chartConfig = {
  dispatched: { label: "Total dispatched", color: "var(--chart-1)" },
  received: { label: "Received payment", color: "var(--chart-2)" },
};

function formatAxisValue(value) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
  return `₹${value}`;
}

function BusinessLineChart({ data, period }) {
  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <LineChart data={data} accessibilityLayer margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={period === "weekly" ? 24 : 16}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={formatAxisValue}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => fmtMoney(Number(value))}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="dispatched"
          stroke="var(--color-dispatched)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="received"
          stroke="var(--color-received)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

export default function DashboardBusinessChart({ orders, payments }) {
  const [period, setPeriod] = useState("monthly");

  const weeklyData = useMemo(
    () => getBusinessChartData(orders, payments, "weekly"),
    [orders, payments]
  );
  const monthlyData = useMemo(
    () => getBusinessChartData(orders, payments, "monthly"),
    [orders, payments]
  );
  const yearlyData = useMemo(
    () => getBusinessChartData(orders, payments, "yearly"),
    [orders, payments]
  );

  return (
    <Card className="dashboard-business-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Business overview</CardTitle>
        <CardDescription>
          Total dispatched vs received payment across all franchises
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="mb-4">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="mt-0">
            <p className="mb-3 text-xs text-muted-foreground">{getChartPeriodDescription("weekly")}</p>
            <BusinessLineChart data={weeklyData} period="weekly" />
          </TabsContent>
          <TabsContent value="monthly" className="mt-0">
            <p className="mb-3 text-xs text-muted-foreground">{getChartPeriodDescription("monthly")}</p>
            <BusinessLineChart data={monthlyData} period="monthly" />
          </TabsContent>
          <TabsContent value="yearly" className="mt-0">
            <p className="mb-3 text-xs text-muted-foreground">{getChartPeriodDescription("yearly")}</p>
            <BusinessLineChart data={yearlyData} period="yearly" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
