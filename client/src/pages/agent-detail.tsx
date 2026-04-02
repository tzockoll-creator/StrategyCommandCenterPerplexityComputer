import { useQuery } from "@tanstack/react-query";
import type { AgentSnapshot } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  Building2,
  Droplets,
  ShoppingCart,
  Cpu,
  Heart,
  Shield,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

const AGENT_META: Record<string, { icon: typeof Building2; color: string; bgColor: string; name: string }> = {
  "C688A59BCCA545D995B903A472BD879F": { icon: Building2, color: "text-blue-500", bgColor: "bg-blue-500/10", name: "Banking Branch Performance" },
  "0FFCD73CFFAA499886853A4FAB8D9F73": { icon: Droplets, color: "text-emerald-500", bgColor: "bg-emerald-500/10", name: "O&G Well Performance" },
  "7CC8416DFF6B43D1B20A1DA33AAF4C99": { icon: ShoppingCart, color: "text-amber-500", bgColor: "bg-amber-500/10", name: "BrightBasket" },
  "9103B8756B6B4E639EEF1CE74DDC2E79": { icon: Cpu, color: "text-purple-500", bgColor: "bg-purple-500/10", name: "E2MCPPlayground" },
  "D56FB736651B4D17B086F89731775800": { icon: Heart, color: "text-rose-500", bgColor: "bg-rose-500/10", name: "CustomerHealthAgent" },
  "5163EE7FFA3149DEA2B58D50448FC4D2": { icon: Shield, color: "text-cyan-500", bgColor: "bg-cyan-500/10", name: "MDRPlaygroundAgent" },
};

