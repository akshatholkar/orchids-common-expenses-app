import { MobileLayout } from "@/components/layout/MobileLayout";
import { useLocation } from "wouter";
import { ArrowLeft, User, Mail, Phone, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";

export default function PersonalInformation() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    setIsManager(userRole === "manager");
  }, []);

  return (
    <MobileLayout>
      <div className="p-6 pb-24 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setLocation("/profile")}>
            <ArrowLeft className="h-6 w-6 text-slate-900" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">{t("personal_information")}</h2>
        </div>

        <div className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-semibold">Alex Dimitrou</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-semibold">alex.d@example.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-semibold">+30 690 000 0000</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <MapPin className="h-5 w-5" />
                </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-semibold">{isManager ? "Pallade Building A" : "Pallade Building A, Apt B4"}</p>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
