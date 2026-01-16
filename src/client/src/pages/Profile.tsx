import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Settings, HelpCircle, LogOut, ChevronRight, User as UserIcon, Bell, Shield, CreditCard, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SubscriptionSection } from "@/components/SubscriptionSection";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const [view, setView] = useState<"profile" | "subscription">("profile");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/protected/profile"],
  });

  const isManager = user?.role === "manager";

  const handleLogout = async () => {
    await signOut();
    setLocation("/");
  };

  if (view === "subscription") {
    return (
      <MobileLayout>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => setView("profile")}
              className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">{t("subscription")}</h2>
          </div>
          
          <SubscriptionSection />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">{t("profile")}</h2>
          <LanguageSwitcher />
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Alex Dimitrou</h3>
            {!isManager && <p className="text-sm text-muted-foreground">{t("owner")} • Apt B4</p>}
          </div>
        </div>

        {/* Settings Groups */}
        <div className="space-y-6">
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">Account</h4>
                <Card className="border-none shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        <button 
                            onClick={() => setLocation("/personal-information")}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <UserIcon className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-slate-700">{t("personal_information")}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                        </button>

                        {/* Subscription Tab for Managers */}
                        {isManager && (
                          <button 
                              onClick={() => setView("subscription")}
                              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left border-t border-slate-100"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                                      <CreditCard className="h-4 w-4" />
                                  </div>
                                  <span className="font-medium text-slate-700">{t("subscription")}</span>
                              </div>
                              <ChevronRight className="h-4 w-4 text-slate-300" />
                          </button>
                        )}

                         <button 
                            onClick={() => setLocation("/notifications")}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                         >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Bell className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-slate-700">{t("notifications")}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                        </button>
                         <button 
                            onClick={() => setLocation("/security-privacy")}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                         >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-slate-700">{t("security_privacy")}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                        </button>
                    </div>
                </Card>
            </div>

             <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">Support</h4>
                <Card className="border-none shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-100">
                         <button 
                            onClick={() => setLocation("/app-settings")}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                         >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Settings className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-slate-700">{t("app_settings")}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                        </button>
                        <button 
                            onClick={() => setLocation("/help-support")}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                    <HelpCircle className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-slate-700">{t("help_support")}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300" />
                        </button>
                    </div>
                </Card>
            </div>
        </div>

        <Button 
            variant="destructive" 
            className="w-full h-12 rounded-xl mt-8 shadow-lg shadow-red-500/20"
            onClick={handleLogout}
        >
            <LogOut className="h-4 w-4 mr-2" />
            {t("log_out")}
        </Button>
      </div>
    </MobileLayout>
  );
}
