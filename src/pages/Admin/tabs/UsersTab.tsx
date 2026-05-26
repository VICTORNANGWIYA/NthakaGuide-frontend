// src/pages/admin/tabs/UsersTab.tsx
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input }  from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Shield, Key, Trash2, UserX, UserCheck } from "lucide-react";
import { StatusDot, Loader, ErrorMsg } from "../ui";
import { downloadCSV, adminAction } from "../hooks";
import { useToast } from "@/hooks/use-toast";
import type { UserRow, StatsData } from "../types";

interface Props {
  users:            any;
  stats:            StatsData | null;
  token:            string;
  loading:          boolean;
  error:            string | null;
  reload:           () => void;
  reloadLogs:       () => void;
  reloadAlerts:     () => void;
  searchQ:          string;
  setSearchQ:       (v: string) => void;
  onResetPassword:  (id: string, email: string) => void;
  onDeleteUser:     (id: string, email: string) => void;
  onConfirmAction:  (cfg: { title: string; description: string; label: string; variant?: "destructive"; onConfirm: () => void }) => void;
}

export function UsersTab({
  users, stats, token, loading, error, reload, reloadLogs, reloadAlerts,
  searchQ, setSearchQ, onResetPassword, onDeleteUser, onConfirmAction,
}: Props) {
  const { toast } = useToast();

  const filtered = ((users?.items ?? []) as UserRow[]).filter(u =>
    [u.email, u.full_name ?? "", u.district ?? ""].some(
      v => v.toLowerCase().includes(searchQ.toLowerCase())
    )
  );

  const userAction = async (path: string, method: string, body?: any, successMsg?: string) => {
    const { ok, data } = await adminAction(token, method, path, body);
    if (ok) {
      toast({ title: "Success", description: successMsg ?? data.message });
      reload(); reloadLogs(); reloadAlerts();
    } else {
      toast({ title: "Error", description: data.error, variant: "destructive" });
    }
  };

  return (
    <TabsContent value="users" className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users",      val: String(stats?.total_users    ?? "—") },
          { label: "Active Today",     val: "—" },
          { label: "New This Week",    val: String(stats?.new_users_week ?? "—") },
          { label: "With 5+ Analyses", val: "—" },
        ].map((s, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-display font-bold mt-1">{s.val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users table */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle className="text-base">User Management</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users…"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Button size="sm" variant="outline"
                onClick={() => downloadCSV(token, "/admin/export/users", "users.csv")}
                className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <Loader /> : error ? <ErrorMsg msg={error} onRetry={reload} /> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["User", "Email", "District", "Analyses", "Status", "Actions"].map(h => (
                      <TableHead key={h} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 border border-border flex items-center justify-center text-[10px] font-bold text-primary">
                            {(u.full_name || u.email || "?").split(" ").map(w => w[0]).slice(0, 2).join("")}
                          </div>
                          <span className="text-sm">{u.full_name || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-sm">{u.district || "—"}</TableCell>
                      <TableCell className="text-sm font-semibold text-primary">{u.analyses}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <StatusDot status={u.is_active ? (u.status ?? "active") : "disabled"} />
                          <span className="text-xs">{u.is_active ? (u.status ?? "active") : "disabled"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {u.is_active ? (
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-golden" title="Deactivate"
                              onClick={() => onConfirmAction({
                                title: "Deactivate User",
                                description: `Disable ${u.email}'s account?`,
                                label: "Deactivate",
                                variant: "destructive",
                                onConfirm: () => userAction(`/admin/users/${u.id}/deactivate`, "PUT", undefined, `${u.email} deactivated.`),
                              })}>
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" title="Activate"
                              onClick={() => userAction(`/admin/users/${u.id}/activate`, "PUT", undefined, `${u.email} activated.`)}>
                              <UserCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Promote to Admin"
                            onClick={() => onConfirmAction({
                              title: "Promote to Admin",
                              description: `Grant admin privileges to ${u.email}?`,
                              label: "Promote",
                              onConfirm: () => userAction(`/admin/users/${u.id}/promote`, "PUT", undefined, `${u.email} promoted.`),
                            })}>
                            <Shield className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Reset Password"
                            onClick={() => onResetPassword(u.id, u.email)}>
                            <Key className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Delete User"
                            onClick={() => onDeleteUser(u.id, u.email)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
