// src/pages/admin/tabs/ModelTab.tsx
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge }    from "@/components/ui/badge";
import { Button }   from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Cpu, FileText, RefreshCw, ToggleRight } from "lucide-react";
import { Loader }   from "../ui";
import { MODEL_PERF } from "../hooks";
import { useToast } from "@/hooks/use-toast";
import { adminAction } from "../hooks";
import type { ModelInfo } from "../types";

interface Props {
  modelInfo:   ModelInfo | null;
  loading:     boolean;
  reload:      () => void;
  reloadLogs:  () => void;
  token:       string;
}

export function ModelTab({ modelInfo, loading, reload, reloadLogs, token }: Props) {
  const { toast } = useToast();

  const switchModel = async (algorithmId: string) => {
    const { ok, data } = await adminAction(token, "PUT", "/admin/model/switch", { algorithm: algorithmId });
    if (ok) { toast({ title: "Model switched", description: data.message }); reload(); reloadLogs(); }
    else    { toast({ title: "Error", description: data.error, variant: "destructive" }); }
  };

  return (
    <TabsContent value="model" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Model control */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4" /> Model Control
              </CardTitle>
              <Button size="sm" variant="outline" onClick={reload} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <Loader /> : (
              <div className="space-y-3">
                {MODEL_PERF.map((m, i) => {
                  const serverModel = (modelInfo?.models ?? []).find(s => s.id === m.id);
                  const isActive    = modelInfo?.active_model === m.id;
                  const present     = serverModel?.present ?? false;
                  return (
                    <div key={i} className={`p-3 rounded-lg border ${isActive ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>{m.algo}</span>
                            {isActive  && <Badge className="text-[10px] bg-primary">ACTIVE</Badge>}
                            {!present  && <Badge variant="destructive" className="text-[10px]">MISSING</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Accuracy {m.acc} · F1 {m.f1} · CV {m.cv}</p>
                          {serverModel && <p className="text-[10px] text-muted-foreground">{serverModel.file} · {serverModel.size}</p>}
                        </div>
                        {!isActive && present && (
                          <Button size="sm" variant="outline" onClick={() => switchModel(m.id)} className="gap-1.5 shrink-0">
                            <ToggleRight className="h-3.5 w-3.5" /> Switch
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Training info */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Training Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Loader /> : (
              <div>
                {[
                  ["Active Model",  modelInfo?.active_model ?? "—"],
                  ["Training Rows", (modelInfo?.training_rows ?? "66,341").toLocaleString()],
                  ["Feature Count", modelInfo?.feature_count ?? 7],
                  ["Crop Classes",  modelInfo?.classes       ?? 28],
                  ["Accuracy",      modelInfo?.accuracy  ? `${(modelInfo.accuracy  * 100).toFixed(2)}%` : "99.55%"],
                  ["F1 Score",      modelInfo?.f1_score  ? `${(modelInfo.f1_score  * 100).toFixed(2)}%` : "99.54%"],
                  ["CV Mean",       modelInfo?.cv_mean   ? `${(modelInfo.cv_mean   * 100).toFixed(2)}%` : "99.49%"],
                ].map(([k, v], j) => (
                  <div key={j} className="flex gap-3 py-2 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground min-w-[120px] shrink-0">{k}</span>
                    <span className="text-xs font-mono">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature importance */}
      <Card className="border-border">
        <CardHeader><CardTitle className="text-base">Feature Importance (Random Forest)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
            {[
              { f: "Rainfall (annual_mm)", imp: 28.4 },
              { f: "Humidity (%)",          imp: 21.7 },
              { f: "Temperature (°C)",      imp: 18.2 },
              { f: "Potassium K (mg/kg)",   imp: 12.1 },
              { f: "pH",                    imp: 9.8  },
              { f: "Nitrogen N (mg/kg)",    imp: 5.6  },
              { f: "Phosphorus P (mg/kg)",  imp: 4.2  },
            ].map((fi, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{fi.f}</span>
                  <span className="font-semibold text-primary">{fi.imp}%</span>
                </div>
                <Progress value={(fi.imp / 28.4) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
