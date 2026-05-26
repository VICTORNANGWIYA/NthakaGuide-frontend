// src/pages/admin/tabs/AnalysesTab.tsx
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input }   from "@/components/ui/input";
import { Button }  from "@/components/ui/button";
import { Badge }   from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download } from "lucide-react";
import { Loader, ErrorMsg, scoreColor } from "../ui";
import { downloadCSV } from "../hooks";
import type { AnalysisRow, StatsData } from "../types";

interface Props {
  analyses:      any;
  stats:         StatsData | null;
  token:         string;
  loading:       boolean;
  error:         string | null;
  reload:        () => void;
  searchQ:       string;
  setSearchQ:    (v: string) => void;
  filterMode:    string;
  setFilterMode: (v: string) => void;
  filterCrop:    string;
  setFilterCrop: (v: string) => void;
  dateFrom:      string;
  setDateFrom:   (v: string) => void;
  dateTo:        string;
  setDateTo:     (v: string) => void;
}

export function AnalysesTab({
  analyses, stats, token, loading, error, reload,
  searchQ, setSearchQ, filterMode, setFilterMode,
  filterCrop, setFilterCrop, dateFrom, setDateFrom, dateTo, setDateTo,
}: Props) {

  const filtered = ((analyses?.items ?? []) as AnalysisRow[]).filter(a =>
    [a.user_name, a.district, a.recommended_crop].some(
      v => v?.toLowerCase().includes(searchQ.toLowerCase())
    ) &&
    (!filterMode || a.input_mode === filterMode) &&
    (!filterCrop || a.recommended_crop?.toLowerCase().includes(filterCrop.toLowerCase()))
  );

  return (
    <TabsContent value="analyses" className="space-y-6">

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total",      val: (analyses?.total ?? "—").toLocaleString() },
          { label: "Lab Mode",   val: String(stats?.mode_breakdown?.lab   ?? "—") },
          { label: "Field Mode", val: String(stats?.mode_breakdown?.field ?? "—") },
          { label: "Mixed Mode", val: String(stats?.mode_breakdown?.mixed ?? "—") },
        ].map((s, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-display font-bold mt-1">{s.val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table with filters */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-end justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Analysis Log
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative w-44">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select
                value={filterMode === "" ? "all" : filterMode}
                onValueChange={v => setFilterMode(v === "all" ? "" : v)}
              >
                <SelectTrigger className="h-9 w-32 text-sm">
                  <SelectValue placeholder="All modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modes</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                  <SelectItem value="field">Field</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 w-36 text-sm" title="From date" />
              <Input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className="h-9 w-36 text-sm" title="To date" />
              <Button size="sm" variant="outline"
                onClick={() => downloadCSV(token, "/admin/export/analyses", "analyses.csv")}
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
                    {["ID", "User", "District", "Crop", "Score", "Mode", "Date"].map(h => (
                      <TableHead key={h} className="text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-primary text-xs">{a.id?.slice(0, 8)}…</TableCell>
                      <TableCell className="text-sm">{a.user_name}</TableCell>
                      <TableCell className="text-sm">{a.district}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{a.recommended_crop}</Badge></TableCell>
                      <TableCell className={`text-sm font-semibold ${scoreColor(a.crop_score ?? 0)}`}>
                        {a.crop_score ?? "—"}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">{a.input_mode}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString()}
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
