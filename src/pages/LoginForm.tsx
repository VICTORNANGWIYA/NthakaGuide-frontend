

import { useState } from "react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth }  from "@/contexts/AuthContext";
import { LogIn, Mail, Lock } from "lucide-react";

import {
  validateEmail,
  FieldError,
  PasswordInput,
} from "@/lib/auth-helpers";

interface LoginFormProps {
  onForgotPassword: () => void; 
}

export default function LoginForm({ onForgotPassword, onSwitchToSignUp }: LoginFormProps) {
  const { login }  = useAuth();
  const { toast }  = useToast();

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched,    setTouched]    = useState<Record<string, boolean>>({});

  const emailError   = validateEmail(email);
  const passwordGood = password.length >= 8; // login only needs non-empty; server validates the rest
  const formValid    = !emailError && passwordGood;

  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

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
      const res  = await fetch("http://localhost:5000/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Login failed");

      login(data.user, data.access_token);
      toast({ title: "Success", description: "Logged in successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate autoComplete="off">

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="login-email" className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-primary" /> Email
        </Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => touch("email")}
          placeholder="you@gmail.com"
          required
          autoComplete="off"
          className={touched.email && emailError ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {touched.email && <FieldError msg={emailError} />}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-primary" /> Password
          </Label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-primary hover:underline font-medium"
          >
            Forgot password?
          </button>
        </div>
        {/* 
          autoComplete="off" + data-lpignore="true" prevents browsers / password managers 
          from offering to save the password.
        */}
        <PasswordInput
          id="login-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onBlur={() => touch("password")}
          autoComplete="off"
        />
        {touched.password && !passwordGood && (
          <FieldError msg="Password is required" />
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-golden text-golden-foreground hover:bg-golden/90 font-semibold"
        disabled={submitting}
      >
        {submitting ? "Signing in…" : <><LogIn className="mr-2 h-4 w-4" /> Sign In</>}
      </Button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-sm text-primary hover:underline font-medium"
        >
          Don't have an account? Create one
        </button>
      </div>
    </form>
  );
}
