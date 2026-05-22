// ─── auth-helpers.tsx ─────────────────────────────────────────────────────────
// Shared validation logic, password-strength indicator, and micro-components
// used across LoginForm, SignUpForm, and ForgotPassword.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Phone } from "lucide-react";

// ─── Known email domains whitelist ────────────────────────────────────────────
const KNOWN_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "yahoo.co.uk", "yahoo.co.za",
  "outlook.com", "outlook.co.uk", "hotmail.com", "hotmail.co.uk",
  "live.com", "msn.com", "icloud.com", "me.com", "mac.com",
  "proton.me", "protonmail.com", "zoho.com",
  "aol.com", "yandex.com", "yandex.ru",
  "unima.ac.mw", "mzuni.ac.mw", "poly.ac.mw", "luanar.ac.mw",
  "gov.mw", "malawi.gov.mw",
  "africa.com", "mweb.co.za",
  "edu.mw", "ac.mw",
]);

export function isKnownDomain(domain: string): boolean {
  if (KNOWN_DOMAINS.has(domain.toLowerCase())) return true;
  const parts = domain.toLowerCase().split(".");
  const tld = parts[parts.length - 1];
  const sld = parts.length >= 2 ? parts[parts.length - 2] : "";
  if (["edu", "ac", "gov", "org", "net", "co"].includes(sld)) return true;
  if (["edu", "org", "net", "gov"].includes(tld)) return true;
  if (tld === "com" || tld === "mw") return true;
  return false;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

export function validatePhone(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\s/g, "");
  if (!cleaned.startsWith("+265")) return "Phone must start with +265";
  const local = cleaned.slice(4);
  if (!/^\d{9}$/.test(local))
    return "After +265, enter exactly 9 digits (e.g. +265 999 000 000)";
  if (!/^[89]/.test(local))
    return "Number after +265 must start with 8 or 9";
  return null;
}

export function validateUsername(name: string): string | null {
  if (!name.trim()) return "Full name is required";
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Name must be at least 2 characters";
  if (/^\d+$/.test(trimmed)) return "Name cannot be numbers only";
  if (!/^[a-zA-Z][a-zA-Z0-9 .'\-]*$/.test(trimmed))
    return "Name must start with a letter and may contain letters, numbers, spaces, or . ' -";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  const parts = email.trim().split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1])
    return "Enter a valid email address";
  const domain = parts[1].toLowerCase();
  if (!domain.includes(".")) return "Email domain must include a dot (e.g. gmail.com)";
  if (!isKnownDomain(domain))
    return `"${domain}" is not a recognised email provider. Use Gmail, Outlook, Yahoo, etc.`;
  return null;
}

// ─── Password strength ────────────────────────────────────────────────────────
export interface StrengthRule {
  label: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: StrengthRule[] = [
  { label: "At least 8 characters",        test: pw => pw.length >= 8 },
  { label: "One lowercase letter (a–z)",   test: pw => /[a-z]/.test(pw) },
  { label: "One uppercase letter (A–Z)",   test: pw => /[A-Z]/.test(pw) },
  { label: "One number (0–9)",             test: pw => /\d/.test(pw) },
  { label: "One special character (!@#…)", test: pw => /[!@#$%^&*()\-_=+\[\]{}|;':",./<>?\\`~]/.test(pw) },
];

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every(r => r.test(password));
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
  const colors = ["bg-destructive", "bg-destructive", "bg-golden", "bg-golden", "bg-primary"];
  const barColor = colors[passed - 1] ?? "bg-muted";

  return (
    <div className="space-y-2 mt-1">
      <div className="flex gap-1">
        {PASSWORD_RULES.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < passed ? barColor : "bg-muted"
            }`}
          />
        ))}
      </div>
      <ul className="space-y-0.5">
        {PASSWORD_RULES.map(rule => {
          const ok = rule.test(password);
          return (
            <li key={rule.label} className="flex items-center gap-1.5 text-[11px]">
              {ok
                ? <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                : <XCircle      className="h-3 w-3 text-muted-foreground shrink-0" />}
              <span className={ok ? "text-primary" : "text-muted-foreground"}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Inline field error ───────────────────────────────────────────────────────
export function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
      <p className="text-[11px] text-destructive">{msg}</p>
    </div>
  );
}

// ─── Phone input with locked +265 prefix ─────────────────────────────────────
export function PhoneInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const suffix = value.startsWith("+265") ? value.slice(4) : value.replace(/^\+?265?/, "");
  const error  = validatePhone(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s]/g, "").slice(0, 11);
    onChange(raw ? `+265${raw}` : "");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="phone" className="flex items-center gap-2">
        <Phone className="h-3.5 w-3.5 text-primary" /> Phone Number
        <span className="text-muted-foreground text-xs font-normal">(optional)</span>
      </Label>
      <div className="flex">
        <div className="flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-mono select-none">
          +265
        </div>
        <Input
          id="phone"
          type="tel"
          inputMode="numeric"
          value={suffix}
          onChange={handleChange}
          placeholder="99 000 0000"
          className="rounded-l-none font-mono"
          maxLength={11}
          autoComplete="off"
        />
      </div>
      <p className="text-[10px] text-muted-foreground">
        Format: +265 followed by 9 digits starting with 8 or 9 (e.g. +265 999 000 000)
      </p>
      {value && <FieldError msg={error} />}
    </div>
  );
}

// ─── Password input with eye toggle ──────────────────────────────────────────
// Copy/paste is fully allowed — data-lpignore only blocks password MANAGER
// autofill, it does NOT block keyboard shortcuts (Ctrl+C / Ctrl+V).
// The onCopy/onCut/onPaste props are intentionally NOT set so the browser
// handles them normally.
export function PasswordInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "••••••••",
  hasError = false,
  autoComplete = "new-password",
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  hasError?: boolean;
  /** "new-password" for sign-up/reset (default). "off" for login. */
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required
        minLength={8}
        autoComplete={autoComplete}
        data-lpignore="true"   // blocks LastPass autofill only — NOT copy/paste
        data-form-type="other" // blocks Dashlane autofill only — NOT copy/paste
        className={`pr-10 ${hasError ? "border-destructive focus-visible:ring-destructive" : ""}`}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible
          ? <EyeOff className="h-4 w-4" />
          : <Eye    className="h-4 w-4" />}
      </button>
    </div>
  );
}