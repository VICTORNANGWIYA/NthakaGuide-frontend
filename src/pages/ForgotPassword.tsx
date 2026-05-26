

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button }    from "@/components/ui/button";
import { Input }     from "@/components/ui/input";
import { Label }     from "@/components/ui/label";
import { useToast }  from "@/hooks/use-toast";
import {
  Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, RefreshCw,
} from "lucide-react";

import {
  validateEmail,
  isPasswordValid,
  FieldError,
  PasswordStrength,
  PasswordInput,
} from "@/lib/auth-helpers";

type Step = "email" | "otp" | "newPassword" | "done";

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const { toast } = useToast();

  const [step,        setStep]        = useState<Step>("email");
  const [email,       setEmail]       = useState("");
  const [otp,         setOtp]         = useState("");
  const [resetToken,  setResetToken]  = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [resending,   setResending]   = useState(false);
  const [touched,     setTouched]     = useState<Record<string, boolean>>({});

  const emailError     = validateEmail(email);
  const passwordValid  = isPasswordValid(newPassword);
  const passwordsMatch = newPassword === confirm;



  const touch = (f: string) => setTouched(t => ({ ...t, [f]: true }));

  
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    touch("email");
    if (emailError) return;

    setSubmitting(true);
    try {
      const res  = await fetch("http://localhost:5000/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send reset code");
      toast({ title: "Code sent", description: `A 6-digit code was sent to ${email}.` });
      setStep("otp");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  
  const handleResend = async () => {
    setResending(true);
    try {
      const res  = await fetch("http://localhost:5000/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resend failed");
      toast({ title: "Code resent", description: "Check your inbox for a new code." });
      setOtp("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: "Invalid code", description: "Enter the 6-digit code from your email.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res  = await fetch("http://localhost:5000/auth/verify-otp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid or expired code");
      setResetToken(data.reset_token ?? "");
      setStep("newPassword");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ newPassword: true, confirm: true });

    if (!passwordValid) {
      toast({ title: "Weak password", description: "Meet all the password requirements.", variant: "destructive" });
      return;
    }
    if (!passwordsMatch) {
      toast({ title: "Passwords don't match", description: "Both fields must be identical.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res  = await fetch("http://localhost:5000/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reset_token: resetToken, password: newPassword }),
      });
      const data = await res.json();

      
      if (!res.ok) {
       
        throw new Error(data.error || "Could not reset password");
      }

      setStep("done");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const slide = {
    initial:    { opacity: 0, x: 24 },
    animate:    { opacity: 1, x: 0 },
    exit:       { opacity: 0, x: -24 },
    transition: { duration: 0.22 },
  };

  return (
    <div className="space-y-4">
      {step !== "done" && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </button>
      )}

      <AnimatePresence mode="wait">

      
        {step === "email" && (
          <motion.form key="email" {...slide} onSubmit={handleRequestOtp} className="space-y-4" noValidate>
            <p className="text-sm text-muted-foreground">
              Enter the email address linked to your account and we'll send you a reset code.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary" /> Your Email
              </Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => touch("email")}
                placeholder="you@gmail.com"
                required
                autoComplete="email"
                className={touched.email && emailError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.email && <FieldError msg={emailError} />}
            </div>
            <Button
              type="submit"
              className="w-full bg-golden text-golden-foreground hover:bg-golden/90 font-semibold"
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Send Reset Code"}
            </Button>
          </motion.form>
        )}

       
        {step === "otp" && (
          <motion.form key="otp" {...slide} onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
              It expires in 10 minutes.
            </p>
            <div className="space-y-2">
              <Label htmlFor="otp-input" className="flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 text-primary" /> Verification Code
              </Label>
              <Input
                id="otp-input"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                autoComplete="one-time-code"
                className="font-mono tracking-widest text-center text-lg"
              />
              <p className="text-[10px] text-muted-foreground">
                Enter the 6 digits exactly as they appear in the email.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full bg-golden text-golden-foreground hover:bg-golden/90 font-semibold"
              disabled={submitting || otp.length !== 6}
            >
              {submitting ? "Verifying…" : "Verify Code"}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-1.5 mx-auto text-xs text-primary hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                {resending ? "Resending…" : "Resend code"}
              </button>
            </div>
          </motion.form>
        )}

       
        {step === "newPassword" && (
          <motion.form key="newPassword" {...slide} onSubmit={handleResetPassword} className="space-y-4" noValidate autoComplete="off">
            <p className="text-sm text-muted-foreground">
              Choose a strong new password. It must be different from your previous password.
            </p>

           
            <div className="space-y-2">
              <Label htmlFor="new-password" className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-primary" /> New Password
              </Label>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onBlur={() => touch("newPassword")}
                autoComplete="new-password"
                placeholder="Create a strong new password"
              />
              <PasswordStrength password={newPassword} />
            </div>

           
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-primary" /> Confirm Password
              </Label>
              <PasswordInput
                id="confirm-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onBlur={() => touch("confirm")}
                autoComplete="new-password"
                placeholder="Repeat your new password"
                hasError={touched.confirm && !passwordsMatch}
              />
              {touched.confirm && !passwordsMatch && (
                <FieldError msg="Passwords do not match" />
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-golden text-golden-foreground hover:bg-golden/90 font-semibold"
              disabled={submitting || !passwordValid || !passwordsMatch}
            >
              {submitting ? "Saving…" : "Set New Password"}
            </Button>
          </motion.form>
        )}

        
        {step === "done" && (
          <motion.div key="done" {...slide} className="text-center space-y-4 py-4">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <div>
              <p className="font-semibold text-foreground text-lg">Password updated!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your password has been reset. You can now sign in with your new password.
              </p>
            </div>
            <Button
              onClick={onBack}
              className="w-full bg-golden text-golden-foreground hover:bg-golden/90 font-semibold"
            >
              Go to Sign In
            </Button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}