"use client";

import { useEffect, useMemo, useState } from "react";
import { IconEye, IconEyeOff, IconLock } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { updateSharePassword } from "@/http/endpoints";

interface ShareSecurityModalProps {
  shareId: string | null;
  share: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ShareSecurityModal({ shareId, share, onClose, onSuccess }: ShareSecurityModalProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  // 🔒 Always require a password; no toggle.
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Clear password when share changes (don’t surface existing secret)
  useEffect(() => {
    setPassword("");
  }, [share]);

  // You can strengthen this to your policy (length, charset, etc.)
  const isPasswordValid = useMemo(() => password.trim().length >= 8, [password]);
  const savingLabel = share?.security?.hasPassword ? t("common.updating") : t("common.saving");
  const ctaLabel = share?.security?.hasPassword ? t("common.update") : t("common.save");

  const handleSave = async () => {
    if (!shareId) return;
    if (!isPasswordValid) {
      toast.error(t("shareSecurity.validation.passwordTooShort")); // ensure the message aligns with >= 8 policy
      return;
    }

    setIsLoading(true);
    try {
      await updateSharePassword(shareId, {
        password, // 🚫 never null
      });

      const successMessage = share?.security?.hasPassword
        ? t("shareSecurity.success.passwordUpdated")
        : t("shareSecurity.success.passwordSet");

      toast.success(successMessage);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to update share security:", error);
      toast.error(t("shareSecurity.error.updateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={!!shareId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("shareSecurity.title")}</DialogTitle>
          {/* 🔒 Clarify policy: passwords are mandatory */}
          <DialogDescription>
            {t("shareSecurity.subtitle")} — {t("shareSecurity.info.requiredByPolicy")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">{t("shareSecurity.currentStatus")}</h3>
            <div className="flex gap-2">
              <Badge
                variant="secondary"
                className="bg-yellow-500/20 text-yellow-800 border-yellow-300 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20"
              >
                <IconLock className="h-3 w-3 mr-1" />
                {t("shareDetails.passwordProtected")}
              </Badge>
            </div>
          </div>

          {/* 🔒 Required password section (no switch) */}
          <div className="space-y-4">
            {share?.security?.hasPassword && (
              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">{t("shareSecurity.existingPasswordMessage")}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">
                {share?.security?.hasPassword ? t("shareSecurity.newPassword") : t("shareSecurity.password")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("shareSecurity.passwordPlaceholder")}
                  className="pr-10"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? (
                    <IconEyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  ) : (
                    <IconEye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  )}
                </Button>
              </div>
              {/* inline helper / error */}
              {!isPasswordValid && password.length > 0 && (
                <p className="text-xs text-red-600">
                  {t("shareSecurity.validation.passwordTooShort")} {/* align with >= 8 rule */}
                </p>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>{t("shareSecurity.passwordRequirements.title")}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t("shareSecurity.passwordRequirements.minLengthStrong", { min: 8 })}</li>
                {/* add more bullets via i18n as needed: uppercase, digit, special char, etc. */}
              </ul>
            </div>
          </div>

          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <p className="font-medium text-muted-foreground">{t("shareSecurity.info.title")}</p>
              <p className="text-muted-foreground">
                {t("shareSecurity.info.withPassword")} {/* this branch is now always true */}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !isPasswordValid}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader size="sm" />
                {savingLabel}
              </div>
            ) : (
              ctaLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
