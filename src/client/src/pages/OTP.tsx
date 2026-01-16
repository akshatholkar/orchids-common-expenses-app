import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { apiRequest } from "@/lib/queryClient";

export default function OTP() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const phone = localStorage.getItem("loginPhone") || "";

  const maskPhone = (num: string) => {
    if (!num) return "";
    return num.replace(/(\+\d{2,3})(\d+)(\d{4})/, "$1 **** $3");
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pastedData = value.split("").slice(0, 6);
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedData.length, 5);
      document.getElementById(`otp-${nextIndex}`)?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6 || !phone) return;

    setIsLoading(true);
    
    try {
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        phone,
        token: otpValue,
        type: "sms",
      });

      if (error) throw error;

        if (session) {
          await apiRequest("POST", "/api/users/sync", {
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.user_metadata.full_name || "New User",
            phone: session.user.phone,
          });

        toast({
          title: "Verified!",
          description: "Your phone number has been verified via SMS.",
        });
        setLocation("/dashboard");
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

  const handleResend = async () => {
    if (timer > 0 || !phone) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });
      
      if (error) throw error;

      setTimer(30);
      toast({
        title: "OTP Resent",
        description: "A new code has been sent to your phone via SMS.",
      });
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
      <div className="min-h-screen w-full flex flex-col p-6 bg-gradient-to-b from-primary/10 to-background">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mb-8" 
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col gap-2 mb-8"
        >
          <h1 className="text-3xl font-bold text-primary">{t("verify_phone")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("otp_sent_to")} {maskPhone(phone)}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full"
        >
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleVerify} className="space-y-8">
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="flex-1 aspect-square max-w-[48px] text-center text-xl font-bold p-0"
                      required
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <Button type="submit" className="w-full h-12 text-md font-medium" disabled={isLoading || otp.join("").length < 6}>
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      t("verify")
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={timer > 0}
                      className={`text-sm font-medium ${timer > 0 ? "text-muted-foreground" : "text-primary hover:underline"}`}
                    >
                      {timer > 0 ? `${t("resend_in")} ${timer}s` : t("resend_code")}
                    </button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
