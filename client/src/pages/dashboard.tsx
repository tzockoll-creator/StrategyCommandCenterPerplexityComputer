import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AgentSnapshot } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Building2,
  Droplets,
  ShoppingCart,
  Cpu,
  Heart,
  Shield,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const AGENT_META: Record<string, { icon: typeof Building2; color: string; bgColor: string; description: string }> = {
  "C688A59BCCA545D995B903A472BD879F": {
    icon: Building2,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Branch profitability, deposits, NPS, and efficiency across TX locations",
  },
  "0FFCD73CFFAA499886853A4FAB8D9F73": {
    icon: Droplets,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "Well production, IRR, EUR, OPEX/BOE across Permian, Bakken, and DJ basins",
  },
  "7CC8416DFF6B43D1B20A1DA33AAF4C99": {
    icon: ShoppingCart,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: "Retail revenue trends, units sold, margins, and pricing by trend segment",
  },
  "9103B8756B6B4E639EEF1CE74DDC2E79": {
    icon: Cpu,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "E2 MCP Playground metrics and performance indicators",
  },
  "D56FB736651B4D17B086F89731775800": {
    icon: Heart,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    description: "Customer health scores, churn risk, and satisfaction metrics",
  },
  "5163EE7FFA3149DEA2B58D50448FC4D2": {
    icon: Shield,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    description: "MDR Playground performance and operational metrics",
  },
};

function extractKPIs(snapshot: AgentSnapshot) {
  const kpis: { label: string; value: string; trend?: "up" | "down" | "flat" }[] = [];

  try {
    const chartData = snapshot.chartDataJson ? JSON.parse(snapshot.chartDataJson) : null;
    if (!chartData?.charts?.[0]?.data) return kpis;

    const data = chartData.charts[0].data;
    const agentId = snapshot.agentId;

    if (agentId === "C688A59BCCA545D995B903A472BD879F") {
      // Banking: aggregate latest quarter
      const latestQ = data.reduce((acc: any, row: any) => {
        if (!acc.quarter || row["quarter (quarter)"] > acc.quarter) {
          acc.quarter = row["quarter (quarter)"];
        }
        return acc;
      }, { quarter: null }).quarter;

      const latestData = data.filter((r: any) => r["quarter (quarter)"] === latestQ);
      const totalProfit = latestData.reduce((s: number, r: any) => s + (r["total profit"] || 0), 0);
      const totalDeposits = latestData.reduce((s: number, r: any) => s + (r["total deposits"] || 0), 0);
      const avgNPS = latestData.reduce((s: number, r: any) => s + (r["avg nps"] || 0), 0) / latestData.length;
      const avgWait = latestData.reduce((s: number, r: any) => s + (r["avg wait time"] || 0), 0) / latestData.length;

      kpis.push(
        { label: "Total Profit", value: `$${(totalProfit / 1000).toFixed(0)}K`, trend: "up" },
        { label: "Total Deposits", value: `$${(totalDeposits / 1e6).toFixed(1)}M`, trend: "up" },
        { label: "Avg NPS", value: avgNPS.toFixed(0), trend: avgNPS > 40 ? "up" : "flat" },
        { label: "Avg Wait", value: `${avgWait.toFixed(1)} min`, trend: avgWait < 12 ? "up" : "down" }
      );
    } else if (agentId === "0FFCD73CFFAA499886853A4FAB8D9F73") {
      // O&G
      const avgIRR = data.reduce((s: number, r: any) => s + (r["avg irr base"] || 0), 0) / data.length;
      const avgOPEX = data.reduce((s: number, r: any) => s + (r["avg total opex per boe"] || 0), 0) / data.length;
      const avgEUR = data.reduce((s: number, r: any) => s + (r["avg eur oil mbo"] || 0), 0) / data.length;
      const avgUtil = data.reduce((s: number, r: any) => s + (r["avg facility utilization"] || 0), 0) / data.length;

      kpis.push(
        { label: "Avg IRR (Base)", value: `${(avgIRR * 100).toFixed(1)}%`, trend: avgIRR > 0.4 ? "up" : "flat" },
        { label: "Avg OPEX/BOE", value: `$${avgOPEX.toFixed(2)}`, trend: "flat" },
        { label: "Avg EUR Oil", value: `${avgEUR.toFixed(0)} MBO`, trend: "up" },
        { label: "Facility Util", value: `${(avgUtil * 100).toFixed(0)}%`, trend: avgUtil > 0.7 ? "up" : "down" }
      );
    } else if (agentId === "7CC8416DFF6B43D1B20A1DA33AAF4C99") {
      // BrightBasket
      const totalRevenue = data.reduce((s: number, r: any) => s + (r["total revenue"] || 0), 0);
      const totalUnits = data.reduce((s: number, r: any) => s + (r["total units sold"] || 0), 0);
      const avgMargin = data.reduce((s: number, r: any) => s + (r["avg margin percentage"] || 0), 0) / data.length;

      kpis.push(
        { label: "Total Revenue", value: `$${(totalRevenue / 1000).toFixed(1)}K`, trend: "up" },
        { label: "Units Sold", value: totalUnits.toLocaleString(), trend: "up" },
        { label: "Avg Margin", value: `${avgMargin.toFixed(1)}%`, trend: avgMargin > 30 ? "up" : "flat" }
      );
    }
  } catch {
    // no chart data
  }

  return kpis;
}

