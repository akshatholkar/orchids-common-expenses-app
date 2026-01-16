import { useState } from "react";
import { useLocation } from "wouter";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, Sparkles, Check, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Apartment, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function NewExpense() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [selectedApartment, setSelectedApartment] = useState("common");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/protected/profile"],
  });

  const { data: apartments } = useQuery<Apartment[]>({
    queryKey: ["/api/protected/apartments"],
    enabled: user?.role === "manager",
  });
    
  const userRole = user?.role || "resident";
    
  const payerOptions = [
    { id: "common", label: t("common_expense"), value: "common" },
    ...(apartments || []).map(apt => ({
      id: apt.id,
      label: `${t("apt")} ${apt.number} - ${apt.ownerName}`,
      value: apt.id
    }))
  ];

  const mutation = useMutation({
    mutationFn: async (newExpense: any) => {
      const res = await apiRequest("POST", "/api/protected/expenses", newExpense);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/expenses"] });
      toast({
        title: t("expense_recorded"),
        description: t("expense_allocated"),
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate AI Scan
    setTimeout(() => {
      setIsScanning(false);
      const now = new Date();
      setScannedData({
        supplier: "TechnoFix Ltd.",
        amount: "145.00",
        category: "maintenance",
        date: "2024-12-30",
        time: now.toTimeString().slice(0, 5)
      });
      toast({
        title: t("scan_complete"),
        description: t("ai_will_extract"),
      });
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      title: formData.get("supplier") as string,
      supplier: formData.get("supplier") as string,
      amount: formData.get("amount") as string,
      dueDate: new Date(formData.get("date") as string).toISOString(),
      category: formData.get("category") || scannedData?.category || "other",
      description: formData.get("notes") as string,
      apartmentId: selectedApartment === "common" ? null : selectedApartment,
      status: "pending",
    };
    mutation.mutate(data);
  };

  return (
    <MobileLayout>
      <div className="p-6 pb-24 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">{t("add_expense")}</h2>
          <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Scan Card */}
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5 overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-4 py-10">
            {isScanning ? (
               <div className="flex flex-col items-center gap-2">
                 <div className="relative">
                   <div className="absolute inset-0 bg-primary/20 animate-ping rounded-full"></div>
                   <Sparkles className="h-10 w-10 text-primary animate-pulse relative z-10" />
                 </div>
                 <p className="text-sm font-medium text-primary">{t("analyzing")}</p>
               </div>
            ) : scannedData ? (
                <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <Check className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-green-700">{t("scan_complete")}</p>
                    <Button variant="outline" size="sm" onClick={() => setScannedData(null)} className="mt-2">{t("scan_again")}</Button>
                </div>
            ) : (
                <>
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-md mb-2">
                        <Camera className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-semibold text-primary">{t("scan_invoice")}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{t("ai_will_extract")}</p>
                    </div>
                    <div className="flex gap-2 w-full mt-2">
                         <Button className="flex-1" onClick={handleScan}>
                             <Camera className="h-4 w-4 mr-2" /> {t("camera")}
                         </Button>
                         <Button variant="outline" className="flex-1">
                             <Upload className="h-4 w-4 mr-2" /> {t("upload")}
                         </Button>
                    </div>
                </>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier">{t("supplier_name")}</Label>
            <Input id="supplier" defaultValue={scannedData?.supplier} placeholder="e.g. Electric Co." />
          </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="amount">{t("amount")}</Label>
                  <Input 
                    key={scannedData ? `amount-${scannedData.amount}` : 'amount-initial'}
                    id="amount" 
                    defaultValue={scannedData?.amount} 
                    placeholder="0.00" 
                    type="number" 
                    step="0.01" 
                    className="font-mono" 
                  />
               </div>
               <div className="space-y-2">
                  <Label htmlFor="date">{t("date")}</Label>
                  <Input 
                    key={scannedData ? `date-${scannedData.date}` : 'date-initial'}
                    id="date" 
                    defaultValue={scannedData?.date || currentDate} 
                    type="date" 
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="time">{t("time")}</Label>
                  <Input 
                    key={scannedData ? `time-${scannedData.time}` : 'time-initial'}
                    id="time" 
                    defaultValue={scannedData?.time || currentTime} 
                    type="time" 
                  />
               </div>
                 <div className="space-y-2">
                    <Label htmlFor="category">{t("category")}</Label>
                    <Select 
                      key={scannedData ? `cat-${scannedData.category}` : 'cat-initial'}
                      defaultValue={scannedData?.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("category")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utilities">{t("utilities")}</SelectItem>
                        <SelectItem value="maintenance">{t("maintenance")}</SelectItem>
                        <SelectItem value="cleaning">{t("cleaning")}</SelectItem>
                        <SelectItem value="insurance">{t("insurance")}</SelectItem>
                        <SelectItem value="other">{t("other")}</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
              </div>

            {userRole === "manager" && (
              <div className="space-y-2">
                <Label htmlFor="apartment">{t("apartment")}</Label>
                <Select value={selectedApartment} onValueChange={setSelectedApartment}>
                  <SelectTrigger id="apartment">
                    <SelectValue placeholder={t("select_apartment")} />
                  </SelectTrigger>
                  <SelectContent>
                    {payerOptions.map(option => (
                      <SelectItem key={option.id} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea id="notes" placeholder={t("additional_details")} className="h-24 resize-none" />
          </div>

          <Button type="submit" size="lg" className="w-full mt-4 text-lg font-semibold shadow-lg shadow-primary/25">
            {t("save_expense")}
          </Button>
        </form>
      </div>
    </MobileLayout>
  );
}
