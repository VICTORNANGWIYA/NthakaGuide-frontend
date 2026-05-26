// src/pages/admin/dialogs.tsx
// Modal dialogs used in the Users tab.

import { useState } from "react";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast }    from "@/hooks/use-toast";
import { adminAction } from "./hooks";

// ── Reset Password ────────────────────────────────────────────────────────────
interface ResetPasswordDialogProps {
  userId:    string;
  userEmail: string;
  token:     string;
  open:      boolean;
  onClose:   () => void;
  onDone:    () => void;
}

export function ResetPasswordDialog({
  userId, userEmail, token, open, onClose, onDone,
}: ResetPasswordDialogProps) {
  const [pw,   setPw]   = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const handleReset = async () => {
    setBusy(true);
    const { ok, data } = await adminAction(token, "PUT", `/admin/users/${userId}/reset-password`, { new_password: pw });
    setBusy(false);
    if (ok) {
      toast({ title: "Password reset", description: data.message });
      onDone();
      onClose();
    } else {
      toast({ title: "Error", description: data.error, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for <strong>{userEmail}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>New Password</Label>
          <Input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="Min 8 chars, upper+lower+digit+special"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleReset} disabled={busy || pw.length < 8}>
            {busy ? "Resetting…" : "Reset Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Generic Confirm ───────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open:         boolean;
  title:        string;
  description:  string;
  confirmLabel: string;
  variant?:     "destructive" | "default";
  onConfirm:    () => void;
  onClose:      () => void;
}

export function ConfirmDialog({
  open, title, description, confirmLabel, variant, onConfirm, onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={variant ?? "default"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
