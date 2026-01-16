import { useState } from "react";
import { useLocation } from "wouter";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Droplet, Zap, Wrench, Shield, ArrowUpRight, CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Expense } from "@shared/schema";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Expenses() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [payingExpenseId, setPayingExpenseId] = useState<string | null>(null);
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const { session } = useAuth();
  const { toast } = useToast();

  const { data: expenses, isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/protected/expenses"],
  });

  const payMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const response = await fetch("/api/protected/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ expenseId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: data.url } }, "*");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
      setPayingExpenseId(null);
    },
  });

  const handlePayNow = (expenseId: string) => {
    setPayingExpenseId(expenseId);
    payMutation.mutate(expenseId);
  };

  const categories = [
    { id: "all", label: t("all"), icon: null },
    { id: "utilities", label: t("utilities"), icon: Zap },
    { id: "maintenance", label: t("maintenance"), icon: Wrench },
    { id: "cleaning", label: t("cleaning"), icon: Droplet },
    { id: "insurance", label: t("insurance"), icon: Shield },
  ];

  const filteredExpenses = (expenses || []).filter(exp => 
    (activeCategory === "all" || exp.category === activeCategory) &&
    (exp.title.toLowerCase().includes(search.toLowerCase()) || exp.supplier?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <MobileLayout>
      <div className="p-6 pb-24 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">{t("expenses")}</h2>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
              <Filter className="h-4 w-4 text-slate-600" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("search_expenses")} 
            className="pl-10 bg-white border-slate-200 shadow-sm" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors
                ${activeCategory === cat.id 
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20" 
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}
              `}
            >
              {cat.icon && <cat.icon className="h-3.5 w-3.5" />}
              {cat.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
            <motion.div 
              key={expense.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center
                        ${expense.category === 'utilities' ? 'bg-blue-100 text-blue-600' :
                          expense.category === 'maintenance' ? 'bg-orange-100 text-orange-600' :
                          expense.category === 'cleaning' ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                        }
                      `}>
                         {expense.category === 'utilities' ? <Zap className="h-5 w-5"/> :
                          expense.category === 'maintenance' ? <Wrench className="h-5 w-5"/> :
                          expense.category === 'cleaning' ? <Droplet className="h-5 w-5"/> :
                          <Shield className="h-5 w-5"/>
                        }
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{expense.title}</h4>
                        <p className="text-xs text-muted-foreground">{expense.supplier}</p>
                      </div>
                    </div>
                      <div className="text-right">
                         <span className="font-bold block text-slate-900">€{Number(expense.amount).toFixed(2)}</span>
                         <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground border-slate-200">
                            {format(new Date(expense.dueDate), "MMM dd, yyyy")}
                         </Badge>
                      </div>

                  </div>
                  
<div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{expense.category}</span>
                      <div className="flex items-center gap-2">
                          {expense.status === "paid" ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {t("paid")}
                            </Badge>
                          ) : (
                            <>
                              <Badge variant="outline" className="text-orange-700 bg-orange-50 border-orange-200 flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {t("pending")}
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => handlePayNow(expense.id)}
                                disabled={payingExpenseId === expense.id}
                                className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
                              >
                                {payingExpenseId === expense.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Pay Now
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        <button className="text-xs font-semibold text-primary flex items-center gap-1">
                          {t("view_invoice")} <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
