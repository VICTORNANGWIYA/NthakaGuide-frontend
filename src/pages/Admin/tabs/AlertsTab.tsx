// src/pages/admin/tabs/AlertsTab.tsx
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge }   from "@/components/ui/badge";
import { Button }  from "@/components/ui/button";
import { Bell, RefreshCw } from "lucide-react";
import { AlertIcon, AlertBadge, Loader, ErrorMsg } from "../ui";
import type { Alert } from "../types";

interface Props {
  alerts:       Alert[];
  loading:      boolean;
  error:        string | null;
  reload:       () => void;
  activeCount:  number;
}

export function AlertsTab({ alerts, loading, error, reload, activeCount }: Props) {
  return (
    <TabsContent value="alerts" className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Bell className="h-4 w-4" /> System Alerts
          {activeCount > 0 && <Badge variant="destructive">{activeCount} active</Badge>}
        </h2>
        <Button size="sm" variant="outline" onClick={reload} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {loading ? <Loader /> : error ? <ErrorMsg msg={error} onRetry={reload} /> : (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <Card key={i} className={`border ${
              alert.level === "error"   ? "border-destructive/50 bg-destructive/5"
              : alert.level === "warning" ? "border-golden/50 bg-golden/5"
              : alert.level === "success" ? "border-primary/30 bg-primary/5"
              : "border-border"}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertIcon level={alert.level} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{alert.title}</span>
                      <AlertBadge level={alert.level} />
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </TabsContent>
  );
}
