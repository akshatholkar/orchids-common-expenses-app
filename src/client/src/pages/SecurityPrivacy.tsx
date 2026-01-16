import { MobileLayout } from "@/components/layout/MobileLayout";
import { useLocation } from "wouter";
import { ArrowLeft, Shield, Lock, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SecurityPrivacy() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  return (
    <MobileLayout>
      <div className="p-6 pb-24 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setLocation("/profile")}>
            <ArrowLeft className="h-6 w-6 text-slate-900" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">{t("security_privacy")}</h2>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground text-pretty">Secure your account with 2FA.</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Biometric Login</Label>
                <p className="text-sm text-muted-foreground text-pretty">Use FaceID or Fingerprint.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="pt-4 border-t border-slate-100">
              <button className="flex items-center gap-3 text-primary font-semibold">
                <Lock className="h-4 w-4" />
                Change Password
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
