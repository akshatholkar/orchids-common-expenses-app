import { MobileLayout } from "@/components/layout/MobileLayout";
import { useLocation } from "wouter";
import { ArrowLeft, Bell, Calendar, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/protected/notifications"],
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "alert": return Bell;
      case "reminder": return Calendar;
      case "info": return Info;
      default: return CheckCircle2;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "alert": return "text-orange-600";
      case "reminder": return "text-blue-600";
      case "info": return "text-green-600";
      default: return "text-slate-600";
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case "alert": return "bg-orange-100";
      case "reminder": return "bg-blue-100";
      case "info": return "bg-green-100";
      default: return "bg-slate-100";
    }
  };

  return (
    <MobileLayout>
      <div className="p-6 pb-24">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-6 w-6 text-slate-900" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">{t("notifications")}</h2>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification, i) => {
              const Icon = getIcon(notification.type);
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={`border-none shadow-sm overflow-hidden ${notification.isRead ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4 flex gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${getBg(notification.type)} ${getColor(notification.type)}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-slate-900 leading-tight">{notification.title}</h3>
                          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap uppercase tracking-wider">
                            {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-snug">{notification.message}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
