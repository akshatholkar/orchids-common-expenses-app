import { MobileLayout } from "@/components/layout/MobileLayout";
import { useLocation } from "wouter";
import { ArrowLeft, Globe, Moon, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AppSettings() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  return (
    <MobileLayout>
      <div className="p-6 pb-24 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setLocation("/profile")}>
            <ArrowLeft className="h-6 w-6 text-slate-900" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">{t("app_settings")}</h2>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Moon className="h-4 w-4" />
                </div>
                <Label className="text-base font-semibold">Dark Mode</Label>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                  <Smartphone className="h-4 w-4" />
                </div>
                <Label className="text-base font-semibold">Push Notifications</Label>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
