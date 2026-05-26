// src/pages/admin/types.ts
// Shared type definitions for the Admin Dashboard

export interface KPI {
  label: string;
  value: string;
  sub:   string;
  spark: number[];
  Icon:  React.ElementType;
}

export interface AnalysisRow {
  id:               string;
  user_name:        string;
  district:         string;
  recommended_crop: string;
  crop_score:       number | null;
  input_mode:       string;
  created_at:       string;
}

export interface UserRow {
  id:        string;
  email:     string;
  full_name: string | null;
  district:  string | null;
  analyses:  number;
  is_active: boolean;
  status?:   string;
}

export interface DistrictRow {
  district: string;
  analyses: number;
  users:    number;
  top_crop: string;
  avg_ph:   string | null;
}

export interface Alert {
  level:     "error" | "warning" | "success" | "info";
  title:     string;
  message:   string;
  timestamp: string;
}

export interface LogEntry {
  timestamp: string;
  admin_id:  string;
  action:    string;
  target:    string | null;
  detail:    string | null;
}

export interface CropStat {
  crop:  string;
  count: number;
  pct:   number;
}

export interface FertStat {
  name: string;
  pct:  number;
}

export interface MonthlyCount {
  month: string;
  count: number;
}

export interface ModelInfo {
  active_model:  string;
  training_rows: number;
  feature_count: number;
  classes:       number;
  accuracy:      number;
  f1_score:      number;
  cv_mean:       number;
  models:        { id: string; file: string; size: string; present: boolean }[];
}

export interface ChatbotStats {
  kpis:             { label: string; value: string; delta: string }[];
  model_config:     [string, string][];
  topic_breakdown:  { label: string; count: number; pct: number }[];
}

export interface StatsData {
  total_analyses:   number;
  analyses_today:   number;
  total_users:      number;
  new_users_week:   number;
  active_districts: number;
  api_uptime:       string;
  mode_breakdown:   { lab?: number; field?: number; mixed?: number };
}
