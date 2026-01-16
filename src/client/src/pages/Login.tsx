import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import logoUrl from "@assets/logo.png";

import { supabase } from "@/lib/supabase";

const COUNTRY_CODES = [
  { code: "+30", label: "+30" },
  { code: "+357", label: "+357" },
  { code: "+91", label: "+91" },
  { code: "+1", label: "+1" },
  { code: "+44", label: "+44" },
  { code: "+49", label: "+49" },
  { code: "+33", label: "+33" },
  { code: "+39", label: "+39" },
  { code: "+34", label: "+34" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState("resident");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+30");
  const [email, setEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (role === "manager" && email) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("email", email)
          .single();

        if (userError || !userData) {
          throw new Error("You are not registered. Please contact the administrator.");
        }

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
          }
        });
        if (error) throw error;
        toast({
          title: t("otp_sent"),
          description: t("check_email"),
        });
      } else {
        const cleanPhone = phone.replace(/\D/g, '').replace(/^0+/, '');
        const formattedPhone = `${countryCode}${cleanPhone}`;
        
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("phone", formattedPhone)
          .single();

        if (userError || !userData) {
          throw new Error("Your phone number is not registered. Please contact your building manager.");
        }

        console.log("Attempting SMS OTP for:", formattedPhone);

        const { error } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });
        
        if (error) {
          console.error("Supabase Auth Error:", error);
          if (error.message.toLowerCase().includes("unsupported phone provider")) {
            toast({
              title: "Configuration Error",
              description: "SMS authentication requires Twilio to be configured as the 'Phone' provider in your Supabase Dashboard.",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        localStorage.setItem("loginPhone", formattedPhone);
        setLocation("/otp");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout hideNav>
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-primary/10 to-background relative">
        
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center gap-6 mb-8"
        >
          <div className="relative w-48 h-48 flex items-center justify-center">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain scale-110" />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full"
        >
          <Tabs defaultValue="resident" className="w-full mb-6" onValueChange={(val) => setRole(val)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resident">{t("resident")}</TabsTrigger>
              <TabsTrigger value="manager">{t("manager")}</TabsTrigger>
            </TabsList>
            
            <div className="mt-6 space-y-4">
              <Card className="border-none shadow-lg">
                <CardContent className="pt-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("phone_number")}</Label>
                      <div className="flex gap-2">
                        <div className="w-[100px]">
                          <Select value={countryCode} onValueChange={setCountryCode}>
                            <SelectTrigger>
                              <SelectValue placeholder="+30" />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRY_CODES.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input 
                          id="phone" 
                          placeholder="69XXXXXXXX" 
                          type="tel" 
                          required={role !== "manager" || !email}
                          className="flex-1"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    {role === "manager" && (
                      <div className="space-y-2">
                        <div className="relative flex py-2 items-center">
                          <div className="flex-grow border-t border-gray-200"></div>
                          <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">{t("or")}</span>
                          <div className="flex-grow border-t border-gray-200"></div>
                        </div>
                        <Label htmlFor="email">{t("email_address")}</Label>
                        <Input 
                          id="email" 
                          placeholder="manager@example.com" 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full h-12 text-md font-medium" disabled={isLoading}>
                      {isLoading ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        t("continue")
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {t("terms_privacy")}
                </p>
              </div>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
