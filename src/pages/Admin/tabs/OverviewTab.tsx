// src/pages/admin/tabs/OverviewTab.tsx
import { TabsContent }  from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress }     from "@/components/ui/progress";
import { Badge }        from "@/components/ui/badge";
import { Spark, MiniBar, Loader, ErrorMsg } from "../ui";
import type { KPI, MonthlyCount, StatsData } from "../types";

interface Props {
  kpis:         KPI[];
  monthly:      MonthlyCount[];
  analyses:     any;
  crops:        any[];
  ferts:        any[];
  stats:        StatsData | null;
  loadingStats: boolean;
  errorStats:   string | null;
  loadingMonthly: boolean;
  loadingAnalyses: boolean;
  loadingCrops: boolean;
  loadingFerts: boolean;
  reloadStats:  () => void;
}

export function OverviewTab({
  kpis, monthly, analyses, crops, ferts, stats,
  loadingStats, errorStats, loadingMonthly,
  loadingAnalyses, loadingCrops, loadingFerts,
  reloadStats,
}: Props) {
  return (
    <TabsContent value="overview" className="space-y-6">

      {/* KPI cards */}
      {loadingStats ? <Loader /> : errorStats ? (
        <ErrorMsg msg={errorStats} onRetry={reloadStats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <Card key={i} className="border-border relative overflow-hidden">
              <CardContent className="p-5">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full" />
                <div className="flex items-center gap-2 mb-2">
                  <kpi.Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {kpi.label}
                  </span>
                </div>
                <p className="text-2xl font-display font-bold">{kpi.value}</p>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-xs text-primary font-medium">{kpi.sub}</span>
                  <Spark data={kpi.spark} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Monthly chart + mode breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">Analyses per Month</CardTitle>
                <p className="text-2xl font-display font-bold mt-1">
                  {monthly.reduce((s, m) => s + m.count, 0).toLocaleString()}
                </p>
                <span className="text-xs text-primary">Last 12 months</span>
              </div>
              {monthly.length > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Peak</p>
                  <p className="text-lg font-bold text-primary">
                    {Math.max(...monthly.map(m => m.count)).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingMonthly ? <Loader /> : <MiniBar data={monthly} />}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Input Mode Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? <Loader /> : Object.entries(stats?.mode_breakdown ?? {}).map(([mode, cnt]) => {
              const total = (Object.values(stats?.mode_breakdown ?? {}) as number[]).reduce((s, v) => s + v, 0) || 1;
              const pct   = Math.round(((cnt as number) / total) * 100);
              return (
                <div key={mode} className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground flex-1 capitalize">{mode}</span>
                  <Progress value={pct} className="flex-1 h-2" />
                  <span className="text-xs font-semibold w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Top crops + recent analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Recommended Crops</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingCrops ? <Loader /> : crops.map((c, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{c.crop}</span>
                  <span className="font-semibold text-primary">{c.count.toLocaleString()}</span>
                </div>
                <Progress value={c.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Recent Analyses</CardTitle>
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 text-[10px]">
                LIVE
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAnalyses ? <Loader /> : ((analyses?.items ?? []) as any[]).slice(0, 6).map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {(a.user_name || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{a.user_name}</p>
                  <p className="text-xs text-muted-foreground">{a.district}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-primary">{a.recommended_crop}</p>
                  <p className="text-xs text-muted-foreground">{a.crop_score ? `${a.crop_score}%` : "—"}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Fertilizer distribution */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fertilizer Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFerts ? <Loader /> : (
            <div className="space-y-3">
              {ferts.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm flex-1 min-w-[120px]">{f.name}</span>
                  <span className="text-xs font-semibold text-primary w-8 text-right">{f.pct}%</span>
                  <div className="w-40 h-1.5 bg-muted rounded-full">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${f.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
