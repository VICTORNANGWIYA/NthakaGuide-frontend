// src/pages/admin/tabs/ChatbotTab.tsx
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button }   from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw } from "lucide-react";
import { Loader, ErrorMsg } from "../ui";
import type { ChatbotStats } from "../types";

interface Props {
  stats:   ChatbotStats | null;
  loading: boolean;
  error:   string | null;
  reload:  () => void;
}

export function ChatbotTab({ stats, loading, error, reload }: Props) {
  if (loading) return <TabsContent value="chatbot"><Loader /></TabsContent>;
  if (error)   return <TabsContent value="chatbot"><ErrorMsg msg={error} onRetry={reload} /></TabsContent>;

  return (
    <TabsContent value="chatbot" className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(stats?.kpis ?? []).map((s, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-display font-bold mt-1">{s.value}</p>
              <p className="text-xs text-primary mt-1">{s.delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Model config */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">AI Model Configuration</CardTitle>
              <Button size="sm" variant="outline" onClick={reload} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {(stats?.model_config ?? []).map(([k, v], i) => (
              <div key={i} className="flex gap-3 py-2 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground min-w-[100px] shrink-0">{k}</span>
                <span className={`text-xs font-mono ${k === "Status" ? (v.startsWith("✔") ? "text-primary" : "text-destructive") : ""}`}>
                  {v}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Topic breakdown */}
        <Card className="border-border">
          <CardHeader><CardTitle className="text-base">Topic Classification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(stats?.topic_breakdown ?? []).map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{(s.count ?? 0).toLocaleString()}</span>
                    <span className="font-bold text-primary w-8 text-right">{s.pct}%</span>
                  </div>
                </div>
                <Progress value={s.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// src/pages/admin/tabs/RainfallTab.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { Card as RCard, CardContent as RCardContent, CardHeader as RCardHeader, CardTitle as RCardTitle } from "@/components/ui/card";
import { Progress as RProgress } from "@/components/ui/progress";

export function RainfallTab() {
  const zones = [
    { zone: "High Rainfall",    mm: 1280, districts: 6  },
    { zone: "Central Plateau",  mm: 920,  districts: 11 },
    { zone: "Lakeshore",        mm: 790,  districts: 6  },
    { zone: "N. Highlands",     mm: 1110, districts: 4  },
    { zone: "Shire Valley",     mm: 620,  districts: 3  },
  ];

  return (
    <TabsContent value="rainfall" className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "NASA POWER Coverage",   val: "2000–2025", sub: "25 years"     },
          { label: "Districts Connected",   val: "28 / 28",   sub: "All Malawi"   },
          { label: "Avg Annual Forecast",   val: "1,043mm",   sub: "EWMA"         },
          { label: "Satellite API Uptime",  val: "99.1%",     sub: "NASA POWER"   },
        ].map((s, i) => (
          <RCard key={i} className="border-border">
            <RCardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-display font-bold text-primary mt-1">{s.val}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </RCardContent>
          </RCard>
        ))}
      </div>

      <RCard className="border-border">
        <RCardHeader><RCardTitle className="text-base">Rainfall by Zone</RCardTitle></RCardHeader>
        <RCardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {zones.map(z => (
              <RCard key={z.zone} className="bg-muted/30 border-border text-center">
                <RCardContent className="p-4">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">{z.zone}</p>
                  <p className="text-2xl font-display font-bold text-primary">{z.mm}</p>
                  <p className="text-[9px] text-muted-foreground">mm/yr · {z.districts} districts</p>
                  <RProgress value={(z.mm / 1280) * 100} className="h-1 mt-2" />
                </RCardContent>
              </RCard>
            ))}
          </div>
        </RCardContent>
      </RCard>
    </TabsContent>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// src/pages/admin/tabs/SettingsTab.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { Card as SCard, CardContent as SCardContent, CardHeader as SCardHeader, CardTitle as SCardTitle } from "@/components/ui/card";

export function SettingsTab() {
  const sections = [
    { title: "System Information", items: [
      ["App Name",    "NthakaGuide"],
      ["Version",     "2.0.0"],
      ["Environment", "Production"],
      ["Database",    "PostgreSQL / SQLAlchemy"],
      ["Runtime",     "Python Flask"],
      ["Framework",   "React + Vite"],
    ]},
    { title: "API Configuration", items: [
      ["Auth",           "JWT (Flask-JWT-Extended)"],
      ["CORS",           "flask-cors configured"],
      ["JWT Expiry",     "24h (configurable)"],
      ["Rate Limit",     "100 req/min"],
      ["Password Rules", "8+ chars, upper+lower+digit+special"],
      ["Max Admins",     "2 accounts"],
    ]},
    { title: "ML Model Settings", items: [
      ["Crop Model",    "Random Forest (200 trees)"],
      ["Features",      "7 raw (N,P,K,temp,humidity,pH,rain)"],
      ["Training Rows", "~66,000+"],
      ["Malawi Crops",  "28 classes"],
      ["Zone Filter",   "climate_zone × land_use"],
      ["Model Switch",  "PUT /admin/model/switch"],
    ]},
    { title: "External Services", items: [
      ["NASA POWER",  "api.larc.nasa.gov (free)"],
      ["Open-Meteo",  "api.open-meteo.com (free)"],
      ["Admin API",   "GET/PUT /admin/* (JWT)"],
      ["Export API",  "GET /admin/export/*"],
      ["Alerts API",  "GET /admin/alerts"],
      ["Audit Log",   "GET /admin/logs"],
    ]},
  ];

  return (
    <TabsContent value="settings" className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map((section, i) => (
          <SCard key={i} className="border-border">
            <SCardHeader><SCardTitle className="text-base">{section.title}</SCardTitle></SCardHeader>
            <SCardContent>
              {section.items.map(([k, v], j) => (
                <div key={j} className="flex gap-3 py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground min-w-[120px] shrink-0">{k}</span>
                  <span className="text-xs font-mono break-all">{v}</span>
                </div>
              ))}
            </SCardContent>
          </SCard>
        ))}
      </div>
    </TabsContent>
  );
}
