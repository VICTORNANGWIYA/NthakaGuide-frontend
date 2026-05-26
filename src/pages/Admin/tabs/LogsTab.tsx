// src/pages/admin/tabs/LogsTab.tsx
import { useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge }  from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  ClipboardList, RefreshCw, Download, Search, MessageSquare,
  BarChart3,
} from "lucide-react";
import { Loader, ErrorMsg } from "../ui";
import { downloadCSV } from "../hooks";

// ── Types ─────────────────────────────────────────────────────────────────────
interface LogEntry {
  id:           string;
  admin_id:     string;
  admin_email:  string;    // now returned by the persistent DB endpoint
  action:       string;
  target_id:    string;
  target_label: string;
  detail:       string;
  ip_address:   string | null;
  created_at:   string;
}

interface SurveyEntry {
  id:           string;
  user_email:   string;
  reason:       string;
  reason_label: string;
  details:      string | null;
  created_at:   string;
}

interface SurveyData {
  items:          SurveyEntry[];
  total:          number;
  reason_summary: { reason: string; count: number }[];
}

interface Props {
  logs:         { items: LogEntry[]; total: number; action_types?: string[] } | null;
  surveys:      SurveyData | null;
  loading:      boolean;
  error:        string | null;
  reload:       () => void;
  reloadSurveys:() => void;
  token:        string;
}

// ── Action badge colour map ───────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  deactivate_user:         "bg-destructive/10 text-destructive border-destructive/20",
  activate_user:           "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400",
  promote_user:            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
  demote_user:             "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
  delete_user:             "bg-destructive/10 text-destructive border-destructive/20",
  reset_password:          "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400",
  switch_model:            "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400",
  export_analyses:         "bg-muted text-muted-foreground border-border",
  export_users:            "bg-muted text-muted-foreground border-border",
  export_monthly_report:   "bg-muted text-muted-foreground border-border",
  export_audit_log:        "bg-muted text-muted-foreground border-border",
  export_deletion_surveys: "bg-muted text-muted-foreground border-border",
};

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${cls}`}>
      {action.replace(/_/g, " ")}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function LogsTab({
  logs, surveys, loading, error, reload, reloadSurveys, token,
}: Props) {
  const [innerTab,     setInnerTab]     = useState<"audit" | "surveys">("audit");
  const [actionFilter, setActionFilter] = useState("all");
  const [searchQ,      setSearchQ]      = useState("");

  // Client-side filter on top of server data (server also supports ?action= and ?search=)
  const filteredLogs = (logs?.items ?? []).filter(log => {
    const matchAction = actionFilter === "all" || log.action === actionFilter;
    const matchSearch = !searchQ || [log.admin_email, log.action, log.target_label, log.detail]
      .some(v => (v ?? "").toLowerCase().includes(searchQ.toLowerCase()));
    return matchAction && matchSearch;
  });

  const actionTypes = logs?.action_types ?? [];

  return (
    <TabsContent value="logs" className="space-y-4">

      {/* Inner tab switcher: Audit Trail vs Deletion Surveys */}
      <Tabs value={innerTab} onValueChange={v => setInnerTab(v as "audit" | "surveys")}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList className="h-9">
            <TabsTrigger value="audit" className="gap-1.5 text-xs">
              <ClipboardList className="h-3.5 w-3.5" /> Audit Trail
              {logs?.total != null && (
                <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                  {logs.total}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="surveys" className="gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" /> Deletion Surveys
              {surveys?.total != null && surveys.total > 0 && (
                <span className="ml-1 text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-semibold">
                  {surveys.total}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button size="sm" variant="outline"
              onClick={innerTab === "audit" ? reload : reloadSurveys}
              className="gap-1.5 h-9 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            {innerTab === "audit" && (
              <Button size="sm" variant="outline"
                onClick={() => downloadCSV(token, "/admin/export/audit-log", "audit_log.csv")}
                className="gap-1.5 h-9 text-xs">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            )}
            {innerTab === "surveys" && (
              <Button size="sm" variant="outline"
                onClick={() => downloadCSV(token, "/admin/export/deletion-surveys", "deletion_surveys.csv")}
                className="gap-1.5 h-9 text-xs">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            )}
          </div>
        </div>

        {/* ── AUDIT TRAIL TAB ──────────────────────────────────────────── */}
        {innerTab === "audit" && (
          <div className="space-y-3 mt-4">

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search admin, action, target…"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  className="pl-8 h-9 text-sm w-56"
                />
              </div>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-9 w-48 text-sm">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {actionTypes.map(a => (
                    <SelectItem key={a} value={a}>
                      {a.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="border-border">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6"><Loader /></div>
                ) : error ? (
                  <div className="p-6"><ErrorMsg msg={error} onRetry={reload} /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {["Time", "Admin", "Action", "Target", "Detail", "IP"].map(h => (
                            <TableHead key={h} className="text-xs">{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">
                              {searchQ || actionFilter !== "all"
                                ? "No audit entries match your filters."
                                : "No admin actions logged yet."}
                            </TableCell>
                          </TableRow>
                        ) : filteredLogs.map((log, i) => (
                          <TableRow key={log.id ?? i}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </TableCell>
                            {/*
                              Previously showed admin_id sliced to 8 chars.
                              Now shows admin_email from the DB join so admins
                              can see WHO did what, not just an opaque UUID.
                            */}
                            <TableCell className="text-xs font-medium text-foreground">
                              {log.admin_email ?? log.admin_id?.slice(0, 8) ?? "—"}
                            </TableCell>
                            <TableCell>
                              <ActionBadge action={log.action} />
                            </TableCell>
                            <TableCell className="text-xs max-w-[140px] truncate" title={log.target_label}>
                              {log.target_label || log.target_id || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={log.detail}>
                              {log.detail || "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {log.ip_address || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              Audit log is persisted in the database and visible to all admins.
              {logs?.total != null && ` Showing ${filteredLogs.length} of ${logs.total} entries.`}
            </p>
          </div>
        )}

        {/* ── DELETION SURVEYS TAB ─────────────────────────────────────── */}
        {innerTab === "surveys" && (
          <div className="space-y-4 mt-4">

            {/* Reason summary chart */}
            {surveys?.reason_summary && surveys.reason_summary.length > 0 && (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Deletion Reason Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {surveys.reason_summary.map((r, i) => {
                    const total = surveys.reason_summary.reduce((s, x) => s + x.count, 0) || 1;
                    const pct   = Math.round((r.count / total) * 100);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-foreground">{r.reason}</span>
                          <span className="font-semibold text-primary">{r.count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-muted-foreground pt-1">
                    Total responses: {surveys.total}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Individual responses */}
            <Card className="border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {["Date", "User Email", "Reason", "Additional Comments"].map(h => (
                          <TableHead key={h} className="text-xs">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!surveys || surveys.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-10">
                            No deletion survey responses yet.
                          </TableCell>
                        </TableRow>
                      ) : surveys.items.map((s, i) => (
                        <TableRow key={s.id ?? i}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(s.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-foreground">
                            {s.user_email}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border bg-destructive/5 text-destructive border-destructive/20">
                              {s.reason_label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[240px]">
                            {s.details
                              ? <span className="italic">"{s.details}"</span>
                              : <span className="opacity-40">—</span>
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </Tabs>
    </TabsContent>
  );
}