import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, Download, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Statements() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  return (
    <MobileLayout>
      <div className="p-6 pb-24 space-y-6">
        <div className="flex items-center gap-4 mb-4 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="h-6 w-6 text-slate-900" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">{t("statements")}</h2>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="space-y-4">
          {[
            { month: t("december") + " 2024", date: "Dec 1 - Dec 31", amount: "€124.50", status: t("paid") },
            { month: t("november") + " 2024", date: "Nov 1 - Nov 30", amount: "€98.75", status: t("paid") },
            { month: t("october") + " 2024", date: "Oct 1 - Oct 31", amount: "€156.20", status: t("paid") },
            { month: t("september") + " 2024", date: "Sep 1 - Sep 30", amount: "€112.00", status: t("paid") },
            { month: t("august") + " 2024", date: "Aug 1 - Aug 31", amount: "€145.50", status: t("paid") },
          ].map((statement, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{statement.month}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {statement.date}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900">{statement.amount}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {statement.status}
                  </span>
                  <button className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
                    <Download className="h-4 w-4" />
                    PDF
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
