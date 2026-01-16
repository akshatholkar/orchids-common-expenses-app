"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle, XCircle, Clock, Loader2, ArrowLeft, Star, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";

interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodEnd: string | null;
}

interface PaymentFormProps {
  clientSecret: string;
  subscriptionId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ clientSecret, subscriptionId, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || t("payment_failed"));
      setIsProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || t("payment_failed"));
      setIsProcessing(false);
      return;
    }

    const userId = localStorage.getItem("userId") || "demo-manager-user";
    await fetch("/api/subscription/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ subscriptionId }),
    });

    setPaymentSuccess(true);
    setTimeout(() => {
      onSuccess();
    }, 1500);
  };

  if (paymentSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center"
        >
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </motion.div>
        <h3 className="text-xl font-bold text-slate-900">{t("payment_successful")}</h3>
        <p className="text-slate-500 text-center px-4">Your account is being upgraded. Please wait...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-1 rounded-xl bg-slate-50 border border-slate-100">
        <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          <PaymentElement />
        </div>
      </div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2"
        >
          <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </motion.div>
      )}

      <div className="flex flex-col gap-3 pt-2">
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-amber-500/20 rounded-xl"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t("processing_payment")}</span>
            </div>
          ) : (
            <span>{t("purchase_subscription")}</span>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full h-10 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          onClick={onCancel}
          disabled={isProcessing}
        >
          {t("cancel_subscription")}
        </Button>
      </div>
      
      <p className="text-[10px] text-center text-slate-400 px-8">
        Secure payment processed by Stripe. Your billing information is never stored on our servers.
      </p>
    </form>
  );
}

export function SubscriptionSection() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<string>("loading");
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const userId = localStorage.getItem("userId") || "demo-manager-user";

  useEffect(() => {
    fetch("/api/stripe/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      });
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const res = await fetch("/api/subscription/status", {
        headers: { "x-user-id": userId },
      });
      const data = await res.json();
      setStatus(data.status);
      setSubscription(data.subscription);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [userId]);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscription/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setSubscriptionId(data.subscriptionId);
        setShowPayment(true);
      }
    } catch (err) {
      console.error("Error creating payment intent:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setClientSecret(null);
    setSubscriptionId(null);
    fetchSubscriptionStatus();
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setClientSecret(null);
    setSubscriptionId(null);
  };

  const getStatusIcon = () => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "expired":
      case "canceled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "expired":
      case "canceled":
        return "bg-red-50 text-red-700 border-red-100";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const features = [
    { icon: <Zap className="h-4 w-4 text-amber-500" />, text: t("feature_automated_expenses") },
    { icon: <CheckCircle className="h-4 w-4 text-amber-500" />, text: t("feature_monthly_statements") },
    { icon: <ShieldCheck className="h-4 w-4 text-amber-500" />, text: t("feature_tenant_portal") },
    { icon: <Star className="h-4 w-4 text-amber-500" />, text: t("feature_priority_support") },
    { icon: <Sparkles className="h-4 w-4 text-amber-500" />, text: t("feature_ai_scanning") },
  ];

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
        <p className="text-slate-500 text-sm animate-pulse">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <AnimatePresence mode="wait">
        {!showPayment ? (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Header section */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">{t("subscription")}</h2>
              <p className="text-slate-500">{t("subscription_features")}</p>
            </div>

            {/* Current Status Card */}
            <Card className="border border-slate-100 shadow-sm overflow-hidden bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <CreditCard className="h-5 w-5 text-slate-600" />
                    </div>
                    <CardTitle className="text-base">{t("subscription_status")}</CardTitle>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${getStatusColor()}`}>
                    {getStatusIcon()}
                    <span>{status === "active" ? t("active") : status === "expired" ? t("expired") : status === "canceled" ? t("canceled") : t("no_subscription")}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {status === "active" && subscription?.currentPeriodEnd ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{t("valid_until")}</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4 text-center space-y-3">
                    <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                      <CreditCard className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 max-w-[200px]">
                      {t("subscription_description")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing / CTA Card */}
            <Card className="border-2 border-amber-500/20 shadow-xl shadow-amber-500/5 overflow-hidden bg-gradient-to-b from-white to-amber-50/30 rounded-3xl relative">
              <div className="absolute top-0 right-0 p-3">
                <div className="bg-amber-100 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter border border-amber-200">
                  Best Value
                </div>
              </div>
              <CardHeader className="pb-2 text-center pt-8">
                <CardTitle className="text-4xl font-black text-slate-900 tracking-tight">
                  {t("subscription_price")}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {status === "active" ? "You're already on the Premium plan" : "Upgrade to the Premium plan"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="px-6 py-6">
                <div className="space-y-3.5">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                        {feature.icon}
                      </div>
                      <span className="text-sm text-slate-600 font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="px-6 pb-8 pt-2">
                <Button
                  onClick={handlePurchase}
                  disabled={isLoading || status === "active"}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-amber-500/30 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    status === "active" ? t("active") : status === "expired" || status === "canceled" ? t("renew_subscription") : t("purchase_subscription")
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePaymentCancel}
                className="rounded-full hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-bold text-slate-900">Complete Purchase</h2>
            </div>

            <Card className="border border-slate-100 shadow-xl bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">Manager Subscription</CardTitle>
                    <CardDescription>Monthly plan</CardDescription>
                  </div>
                  <div className="text-xl font-black text-slate-900">€29.99</div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                {stripePromise && clientSecret && subscriptionId && (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "#f59e0b",
                          borderRadius: "12px",
                          colorBackground: "#ffffff",
                          colorText: "#1e293b",
                          colorDanger: "#ef4444",
                          fontFamily: 'Inter, system-ui, sans-serif',
                          spacingUnit: '4px',
                        },
                        rules: {
                          '.Input': {
                            border: '1px solid #e2e8f0',
                            boxShadow: 'none',
                          },
                          '.Input:focus': {
                            border: '1px solid #f59e0b',
                          },
                          '.Label': {
                            color: '#64748b',
                            fontWeight: '500',
                          }
                        }
                      },
                    }}
                  >
                    <PaymentForm
                      clientSecret={clientSecret}
                      subscriptionId={subscriptionId}
                      onSuccess={handlePaymentSuccess}
                      onCancel={handlePaymentCancel}
                    />
                  </Elements>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
