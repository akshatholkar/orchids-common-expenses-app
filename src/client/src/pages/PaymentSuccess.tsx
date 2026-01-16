import { useEffect } from "react";
import { useLocation } from "wouter";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();

  return (
    <MobileLayout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="border-none shadow-xl">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </motion.div>
              
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Payment Successful!
              </h1>
              
              <p className="text-slate-600 mb-8">
                Your payment has been processed successfully. You will receive a confirmation notification shortly.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/expenses")}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  View Expenses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="w-full"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
