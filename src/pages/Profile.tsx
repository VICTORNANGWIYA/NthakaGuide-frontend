import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserRound, Mail, Save, Phone, MapPin,
  Lock, Trash2, Eye, EyeOff, AlertTriangle, ShieldCheck, X,
  ChevronRight, Camera, Loader2, ZoomIn,
} from "lucide-react";
import NavHeader from "@/components/NavHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpeg";
import { MALAWI_DISTRICTS } from "@/lib/malawi-districts";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

const DELETION_REASONS = [
  { key: "not_useful",       label: "The app is not useful for my farming needs" },
  { key: "too_complicated",  label: "The app is too complicated to use" },
  { key: "poor_accuracy",    label: "Crop or fertilizer recommendations are inaccurate" },
  { key: "no_internet",      label: "I do not have reliable internet access" },
  { key: "privacy_concerns", label: "I have concerns about my data and privacy" },
  { key: "switching_app",    label: "I am switching to a different application" },
  { key: "temporary",        label: "I am taking a break and may return" },
  { key: "other",            label: "Other reason" },
];

// ── Password Field ────────────────────────────────────────────────────────────
function PasswordField({
  id, label, value, onChange, placeholder = "••••••••",
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
          autoComplete="off"
          data-lpignore="true"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
          aria-label={show ? "Hide" : "Show"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ── Image Lightbox ────────────────────────────────────────────────────────────
function ImageLightbox({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.82, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="relative flex flex-col items-center gap-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 h-9 w-9 rounded-full bg-white/10 border border-white/20
                     flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-lg"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Full-size image */}
        <img
          src={src}
          alt={name}
          className="max-h-[80vh] max-w-[80vw] w-auto h-auto rounded-2xl shadow-2xl object-contain"
        />

        {/* Caption */}
        {name && (
          <p className="text-white/80 text-sm font-medium tracking-wide">{name}</p>
        )}

        <p className="text-white/40 text-xs">Press Esc or click outside to close</p>
      </motion.div>
    </motion.div>
  );
}

// ── Avatar Upload + Lightbox ──────────────────────────────────────────────────
function AvatarUpload({
  avatarUrl, initials, name, onUpload, onRemove, uploading,
}: {
  avatarUrl: string;
  initials: string;
  name: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  };

  return (
    <>
      <div className="relative inline-block">

  {/* ── Avatar (ONLY for viewing) ── */}
  <button
    type="button"
    onClick={() => {
      if (avatarUrl) setLightboxOpen(true);
    }}
    className="rounded-full focus:outline-none"
  >
    <Avatar className="h-24 w-24 ring-2 ring-border shadow-md cursor-zoom-in">
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} className="object-cover" />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
        {initials}
      </AvatarFallback>
    </Avatar>
  </button>

  {/* ── Camera Button (SEPARATE upload button) ── */}
  <button
    type="button"
    onClick={() => fileRef.current?.click()}
    className="absolute bottom-0 right-0 h-8 w-8 rounded-full
               bg-primary text-white flex items-center justify-center
               shadow-lg hover:bg-primary/80 transition"
  >
    {uploading ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <Camera className="h-4 w-4" />
    )}
  </button>

  {/* Hidden file input */}
  <input
    ref={fileRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleFileChange}
  />

</div>

      <AnimatePresence>
        {lightboxOpen && avatarUrl && (
          <ImageLightbox src={avatarUrl} name={name} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({
  onConfirm, onCancel, loading,
}: {
  onConfirm: (password: string, reason: string, details: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [step,    setStep]    = useState<"survey" | "confirm">("survey");
  const [reason,  setReason]  = useState("");
  const [details, setDetails] = useState("");
  const [pw,      setPw]      = useState("");
  const [showPw,  setShowPw]  = useState(false);

  const selectedLabel = DELETION_REASONS.find(r => r.key === reason)?.label ?? "";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onCancel}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted/80 flex items-center
                     justify-center text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Delete your account?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {step === "survey"
                ? "Before you go, please tell us why. Your feedback helps us improve NthakaGuide."
                : "This is permanent. All your soil analyses, history, and data will be erased."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          {(["survey", "confirm"] as const).map((s, i) => (
            <div key={s} className={`h-2 rounded-full transition-all duration-300 ${
              step === s ? "w-6 bg-destructive" : i < (step === "confirm" ? 1 : 0) ? "w-2 bg-destructive/40" : "w-2 bg-muted"
            }`} />
          ))}
        </div>

        {step === "survey" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Why are you deleting your account? <span className="text-destructive ml-1">*</span>
              </Label>
              <div className="space-y-2">
                {DELETION_REASONS.map(r => (
                  <button key={r.key} type="button" onClick={() => setReason(r.key)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all
                      ${reason === r.key
                        ? "border-destructive/60 bg-destructive/5 text-destructive font-medium"
                        : "border-border text-foreground hover:border-muted-foreground/40 hover:bg-muted/30"}`}>
                    <span className={`inline-block w-4 h-4 rounded-full border mr-2.5 align-middle transition-colors ${
                      reason === r.key ? "bg-destructive border-destructive" : "border-muted-foreground"}`} />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Additional comments <span className="font-normal">(optional)</span>
              </Label>
              <Textarea value={details} onChange={e => setDetails(e.target.value)}
                placeholder="Tell us more…" className="resize-none text-sm" rows={3} maxLength={1000} />
              <p className="text-[11px] text-muted-foreground text-right">{details.length}/1000</p>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={onCancel}>Keep My Account</Button>
              <Button variant="destructive" className="flex-1 gap-1.5" disabled={!reason} onClick={() => setStep("confirm")}>
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg px-3 py-2.5 text-sm">
              <p className="text-xs text-muted-foreground mb-0.5">Your reason</p>
              <p className="font-medium text-foreground">{selectedLabel}</p>
              {details && <p className="text-xs text-muted-foreground mt-1 italic">"{details}"</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Enter your password to confirm deletion</Label>
              <div className="relative">
                <Input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && pw) onConfirm(pw, reason, details); }}
                  placeholder="Your current password"
                  className="pr-10 border-destructive/40 focus-visible:ring-destructive"
                  autoComplete="off" data-lpignore="true" autoFocus />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setStep("survey")} disabled={loading}>Back</Button>
              <Button variant="destructive" className="flex-1" disabled={!pw || loading}
                onClick={() => onConfirm(pw, reason, details)}>
                {loading ? "Deleting…" : "Yes, delete my account"}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────
const PW_RULES = [
  (pw: string) => pw.length >= 8,
  (pw: string) => /[a-z]/.test(pw),
  (pw: string) => /[A-Z]/.test(pw),
  (pw: string) => /\d/.test(pw),
  (pw: string) => /[^A-Za-z0-9]/.test(pw),
];
const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-amber-500", "bg-primary"];

// ── Main component ────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, token, loading, signOut } = useAuth();
  const { toast }  = useToast();
  const navigate   = useNavigate();

  const [fullName,        setFullName]        = useState("");
  const [phone,           setPhone]           = useState("");
  const [district,        setDistrict]        = useState("");
  const [avatarUrl,       setAvatarUrl]       = useState("");
  const [initialLoading,  setInitialLoading]  = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [oldPw,      setOldPw]      = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const email = user?.email ?? "";

  const initials = useMemo(() => {
    const source = fullName.trim() || email;
    return source.split(/\s+/).filter(Boolean).slice(0, 2)
      .map(p => p[0]?.toUpperCase()).join("") || "NG";
  }, [email, fullName]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      if (!token) return;
      try {
        const res  = await fetch(`${BASE_URL}/profiles/`, {
          headers: { Authorization: `Bearer ${token}` },
          signal:  controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load profile");
        setFullName(data.full_name   || "");
        setPhone(data.phone          || "");
        setDistrict(data.district    || "");
        setAvatarUrl(data.avatar_url || "");
      } catch (err: any) {
        if (err.name !== "AbortError")
          toast({ title: "Error loading profile", description: err.message, variant: "destructive" });
      } finally {
        if (!controller.signal.aborted) setInitialLoading(false);
      }
    })();
    return () => controller.abort();
  }, [token]);

  const handleAvatarUpload = async (file: File) => {
    if (!token) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please choose an image under 2 MB.", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload  = () => resolve(r.result as string);
        r.onerror = () => reject(new Error("Failed to read file"));
        r.readAsDataURL(file);
      });
      const res  = await fetch(`${BASE_URL}/profiles/avatar`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.profile.avatar_url || "");
      toast({ title: "Photo updated", description: "Your profile photo has been saved." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!token) return;
    setUploadingAvatar(true);
    try {
      const res  = await fetch(`${BASE_URL}/profiles/avatar`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove photo");
      setAvatarUrl("");
      toast({ title: "Photo removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const res  = await fetch(`${BASE_URL}/profiles/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: fullName.trim() || null, phone: phone.trim() || null, district: district || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      toast({ title: "Profile updated", description: "Your details have been saved." });
    } catch (err: any) {
      toast({ title: "Unable to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (oldPw === newPw) { toast({ title: "Same password", description: "New password must be different.", variant: "destructive" }); return; }
    if (newPw.length < 8) { toast({ title: "Too short", description: "At least 8 characters.", variant: "destructive" }); return; }
    if (newPw !== confirmPw) { toast({ title: "Don't match", description: "Passwords must be identical.", variant: "destructive" }); return; }
    setChangingPw(true);
    try {
      const res  = await fetch(`${BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");
      toast({ title: "Password changed" });
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setChangingPw(false);
    }
  };

  const handleDeleteAccount = async (password: string, reason: string, details: string) => {
    if (!token) return;
    setDeletingAccount(true);
    try {
      const res  = await fetch(`${BASE_URL}/auth/delete-account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password, reason, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");
      toast({ title: "Account deleted" });
      signOut();
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  if (loading || initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <img src={logo} alt="NthakaGuide logo" className="h-12 w-12 rounded-lg shadow-lg animate-pulse" />
      </div>
    );
  }
  if (!user) return null;

  const regions        = ["Northern", "Central", "Southern"] as const;
  const pwPassed       = PW_RULES.filter(r => r(newPw)).length;
  const pwAllRules     = pwPassed === PW_RULES.length;
  const isSamePassword = oldPw.length > 0 && newPw.length > 0 && oldPw === newPw;
  const canSubmitPw    = !changingPw && oldPw && newPw && confirmPw && !isSamePassword && pwAllRules && newPw === confirmPw;

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="container max-w-4xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">My Profile</h1>
            <p className="mt-1 text-muted-foreground">Manage your account details for NthakaGuide.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* ── Left ── */}
            <div className="space-y-4">
              <Card>
                <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                  <AvatarUpload
                    avatarUrl={avatarUrl}
                    initials={initials}
                    name={fullName.trim() || "NthakaGuide User"}
                    onUpload={handleAvatarUpload}
                    onRemove={handleAvatarRemove}
                    uploading={uploadingAvatar}
                  />
                  <p className="text-[11px] text-muted-foreground -mt-2">
                    {avatarUrl ? "Click photo to view full size · hover to change" : "Hover to add a photo · JPG, PNG, WebP · max 2 MB"}
                  </p>
                  <div>
                    <h2 className="text-xl font-bold">{fullName.trim() || "NthakaGuide User"}</h2>
                    <p className="text-sm text-muted-foreground">{email}</p>
                    {district && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                        <MapPin className="h-3 w-3" /> {district}
                      </p>
                    )}
                    {phone && (
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Phone className="h-3 w-3" /> {phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" /> Danger Zone
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => setShowDeleteModal(true)}>
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete My Account
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* ── Right ── */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Details</CardTitle>
                  <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSave} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" /> Full Name</Label>
                      <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> Phone Number</Label>
                      <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+265 999 000 000" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Your District</Label>
                      <Select value={district} onValueChange={setDistrict}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select your district..." />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map(region => (
                            <div key={region}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {region} Region
                              </div>
                              {MALAWI_DISTRICTS.filter(d => d.region === region).map(d => (
                                <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" /> Email
                        <span className="text-xs text-muted-foreground font-normal">(cannot be changed)</span>
                      </Label>
                      <Input value={email} disabled />
                    </div>
                    <Button type="submit" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />{saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Change Password
                  </CardTitle>
                  <CardDescription>Choose a strong password different from your current one.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4" noValidate autoComplete="off">
                    <PasswordField id="old-pw" label="Current Password" value={oldPw} onChange={setOldPw} placeholder="Your current password" />
                    <PasswordField id="new-pw" label="New Password" value={newPw} onChange={setNewPw} />
                    {isSamePassword && (
                      <p className="text-xs text-destructive flex items-center gap-1.5">
                        <Lock className="h-3 w-3" /> New password must be different
                      </p>
                    )}
                    {newPw && !isSamePassword && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          {PW_RULES.map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i < pwPassed ? (STRENGTH_COLORS[pwPassed - 1] ?? "bg-muted") : "bg-muted"}`} />
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{STRENGTH_LABELS[pwPassed - 1] ?? "Very weak"}</p>
                      </div>
                    )}
                    <PasswordField id="confirm-pw" label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} />
                    {confirmPw && (
                      <p className={`text-xs flex items-center gap-1.5 ${newPw === confirmPw ? "text-primary" : "text-destructive"}`}>
                        <Lock className="h-3 w-3" />
                        {newPw === confirmPw ? "Passwords match" : "Passwords do not match"}
                      </p>
                    )}
                    <Button type="submit" disabled={!canSubmitPw} className="w-full sm:w-auto">
                      <Lock className="h-4 w-4 mr-2" />{changingPw ? "Updating…" : "Update Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {showDeleteModal && (
          <DeleteModal onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteModal(false)} loading={deletingAccount} />
        )}
      </AnimatePresence>
    </div>
  );
}
