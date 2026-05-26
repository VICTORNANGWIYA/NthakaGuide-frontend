/**
 * src/pages/admin/AdminDashboard.tsx
 *
 * Slim shell — owns only:
 *   • route guard
 *   • all useAdminFetch calls
 *   • shared filter state
 *   • dialog open/close state
 *   • KPI assembly
 *   • top bar
 *   • tab list
 *
 * Every tab panel lives in ./tabs/*.tsx
 * Every shared primitive lives in ./ui.tsx
 * Every hook/helper lives in ./hooks.ts
 */

import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BarChart3, Users, MapPin, Brain, Bot,
  CloudRain, Settings, Sprout, Globe, RefreshCw,
  UserCircle, LogOut, Bell, ClipboardList,
} from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

import { useAdminFetch } from "./hooks";
import { StatusDot }     from "./ui";
import { ResetPasswordDialog, ConfirmDialog } from "./dialogs";
import { adminAction }   from "./hooks";
import { useToast }      from "@/hooks/use-toast";

// ── Tab panels ──────────────────────────────────────────────────────────────
import { OverviewTab }  from "./tabs/OverviewTab";
import { AnalysesTab }  from "./tabs/AnalysesTab";
import { UsersTab }     from "./tabs/UsersTab";
import { DistrictsTab } from "./tabs/DistrictsTab";
import { ModelTab }     from "./tabs/ModelTab";
import { AlertsTab }    from "./tabs/AlertsTab";
import { LogsTab }      from "./tabs/LogsTab";
import { ChatbotTab, RainfallTab, SettingsTab } from "./tabs/ChatbotRainfallSettingsTabs";

// ── KPI spark data (static) ─────────────────────────────────────────────────
const STATIC_SPARKS = {
  users:     [80, 110, 130, 160, 180, 200, 210, 230, 240, 260],
  districts: [20, 22, 22, 24, 26, 26, 28, 28, 28, 28],
  uptime:    [99, 100, 100, 99, 100, 100, 100, 100, 99, 100],
};

