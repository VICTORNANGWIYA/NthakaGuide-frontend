import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserRound, Mail, Save, Phone, MapPin,
  LogOut, LayoutDashboard, ShieldCheck,
  Lock, Eye, EyeOff, Camera, Loader2, X, ZoomIn,
} from "lucide-react";

import logo from "@/assets/logo.jpeg";
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

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { MALAWI_DISTRICTS } from "@/lib/malawi-districts";

const API_URL = "http://localhost:5000";

/* ── Password Field ── */
function PasswordField({
  id, label, value, onChange,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} type={show ? "text" : "password"} value={value}
          onChange={e => onChange(e.target.value)} className="pr-10" />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/* ── Image Lightbox ── */
function ImageLightbox({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
        <button onClick={onClose}
          className="absolute -top-3 -right-3 z-10 h-9 w-9 rounded-full bg-white/10 border border-white/20
                     flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-lg"
          aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        <img src={src} alt={name}
          className="max-h-[80vh] max-w-[80vw] w-auto h-auto rounded-2xl shadow-2xl object-contain" />

        {name && <p className="text-white/80 text-sm font-medium tracking-wide">{name}</p>}
        <p className="text-white/40 text-xs">Press Esc or click outside to close</p>
      </motion.div>
    </motion.div>
  );
}

/* ── Avatar Upload + Lightbox ── */
function AvatarUpload({
  avatarUrl, initials, name, onUpload, onRemove, uploading,
}: {
  avatarUrl: string; initials: string; name: string;
  onUpload: (file: File) => void; onRemove: () => void; uploading: boolean;
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
        {/* Clickable avatar → lightbox */}
        <button
          type="button"
          onClick={() => { if (avatarUrl && !uploading) setLightboxOpen(true); }}
          disabled={!avatarUrl || uploading}
          className={[
            "rounded-full focus:outline-none focus-visible:ring-2",
            "focus-visible:ring-primary focus-visible:ring-offset-2",
            avatarUrl && !uploading ? "cursor-zoom-in" : "cursor-default",
          ].join(" ")}
          aria-label={avatarUrl ? "View full profile photo" : undefined}
          tabIndex={avatarUrl ? 0 : -1}
        >
          <Avatar className="h-20 w-20 ring-2 ring-border ring-offset-2 ring-offset-background">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile photo" className="object-cover" /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>

        {/* Camera overlay → change photo */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full
                     bg-black/55 opacity-0 hover:opacity-100 focus:opacity-100
                     transition-opacity cursor-pointer disabled:cursor-not-allowed"
          aria-label="Change profile photo"
        >
          {uploading
            ? <Loader2 className="h-5 w-5 text-white animate-spin" />
            : <Camera className="h-5 w-5 text-white" />}
        </button>

        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only" onChange={handleFileChange} />

        {/* Zoom hint badge */}
        {avatarUrl && !uploading && (
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background
                          border border-border flex items-center justify-center shadow pointer-events-none">
            <ZoomIn className="h-2.5 w-2.5 text-muted-foreground" />
          </div>
        )}

        {/* Remove badge */}
        {avatarUrl && !uploading && (
          <button type="button" onClick={onRemove}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white
                       flex items-center justify-center shadow-md hover:bg-destructive/80 transition-colors"
            aria-label="Remove photo">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {lightboxOpen && avatarUrl && (
          <ImageLightbox src={avatarUrl} name={name} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Password strength ── */
const PW_RULES = [
  (pw: string) => pw.length >= 8,
  (pw: string) => /[a-z]/.test(pw),
  (pw: string) => /[A-Z]/.test(pw),
  (pw: string) => /\d/.test(pw),
  (pw: string) => /[^A-Za-z0-9]/.test(pw),
];
const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];

/* ── Main Component ── */
export default function AdminProfile() {
  const { user, token, loading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [fullName,        setFullName]        = useState("");
  const [phone,           setPhone]           = useState("");
  const [district,        setDistrict]        = useState("");
  const [avatarUrl,       setAvatarUrl]       = useState("");
  const [initialLoading,  setInitialLoading]  = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const email = user?.email ?? "";

  const initials = useMemo(() => {
    const source = fullName.trim() || email;
    return source.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "NG";
  }, [email, fullName]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res  = await fetch(`${API_URL}/profiles/`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setFullName(data.full_name   || "");
        setPhone(data.phone          || "");
        setDistrict(data.district    || "");
        setAvatarUrl(data.avatar_url || "");
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setInitialLoading(false);
      }
    })();
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
      const res  = await fetch(`${API_URL}/profiles/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.profile.avatar_url || "");
      toast({ title: "Photo updated" });
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
      const res  = await fetch(`${API_URL}/profiles/avatar`, {
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
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/profiles/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ full_name: fullName, phone, district }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setChangingPw(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Password updated" });
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message });
    } finally {
      setChangingPw(false);
    }
  };

  if (loading || initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <img src={logo} className="h-12 w-12 animate-pulse" />
      </div>
    );
  }
  if (!user) return null;

  const regions  = ["Northern", "Central", "Southern"] as const;
  const pwPassed = PW_RULES.filter(r => r(newPw)).length;

  return (
    <div className="min-h-screen bg-background">

      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container max-w-4xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <LayoutDashboard className="h-4 w-4" />
            </Button>
            <img src={logo} className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-sm">NthakaGuide Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold mb-6">My Profile</h1>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

            {/* LEFT */}
            <div className="space-y-4">
              <Card>
                <CardContent className="flex flex-col items-center p-6 text-center gap-3">
                  <AvatarUpload
                    avatarUrl={avatarUrl}
                    initials={initials}
                    name={fullName || "Admin User"}
                    onUpload={handleAvatarUpload}
                    onRemove={handleAvatarRemove}
                    uploading={uploadingAvatar}
                  />

                  <p className="text-[11px] text-muted-foreground -mt-1">
                    {avatarUrl ? "Click photo to view full size · hover to change" : "Hover to add a photo · max 2 MB"}
                  </p>

                  <h2 className="font-bold">{fullName || "Admin User"}</h2>
                  <p className="text-sm text-muted-foreground">{email}</p>

                  <div className="flex items-center gap-1 text-xs text-primary">
                    <ShieldCheck className="h-3 w-3" /> System Administrator
                  </div>

                  {district && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {district}
                    </p>
                  )}
                  {phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {phone}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT */}
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
                <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <PasswordField id="old" label="Current Password" value={oldPw} onChange={setOldPw} />
                    <PasswordField id="new" label="New Password" value={newPw} onChange={setNewPw} />
                    <PasswordField id="confirm" label="Confirm Password" value={confirmPw} onChange={setConfirmPw} />
                    <p className="text-xs">{STRENGTH_LABELS[pwPassed - 1] || "Very weak"}</p>
                    <Button disabled={changingPw}>
                      <Lock className="mr-2 h-4 w-4" /> Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}