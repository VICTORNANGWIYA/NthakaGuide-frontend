import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth }  from "@/contexts/AuthContext";
import { UserPlus, Mail, Lock, User, MapPin, ShieldCheck } from "lucide-react";

import {
  validateEmail,
  validateUsername,
  validatePhone,
  isPasswordValid,
  FieldError,
  PasswordStrength,
  PasswordInput,
  PhoneInput,
} from "@/lib/auth-helpers";
import { MALAWI_DISTRICTS } from "@/lib/malawi-districts";

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

const REGIONS = ["Northern", "Central", "Southern"] as const;

export default function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const { login }  = useAuth();
  const { toast }  = useToast();

  const [fullName,   setFullName]   = useState("");
  const [phone,      setPhone]      = useState("");
  const [district,   setDistrict]   = useState("");
  const [role,       setRole]       = useState<"user">("user");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched,    setTouched]    = useState<Record<string, boolean>>({});
  const [adminOpen,  setAdminOpen]  = useState(false);

  useEffect(() => {
    fetch("https://nthakaguide-backend.onrender.com/auth/admin-slots")
      .then(r  => r.json())
      .then(d  => setAdminOpen(d.admin_registration_open ?? false))
      .catch(() => setAdminOpen(false));
  }, []);

  const emailError    = validateEmail(email);
  const usernameError = validateUsername(fullName);
  const phoneError    = validatePhone(phone);
  const passwordValid = isPasswordValid(password);

  const formValid = !emailError && !usernameError && !phoneError && passwordValid;

  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, fullName: true, phone: true, password: true });

    if (!formValid) {
      toast({
        title: "Please fix the errors",
        description: "Check the highlighted fields before continuing.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res  = await fetch("https://nthakaguide-backend.onrender.com/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:     email.trim().toLowerCase(),
          password,
          role,
          full_name: fullName.trim() || null,
          phone:     phone || null,
          district:  district || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Registration failed");

      login(data.user, data.access_token);
      toast({ title: "Success", description: "Account created! Welcome to NthakaGuide." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate autoComplete="off">

      {/* Role */}
      <AnimatePresence>
        {adminOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <Label className="flex items-center gap-2 text-base font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" /> Account Type
            </Label>
            <Select value={role} onValueChange={v => setRole(v as "user")}>
              <SelectTrigger className="bg-background border-border text-base h-11">
                <SelectValue placeholder="Select account type…" />
              </SelectTrigger>
              <SelectContent className="text-base">
                <SelectItem value="user" className="text-base py-2.5">Regular User — Farmer / Agronomist</SelectItem>
                <SelectItem value="admin" className="text-base py-2.5">Admin — System Administrator</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full name */}
      <div className="space-y-2">
        <Label htmlFor="signup-name" className="flex items-center gap-2 text-base font-medium">
          <User className="h-4 w-4 text-primary" /> Full Name
        </Label>
        <Input
          id="signup-name"
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          onBlur={() => touch("fullName")}
          placeholder="e.g. Chisomo Banda"
          required
          autoComplete="off"
          className={`text-base h-11 ${touched.fullName && usernameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
        <p className="text-xs text-muted-foreground">
          Must start with a letter. May include numbers but not numbers only.
        </p>
        {touched.fullName && <FieldError msg={usernameError} />}
      </div>

      {/* Phone */}
      <div className="text-base" onBlur={() => touch("phone")}>
        <PhoneInput value={phone} onChange={setPhone} />
      </div>

      {/* District */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-base font-medium">
          <MapPin className="h-4 w-4 text-primary" /> Your District
          <span className="text-muted-foreground text-sm font-normal">(optional)</span>
        </Label>
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="bg-background border-border text-base h-11">
            <SelectValue placeholder="Select your district…" />
          </SelectTrigger>
          <SelectContent className="text-base">
            {REGIONS.map(region => (
              <div key={region}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {region} Region
                </div>
                {MALAWI_DISTRICTS.filter(d => d.region === region).map(d => (
                  <SelectItem key={d.name} value={d.name} className="text-base py-2.5">{d.name}</SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="flex items-center gap-2 text-base font-medium">
          <Mail className="h-4 w-4 text-primary" /> Email
        </Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => touch("email")}
          placeholder="you@gmail.com"
          required
          autoComplete="off"
          className={`text-base h-11 ${touched.email && emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
        <p className="text-xs text-muted-foreground">
          Use a recognised provider: Gmail, Outlook, Yahoo, institutional (.ac.mw, .gov.mw), etc.
        </p>
        {touched.email && <FieldError msg={emailError} />}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="signup-password" className="flex items-center gap-2 text-base font-medium">
          <Lock className="h-4 w-4 text-primary" /> Password
        </Label>
        <PasswordInput
          id="signup-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onBlur={() => touch("password")}
          autoComplete="new-password"
          className="text-base h-11"
        />
        <PasswordStrength password={password} />
      </div>

      <Button
        type="submit"
        className="w-full bg-golden text-golden-foreground hover:bg-golden/90 font-semibold text-base h-11"
        disabled={submitting || !formValid}
      >
        {submitting
          ? "Creating account…"
          : <><UserPlus className="mr-2 h-5 w-5" /> Create Account</>}
      </Button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-base text-primary hover:underline font-medium"
        >
          Already have an account? Sign in
        </button>
      </div>
    </form>
  );
}
