import { MobileLayout } from "@/components/layout/MobileLayout";
import { useLocation } from "wouter";
import { ArrowLeft, MessageCircle, FileQuestion, PhoneCall, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HelpSupport() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  return (
    <MobileLayout>
      <div className="p-6 pb-24 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setLocation("/profile")}>
            <ArrowLeft className="h-6 w-6 text-slate-900" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">{t("help_support")}</h2>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
             <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">General</h4>
             <Card className="border-none shadow-sm">
               <CardContent className="p-0 divide-y divide-slate-100">
                 <button 
                   onClick={() => setLocation("/faq")}
                   className="w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
                 >
                   <FileQuestion className="h-5 w-5 text-primary" />
                   <span className="font-medium text-slate-700">FAQs</span>
                 </button>
               </CardContent>
             </Card>
          </div>

          <div className="space-y-3">
             <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider ml-1">Support Contact</h4>
             <Card className="border-none shadow-sm overflow-hidden">
               <CardContent className="p-0 divide-y divide-slate-100">
                 <div className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone Number</p>
                      <a href="tel:+302100000000" className="font-semibold text-slate-900">+30 210 000 0000</a>
                    </div>
                 </div>
                 <div className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email Address</p>
                      <a href="mailto:support@cpcare.com" className="font-semibold text-slate-900">support@cpcare.com</a>
                    </div>
                 </div>
               </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
