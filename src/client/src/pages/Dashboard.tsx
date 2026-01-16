import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, Wallet, Building2, Bell, FileText, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { User, Expense } from "@shared/schema";
import { format } from "date-fns";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/protected/profile"],
  });

  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ["/api/protected/expenses"],
  });

  const { data: buildings } = useQuery<any[]>({
    queryKey: ["/api/protected/buildings"],
    enabled: user?.role === "manager",
  });

  const role = user?.role || "resident";

  const recentExpenses = expenses?.slice(0, 3) || [];
  const dueAmount = expenses?.filter(e => e.status === "pending").reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const nextDueDate = expenses?.filter(e => e.status === "pending").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <MobileLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">{t("welcome_back")}</p>
              <h2 className="text-2xl font-bold text-slate-900">{user?.fullName || "Guest"}</h2>
            </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button 
              onClick={() => setLocation("/notifications")}
              className="relative cursor-pointer"
            >
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                <Bell className="h-5 w-5" />
              </div>
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </div>

        {/* Building Info Card */}
        <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="mb-6">
                <Card className="bg-primary text-white border-none shadow-xl shadow-primary/20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Building2 className="w-32 h-32" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-primary-foreground/80 text-sm font-medium mb-1">
                                  {role === "manager" ? "Total Buildings" : t("your_property")}
                                </p>
                                  <h3 className="text-xl font-bold">
                                    {role === "manager" 
                                      ? `${buildings?.length || 0} ${t("managing_buildings")}` 
                                      : t("pallade_building")}
                                  </h3>
                                  <p className="text-sm opacity-80">
                                    {role === "manager" 
                                      ? "Athens Metropolitan Area" 
                                      : `${t("apt")} B4 • ${t("floor")} 2`}
                                  </p>
                              </div>
                          </div>
                          <div className="pt-4 border-t border-white/20 flex gap-8">
                              <div>
                                  <p className="text-xs opacity-70 mb-1">{t("due_amount")}</p>
                                  <p className="text-2xl font-bold">€{dueAmount.toFixed(2)}</p>
                              </div>
                              <div>
                                  <p className="text-xs opacity-70 mb-1">{t("due_date")}</p>
                                  <p className="text-lg font-medium mt-1">
                                    {nextDueDate ? format(new Date(nextDueDate), "MMM dd") : "N/A"}
                                  </p>
                              </div>
                          </div>

                    </CardContent>
                </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={item} className="grid grid-cols-2 gap-4 mb-6">
                 {role === "manager" ? (
                   <>
                    <button onClick={() => setLocation("/building-management")} className="cursor-pointer">
                      <Card className="border-none shadow-sm bg-blue-50/50 hover:bg-blue-50 transition-colors h-full">
                          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-1">
                                  <Building2 className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-medium text-slate-700">Manage Building</span>
                          </CardContent>
                      </Card>
                    </button>
                    <button onClick={() => setLocation("/expenses")} className="cursor-pointer">
                      <Card className="border-none shadow-sm bg-purple-50/50 hover:bg-purple-50 transition-colors h-full">
                          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-1">
                                  <FileText className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-medium text-slate-700">All Expenses</span>
                          </CardContent>
                      </Card>
                    </button>
                   </>
                 ) : (
                   <>
                    <button onClick={() => setLocation("/statements")} className="cursor-pointer">
                      <Card className="border-none shadow-sm bg-green-50/50 hover:bg-green-50 transition-colors h-full">
                          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-1">
                                  <FileText className="h-5 w-5" />
                              </div>
                              <span className="text-sm font-medium text-slate-700">{t("statements")}</span>
                          </CardContent>
                      </Card>
                    </button>
                    <button onClick={() => setLocation("/history")} className="cursor-pointer">
                      <Card className="border-none shadow-sm bg-orange-50/50 hover:bg-orange-50 transition-colors h-full">
                          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                               <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-1">
                              <Wallet className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{t("history")}</span>
                      </CardContent>
                   </Card>
                 </button>
                   </>
                 )}
            </motion.div>

            {/* Recent Expenses */}
            <motion.div variants={item} className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{t("recent_expenses")}</h3>
                    <Button variant="ghost" className="text-primary text-sm h-auto p-0 hover:bg-transparent">{t("see_all")}</Button>
                </div>

                  <div className="space-y-3">
                      {recentExpenses.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">{t("no_expenses")}</p>
                      )}
                      {recentExpenses.map((expense) => (
                          <Card key={expense.id} className="border-none shadow-sm">
                              <CardContent className="p-4 flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                      <Building2 className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                      <h4 className="font-semibold text-sm">{expense.title}</h4>
                                      <p className="text-xs text-muted-foreground">{expense.category} • {format(new Date(expense.createdAt || new Date()), "MMM dd")}</p>
                                  </div>
                                  <span className="font-bold text-slate-900">€{Number(expense.amount).toFixed(2)}</span>
                              </CardContent>
                          </Card>
                      ))}
                  </div>

            </motion.div>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