function BankingDetail({ data }: { data: any[] }) {
  // Aggregate by quarter
  const byQ: Record<string, { profit: number; deposits: number; nps: number; count: number }> = {};
  for (const row of data) {
    const q = row["quarter (quarter)"];
    if (!byQ[q]) byQ[q] = { profit: 0, deposits: 0, nps: 0, count: 0 };
    byQ[q].profit += row["total profit"] || 0;
    byQ[q].deposits += row["total deposits"] || 0;
    byQ[q].nps += row["avg nps"] || 0;
    byQ[q].count++;
  }

  const quarterData = Object.entries(byQ)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([q, v]) => ({
      quarter: q.replace("2024-", ""),
      profit: Math.round(v.profit / 1000),
      deposits: Math.round(v.deposits / 1e6),
      nps: Math.round(v.nps / v.count),
    }));

  // Top branches by latest quarter profit
  const latestQ = data.reduce((acc: string, r: any) => r["quarter (quarter)"] > acc ? r["quarter (quarter)"] : acc, "");
  const latestBranches = data
    .filter((r: any) => r["quarter (quarter)"] === latestQ)
    .sort((a: any, b: any) => (b["total profit"] || 0) - (a["total profit"] || 0))
    .slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quarterly Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={quarterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="quarter" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  formatter={(v: number) => [`$${v}K`]}
                />
                <Bar dataKey="profit" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Total Profit ($K)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">NPS Trend by Quarter</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={quarterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="quarter" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} domain={[30, 50]} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="nps" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--chart-2))" }} name="Avg NPS" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Top Branches by Profit ({latestQ})</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={latestBranches.map((b: any) => ({
              name: b["branch (branch name)"],
              profit: Math.round(b["total profit"]),
              nps: b["avg nps"],
            }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`]}
              />
              <Bar dataKey="profit" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function OGDetail({ data }: { data: any[] }) {
  // Group by basin
  const basins: Record<string, { wells: number; avgIRR: number; avgOPEX: number; avgEUR: number; irrSum: number; opexSum: number; eurSum: number }> = {};
  for (const row of data) {
    const name = row["well (well name)"] || "";
    const basin = name.split("_")[0] || "Other";
    if (!basins[basin]) basins[basin] = { wells: 0, avgIRR: 0, avgOPEX: 0, avgEUR: 0, irrSum: 0, opexSum: 0, eurSum: 0 };
    basins[basin].wells++;
    basins[basin].irrSum += row["avg irr base"] || 0;
    basins[basin].opexSum += row["avg total opex per boe"] || 0;
    basins[basin].eurSum += row["avg eur oil mbo"] || 0;
  }

  const basinData = Object.entries(basins).map(([basin, v]) => ({
    basin,
    wells: v.wells,
    irr: Math.round((v.irrSum / v.wells) * 100),
    opex: Math.round((v.opexSum / v.wells) * 100) / 100,
    eur: Math.round(v.eurSum / v.wells),
  }));

  // Risk matrix
  const riskData = data.map((r: any) => ({
    name: (r["well (well name)"] || "").replace(/_/g, " ").substring(0, 20),
    execRisk: r["execution risk (execution risk)"],
    geoRisk: r["geological risk (geological risk)"],
    irr: Math.round((r["avg irr base"] || 0) * 100),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IRR by Basin</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={basinData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="basin" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`]}
                />
                <Bar dataKey="irr" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Avg IRR %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OPEX/BOE by Basin</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={basinData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="basin" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  formatter={(v: number) => [`$${v}`]}
                />
                <Bar dataKey="opex" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Avg OPEX/BOE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Well Risk & Return Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" data-testid="table-well-risk">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Well</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Exec Risk</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Geo Risk</th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground">IRR</th>
                </tr>
              </thead>
              <tbody>
                {riskData.slice(0, 15).map((row, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="py-1.5 px-2 font-mono">{row.name}</td>
                    <td className="py-1.5 px-2">
                      <Badge variant={row.execRisk === "High" ? "destructive" : row.execRisk === "Medium" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                        {row.execRisk}
                      </Badge>
                    </td>
                    <td className="py-1.5 px-2">
                      <Badge variant={row.geoRisk === "High" ? "destructive" : row.geoRisk === "Medium" ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0">
                        {row.geoRisk}
                      </Badge>
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums font-medium">
                      <span className={row.irr >= 50 ? "text-emerald-500" : row.irr >= 30 ? "text-foreground" : "text-amber-500"}>
                        {row.irr}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BrightBasketDetail({ data }: { data: any[] }) {
  const chartRows = data.map((r: any) => ({
    trend: r["trend (trend)"] || "unknown",
    revenue: Math.round(r["total revenue"]),
    units: r["total units sold"],
    margin: Math.round(r["avg margin percentage"] * 10) / 10,
    price: Math.round(r["avg price"] * 100) / 100,
    cost: Math.round(r["total cost"] * 100) / 100,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue by Trend Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="trend" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Units Sold by Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="trend" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }}
                />
                <Bar dataKey="units" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Segment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" data-testid="table-brightbasket">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Trend</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Revenue</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Units</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Margin %</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Avg Price</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Cost</th>
                </tr>
              </thead>
              <tbody>
                {chartRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="py-2 px-3">
                      <Badge variant={row.trend === "up" ? "default" : row.trend === "down" ? "destructive" : "secondary"} className="text-[10px]">
                        {row.trend === "up" ? "Up" : row.trend === "down" ? "Down" : "Flat"}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums font-medium">${row.revenue.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{row.units.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{row.margin}%</td>
                    <td className="py-2 px-3 text-right tabular-nums">${row.price}</td>
                    <td className="py-2 px-3 text-right tabular-nums">${row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GenericDetail({ snapshot }: { snapshot: AgentSnapshot }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Agent Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{snapshot.summary}</p>
      </CardContent>
    </Card>
  );
}

export default function AgentDetail() {
  const params = useParams<{ agentId: string }>();
  const agentId = params.agentId || "";

  const { data: snapshots, isLoading } = useQuery<AgentSnapshot[]>({
    queryKey: ["/api/snapshots", agentId],
  });

  const latest = snapshots?.[0];
  const meta = AGENT_META[agentId] || { icon: BarChart3, color: "text-gray-500", bgColor: "bg-gray-500/10", name: "Agent" };
  const Icon = meta.icon;

  let chartData: any[] = [];
  try {
    if (latest?.chartDataJson) {
      const parsed = JSON.parse(latest.chartDataJson);
      chartData = parsed?.charts?.[0]?.data || [];
    }
  } catch {}

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="p-2 rounded-md hover:bg-muted transition-colors" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div className={`p-2 rounded-lg ${meta.bgColor}`}>
              <Icon className={`w-5 h-5 ${meta.color}`} />
            </div>
            <div>
              <h1 className="text-base font-semibold">{latest?.agentName || meta.name}</h1>
              {latest && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Updated {new Date(latest.fetchedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px]" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-[250px]" />
              <Skeleton className="h-[250px]" />
            </div>
          </div>
        ) : !latest ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No data available for this agent yet. Data will appear after the next refresh.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {latest.summary.replace(/\*\*/g, '').substring(0, 800)}
                  {latest.summary.length > 800 && "..."}
                </p>
              </CardContent>
            </Card>

            {/* Agent-specific charts */}
            {agentId === "C688A59BCCA545D995B903A472BD879F" && chartData.length > 0 && <BankingDetail data={chartData} />}
            {agentId === "0FFCD73CFFAA499886853A4FAB8D9F73" && chartData.length > 0 && <OGDetail data={chartData} />}
            {agentId === "7CC8416DFF6B43D1B20A1DA33AAF4C99" && chartData.length > 0 && <BrightBasketDetail data={chartData} />}
            {!["C688A59BCCA545D995B903A472BD879F", "0FFCD73CFFAA499886853A4FAB8D9F73", "7CC8416DFF6B43D1B20A1DA33AAF4C99"].includes(agentId) && <GenericDetail snapshot={latest} />}
          </div>
        )}
      </main>
    </div>
  );
}
