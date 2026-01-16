import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function History() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const transactions = [
    { title: t("elevator_maintenance"), date: "Dec 28", amount: "€45.00", category: t("maintenance"), type: "debit" },
    { title: t("cleaning_service"), date: "Dec 26", amount: "€120.00", category: "Services", type: "debit" },
    { title: "Common Electricity", date: "Dec 24", amount: "€85.30", category: t("utilities"), type: "debit" },
    { title: t("water_supply"), date: "Dec 20", amount: "€32.50", category: t("utilities"), type: "debit" },
    { title: "Fire Extinguisher Check", date: "Dec 15", amount: "€60.00", category: t("maintenance"), type: "debit" },
    { title: "Gardening Service", date: "Dec 10", amount: "€50.00", category: "Services", type: "debit" },
    { title: "Building Insurance", date: "Dec 01", amount: "€200.00", category: t("insurance"), type: "debit" },
    { title: t("nov_statement"), date: "Nov 30", amount: "€98.75", category: "Payment", type: "credit" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <MobileLayout>
      <div className="p-6 pb-24 space-y-6">
        <div className="flex items-center gap-4 mb-4 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/dashboard")}>
              <ArrowLeft className="h-6 w-6 text-slate-900" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">{t("history")}</h2>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none shadow-sm bg-red-50/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("total_expenses")}</p>
              <p className="text-2xl font-bold text-red-600">€692.80</p>
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {t("past_30_days")}
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-blue-50/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("your_share")}</p>
              <p className="text-2xl font-bold text-blue-600">€156.20</p>
              <p className="text-xs text-blue-500 mt-2">{t("based_on")} 22.5%</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-slate-900">{t("transactions")}</h3>
          <motion.div className="space-y-2" variants={container} initial="hidden" animate="show">
            {transactions.map((tx, i) => (
              <motion.div key={i} variants={item}>
                <Card className="border-none shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 flex-1">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          tx.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tx.type === 'credit' ? '+' : '-'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{tx.title}</h4>
                          <p className="text-xs text-muted-foreground">{tx.category} • {tx.date}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-900'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </MobileLayout>
  );
}
