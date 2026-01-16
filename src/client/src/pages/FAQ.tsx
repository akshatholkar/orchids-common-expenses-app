import { MobileLayout } from "@/components/layout/MobileLayout";
import { useLocation } from "wouter";
import { ArrowLeft, ChevronRight, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

export default function FAQ() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const faqs = [
    {
      question: "How are common expenses calculated?",
      answer: "Expenses are distributed based on the millesimal percentage (share) assigned to each apartment as defined in the building's official regulations."
    },
    {
      question: "When is the payment due?",
      answer: "Statements are usually issued on the 1st of each month and are due by the 15th of the same month."
    },
    {
      question: "How can I pay my bill?",
      answer: "You can pay via bank transfer to the building's account or through our integrated payment portal (if enabled for your building)."
    },
    {
      question: "What should I do in case of an emergency?",
      answer: "For building emergencies (elevator trap, water leak), please use the contact numbers provided in the 'Support Contact' section."
    }
  ];

  return (
    <MobileLayout>
      <div className="p-6 pb-24 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setLocation("/help-support")}>
            <ArrowLeft className="h-6 w-6 text-slate-900" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">FAQs</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-bold text-slate-900 flex items-start gap-2">
                    <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    {faq.question}
                  </h3>
                  <p className="text-sm text-muted-foreground ml-7">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