function KPIBadge({ trend }: { trend?: "up" | "down" | "flat" }) {
  if (!trend) return null;
  if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Activity className="w-3.5 h-3.5 text-muted-foreground" />;
}

function MiniChart({ snapshot }: { snapshot: AgentSnapshot }) {
  try {
    const chartData = snapshot.chartDataJson ? JSON.parse(snapshot.chartDataJson) : null;
    if (!chartData?.charts?.[0]?.data) return null;

    const data = chartData.charts[0].data;
    const agentId = snapshot.agentId;

    if (agentId === "C688A59BCCA545D995B903A472BD879F") {
      // Banking: profit by quarter (aggregate)
      const byQ: Record<string, number> = {};
      for (const row of data) {
        const q = row["quarter (quarter)"];
        byQ[q] = (byQ[q] || 0) + row["total profit"];
      }
      const chartRows = Object.entries(byQ).sort().map(([q, v]) => ({ name: q.replace("2024-", ""), value: Math.round(v / 1000) }));

      return (
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={chartRows}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
              formatter={(v: number) => [`$${v}K`, "Profit"]}
            />
            <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (agentId === "0FFCD73CFFAA499886853A4FAB8D9F73") {
      // O&G: IRR distribution
      const buckets = [
        { name: "<25%", count: 0 },
        { name: "25-40%", count: 0 },
        { name: "40-55%", count: 0 },
        { name: ">55%", count: 0 },
      ];
      for (const row of data) {
        const irr = row["avg irr base"] || 0;
        if (irr < 0.25) buckets[0].count++;
        else if (irr < 0.4) buckets[1].count++;
        else if (irr < 0.55) buckets[2].count++;
        else buckets[3].count++;
      }
      const COLORS = ["hsl(var(--chart-5))", "hsl(var(--chart-3))", "hsl(var(--chart-1))", "hsl(var(--chart-2))"];

      return (
        <ResponsiveContainer width="100%" height={100}>
          <PieChart>
            <Pie data={buckets} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={40} strokeWidth={0}>
              {buckets.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
              formatter={(v: number) => [`${v} wells`]}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (agentId === "7CC8416DFF6B43D1B20A1DA33AAF4C99") {
      // BrightBasket: revenue by trend
      const chartRows = data.map((r: any) => ({
        name: r["trend (trend)"],
        revenue: Math.round(r["total revenue"] / 1000),
        units: r["total units sold"],
      }));

      return (
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={chartRows}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
              formatter={(v: number) => [`$${v}K`]}
            />
            <Bar dataKey="revenue" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  } catch {
    return null;
  }

  return null;
}

function AgentCard({ snapshot }: { snapshot: AgentSnapshot }) {
  const meta = AGENT_META[snapshot.agentId] || {
    icon: BarChart3,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    description: "Performance metrics",
  };
  const Icon = meta.icon;
  const kpis = extractKPIs(snapshot);
  const fetchedDate = new Date(snapshot.fetchedAt);
  const timeAgo = getTimeAgo(fetchedDate);

  return (
    <Link href={`/agent/${snapshot.agentId}`}>
      <Card
        className="group cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-md"
        data-testid={`card-agent-${snapshot.agentId}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-lg ${meta.bgColor} shrink-0`}>
                <Icon className={`w-5 h-5 ${meta.color}`} />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold leading-tight truncate">
                  {snapshot.agentName}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{meta.description}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {kpis.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {kpis.map((kpi, i) => (
                <div key={i} className="p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold tabular-nums">{kpi.value}</span>
                    <KPIBadge trend={kpi.trend} />
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-none">{kpi.label}</span>
                </div>
              ))}
            </div>
          )}
          <MiniChart snapshot={snapshot} />
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
            <Clock className="w-3 h-3" />
            <span>Updated {timeAgo}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PendingAgentCard({ agentId, agentName }: { agentId: string; agentName: string }) {
  const meta = AGENT_META[agentId] || {
    icon: BarChart3,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    description: "Awaiting data collection",
  };
  const Icon = meta.icon;

  return (
    <Card className="opacity-60" data-testid={`card-pending-${agentId}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${meta.bgColor} shrink-0`}>
            <Icon className={`w-5 h-5 ${meta.color}`} />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold leading-tight truncate">{agentName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Badge variant="secondary" className="text-xs">
          Awaiting next refresh
        </Badge>
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ALL_AGENTS = [
  { id: "C688A59BCCA545D995B903A472BD879F", name: "Banking Branch Performance" },
  { id: "0FFCD73CFFAA499886853A4FAB8D9F73", name: "O and G Well Performance" },
  { id: "7CC8416DFF6B43D1B20A1DA33AAF4C99", name: "BrightBasket" },
  { id: "9103B8756B6B4E639EEF1CE74DDC2E79", name: "E2MCPPlayground" },
  { id: "D56FB736651B4D17B086F89731775800", name: "CustomerHealthAgent" },
  { id: "5163EE7FFA3149DEA2B58D50448FC4D2", name: "MDRPlaygroundAgent" },
];

export default function Dashboard() {
  const { data: snapshots, isLoading } = useQuery<AgentSnapshot[]>({
    queryKey: ["/api/snapshots"],
  });

  const snapshotMap = new Map<string, AgentSnapshot>();
  if (snapshots) {
    for (const s of snapshots) {
      snapshotMap.set(s.agentId, s);
    }
  }

  const activeCount = snapshotMap.size;
  const totalRevenue = snapshots?.reduce((sum, s) => {
    try {
      const cd = s.chartDataJson ? JSON.parse(s.chartDataJson) : null;
      if (!cd?.charts?.[0]?.data) return sum;
      const data = cd.charts[0].data;
      if (s.agentId === "7CC8416DFF6B43D1B20A1DA33AAF4C99") {
        return sum + data.reduce((a: number, r: any) => a + (r["total revenue"] || 0), 0);
      }
      if (s.agentId === "C688A59BCCA545D995B903A472BD879F") {
        const latestQ = data.reduce((acc: string, r: any) => r["quarter (quarter)"] > acc ? r["quarter (quarter)"] : acc, "");
        return sum + data.filter((r: any) => r["quarter (quarter)"] === latestQ).reduce((a: number, r: any) => a + (r["total profit"] || 0), 0);
      }
      return sum;
    } catch { return sum; }
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight">Strategy Command Center</h1>
                <p className="text-xs text-muted-foreground">Business performance across all agents</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{activeCount} of {ALL_AGENTS.length} active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Bar */}
      {!isLoading && snapshots && snapshots.length > 0 && (
        <div className="border-b border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex gap-6 text-xs">
              <div>
                <span className="text-muted-foreground">Active Agents</span>
                <span className="ml-2 font-semibold tabular-nums">{activeCount}/{ALL_AGENTS.length}</span>
              </div>
              {totalRevenue > 0 && (
                <div>
                  <span className="text-muted-foreground">Combined Revenue/Profit</span>
                  <span className="ml-2 font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    ${(totalRevenue / 1000).toFixed(0)}K
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Last Refresh</span>
                <span className="ml-2 font-semibold">
                  {snapshots[0] ? getTimeAgo(new Date(snapshots[0].fetchedAt)) : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                  </div>
                  <Skeleton className="h-[100px]" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_AGENTS.map((agent) => {
              const snapshot = snapshotMap.get(agent.id);
              return snapshot ? (
                <AgentCard key={agent.id} snapshot={snapshot} />
              ) : (
                <PendingAgentCard key={agent.id} agentId={agent.id} agentName={agent.name} />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