export default function AdminDashboard() {
  const { user, token, loading: authLoading, signOut } = useAuth();
  const navigate  = useNavigate();
  const { toast } = useToast();

  // ── Filter / search state ─────────────────────────────────────────────────
  const [searchQ,    setSearchQ]    = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [filterCrop, setFilterCrop] = useState("");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const surveysApi   = useAdminFetch<any>("/admin/deletion-surveys", token);

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [resetTarget,   setResetTarget]   = useState<{ id: string; email: string } | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<{ id: string; email: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string; description: string; label: string;
    variant?: "destructive"; onConfirm: () => void;
  } | null>(null);

  // Block back-button navigation out of admin
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handle = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handle);
    return () => window.removeEventListener("popstate", handle);
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────
  const statsApi     = useAdminFetch<any>("/admin/stats",          token);
  const monthlyApi   = useAdminFetch<any[]>("/admin/monthly",      token);
  const analysesApi  = useAdminFetch<any>("/admin/analyses",       token);
  const usersApi     = useAdminFetch<any>("/admin/users",          token);
  const districtsApi = useAdminFetch<any[]>("/admin/districts",    token);
  const cropsApi     = useAdminFetch<any[]>("/admin/crops",        token);
  const fertsApi     = useAdminFetch<any[]>("/admin/fertilizers",  token);
  const alertsApi    = useAdminFetch<any[]>("/admin/alerts",       token);
  const logsApi      = useAdminFetch<any>("/admin/logs",           token);
  const modelApi     = useAdminFetch<any>("/admin/model/status",   token);
  const chatbotApi   = useAdminFetch<any>("/admin/chatbot/stats",  token);

  if (authLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center justify-center gap-3 mb-4">
              <img src={logo} alt="NthakaGuide logo" className="h-12 w-12 rounded-lg shadow-lg" />
            </div>
    </div>
  );
  if (!user || user.role !== "admin") return <Navigate to="/recommend" replace />;

  const stats        = statsApi.data;
  const monthly      = monthlyApi.data   ?? [];
  const totalAnalyses = stats?.total_analyses ?? 0;
  const sparkData     = monthly.map((m: any) => m.count);
  const activeAlerts  = (alertsApi.data ?? []).filter((a: any) => a.level !== "success").length;

  // ── KPI assembly ──────────────────────────────────────────────────────────
  const kpis = [
    { label: "Total Analyses",   value: totalAnalyses.toLocaleString(),              sub: `+${stats?.analyses_today ?? 0} today`,       spark: sparkData.length >= 2 ? sparkData : [0, 1], Icon: BarChart3 },
    { label: "Registered Users", value: (stats?.total_users ?? 0).toLocaleString(),  sub: `+${stats?.new_users_week ?? 0} this week`,   spark: STATIC_SPARKS.users,                        Icon: Users     },
    { label: "Active Districts", value: `${stats?.active_districts ?? 0} / 28`,      sub: stats?.active_districts === 28 ? "100% coverage" : "districts active", spark: STATIC_SPARKS.districts, Icon: MapPin },
    { label: "API Uptime",       value: stats?.api_uptime ?? "—",                    sub: "Last 30 days",                               spark: STATIC_SPARKS.uptime,                       Icon: Globe     },
  ];

  // ── Delete user helper (needs access to reload) ───────────────────────────
  const handleDeleteConfirm = async (id: string, email: string) => {
    if (!token) return;
    const { ok, data } = await adminAction(token, "DELETE", `/admin/users/${id}`);
    if (ok) {
      toast({ title: "Success", description: `${email} deleted.` });
      usersApi.reload(); logsApi.reload(); alertsApi.reload();
    } else {
      toast({ title: "Error", description: data.error, variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const tabDef = [
    { id: "overview",  label: "Overview",   Icon: LayoutDashboard },
    { id: "analyses",  label: "Analyses",   Icon: BarChart3 },
    { id: "users",     label: "Users",      Icon: Users },
    { id: "districts", label: "Districts",  Icon: MapPin },
    { id: "model",     label: "ML Model",   Icon: Brain },
    { id: "alerts",    label: "Alerts",     Icon: Bell,          badge: activeAlerts > 0 ? activeAlerts : undefined },
    { id: "logs",      label: "Logs",       Icon: ClipboardList },
    { id: "chatbot",   label: "AI Chatbot", Icon: Bot },
    { id: "rainfall",  label: "Rainfall",   Icon: CloudRain },
    { id: "settings",  label: "Settings",   Icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container max-w-7xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="NthakaGuide" className="h-8 w-8 rounded-md" />
            <span className="font-display font-bold text-sm">NthakaGuide</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-1">
           
            
            <Button variant="ghost" size="sm"
              onClick={() => navigate("/admin/admin_profile")}
              className="gap-1.5 text-muted-foreground hover:text-foreground">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Profile</span>
            </Button>
            <Button variant="ghost" size="sm"
              onClick={() => { signOut(); navigate("/", { replace: true }); }}
              className="gap-1.5 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <h1 className="font-display text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">NthakaGuide system overview and management</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            {/* Tab list */}
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              {tabDef.map(t => (
                <TabsTrigger key={t.id} value={t.id}
                  className="relative flex items-center gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <t.Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                  {t.badge && (
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-destructive rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                      {t.badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Tab panels ─────────────────────────────────────────────── */}
            <OverviewTab
              kpis={kpis}
              monthly={monthly}
              analyses={analysesApi.data}
              crops={cropsApi.data ?? []}
              ferts={fertsApi.data ?? []}
              stats={stats}
              loadingStats={statsApi.loading}
              errorStats={statsApi.error}
              loadingMonthly={monthlyApi.loading}
              loadingAnalyses={analysesApi.loading}
              loadingCrops={cropsApi.loading}
              loadingFerts={fertsApi.loading}
              reloadStats={statsApi.reload}
            />

            <AnalysesTab
              analyses={analysesApi.data}
              stats={stats}
              token={token ?? ""}
              loading={analysesApi.loading}
              error={analysesApi.error}
              reload={analysesApi.reload}
              searchQ={searchQ}   setSearchQ={setSearchQ}
              filterMode={filterMode} setFilterMode={setFilterMode}
              filterCrop={filterCrop} setFilterCrop={setFilterCrop}
              dateFrom={dateFrom} setDateFrom={setDateFrom}
              dateTo={dateTo}     setDateTo={setDateTo}
            />

            <UsersTab
              users={usersApi.data}
              stats={stats}
              token={token ?? ""}
              loading={usersApi.loading}
              error={usersApi.error}
              reload={usersApi.reload}
              reloadLogs={logsApi.reload}
              reloadAlerts={alertsApi.reload}
              searchQ={searchQ} setSearchQ={setSearchQ}
              onResetPassword={(id, email) => setResetTarget({ id, email })}
              onDeleteUser={(id, email)    => setDeleteTarget({ id, email })}
              onConfirmAction={setConfirmAction}
            />

            <DistrictsTab
              districts={districtsApi.data ?? []}
              loading={districtsApi.loading}
              error={districtsApi.error}
              reload={districtsApi.reload}
              searchQ={searchQ} setSearchQ={setSearchQ}
            />

            <ModelTab
              modelInfo={modelApi.data}
              loading={modelApi.loading}
              reload={modelApi.reload}
              reloadLogs={logsApi.reload}
              token={token ?? ""}
            />

            <AlertsTab
              alerts={alertsApi.data ?? []}
              loading={alertsApi.loading}
              error={alertsApi.error}
              reload={alertsApi.reload}
              activeCount={activeAlerts}
            />

           <LogsTab
  logs={logsApi.data}
  surveys={surveysApi.data}
  loading={logsApi.loading}
  error={logsApi.error}
  reload={logsApi.reload}
  reloadSurveys={surveysApi.reload}
  token={token ?? ""}
/>

            <ChatbotTab
              stats={chatbotApi.data}
              loading={chatbotApi.loading}
              error={chatbotApi.error}
              reload={chatbotApi.reload}
            />

            <RainfallTab />
            <SettingsTab />

          </Tabs>
        </motion.div>
      </main>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      {resetTarget && token && (
        <ResetPasswordDialog
          userId={resetTarget.id}
          userEmail={resetTarget.email}
          token={token}
          open={!!resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={usersApi.reload}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete User"
          description={`Permanently delete ${deleteTarget.email} and all their data? This cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDeleteConfirm(deleteTarget.id, deleteTarget.email)}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          title={confirmAction.title}
          description={confirmAction.description}
          confirmLabel={confirmAction.label}
          variant={confirmAction.variant}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => { confirmAction.onConfirm(); setConfirmAction(null); }}
        />
      )}
    </div>
  );
}