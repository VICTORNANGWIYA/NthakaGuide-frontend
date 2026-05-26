// src/pages/admin/tabs/DistrictsTab.tsx
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input }    from "@/components/ui/input";
import { Badge }    from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search }   from "lucide-react";
import { Loader, ErrorMsg } from "../ui";
import type { DistrictRow } from "../types";

interface Props {
  districts:  DistrictRow[];
  loading:    boolean;
  error:      string | null;
  reload:     () => void;
  searchQ:    string;
  setSearchQ: (v: string) => void;
}

export function DistrictsTab({ districts, loading, error, reload, searchQ, setSearchQ }: Props) {
  const filtered = districts.filter(d =>
    d.district.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <TabsContent value="districts" className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{districts.length} districts with activity</p>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Filter…" value={searchQ} onChange={e => setSearchQ(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
      </div>
      <Card className="border-border">
        <CardContent className="p-0">
          {loading ? <div className="p-6"><Loader /></div>
          : error   ? <div className="p-6"><ErrorMsg msg={error} onRetry={reload} /></div>
          : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["District", "Analyses", "Users", "Top Crop", "Avg pH", "Activity"].map(h => (
                      <TableHead key={h} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d, i) => {
                    const maxA = filtered[0]?.analyses || 1;
                    const pct  = Math.round((d.analyses / maxA) * 100);
                    const ph   = Number(d.avg_ph);
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-sm">{d.district}</TableCell>
                        <TableCell className="text-sm font-semibold text-primary">{d.analyses.toLocaleString()}</TableCell>
                        <TableCell className="text-sm">{d.users}</TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{d.top_crop}</Badge></TableCell>
                        <TableCell className={`text-sm ${ph < 6 ? "text-destructive" : ph > 7.5 ? "text-golden" : "text-primary"}`}>
                          {d.avg_ph ?? "—"}
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="flex-1 h-1.5" />
                            <span className="text-[10px] text-muted-foreground w-7">{pct}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
