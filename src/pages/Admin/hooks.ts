// src/pages/admin/hooks.ts
// Shared hooks and API helpers used across all admin tab panels.

import { useState, useEffect, useCallback } from "react";

export const API = "http://localhost:5000";

// ── Generic fetch hook ────────────────────────────────────────────────────────
export function useAdminFetch<T>(path: string, token: string | null) {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path, token]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

// ── Admin mutation helper ─────────────────────────────────────────────────────
export async function adminAction(
  token: string,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<{ ok: boolean; data: any }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

// ── CSV download helper ───────────────────────────────────────────────────────
export async function downloadCSV(
  token: string,
  path: string,
  filename: string,
) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return;
  const text = await res.text();
  const blob = new Blob([text], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Static model performance data ─────────────────────────────────────────────
export const MODEL_PERF = [
  { algo: "Random Forest",     id: "random_forest",     acc: "99.55%", f1: "99.54%", cv: "99.49%" },
  { algo: "Gradient Boosting", id: "gradient_boosting", acc: "98.18%", f1: "98.19%", cv: "98.75%" },
  { algo: "Decision Tree",     id: "decision_tree",     acc: "98.64%", f1: "98.63%", cv: "98.52%" },
  { algo: "Naive Bayes",       id: "naive_bayes",       acc: "99.49%", f1: "99.54%", cv: "99.55%" },
];
