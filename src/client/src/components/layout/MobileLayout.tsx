import React from "react";
import { useLocation, Link } from "wouter";
import { LayoutDashboard, Receipt, PlusCircle, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export function MobileLayout({ children, hideNav = false }: MobileLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
    { icon: Receipt, label: "Expenses", path: "/expenses" },
    { icon: PlusCircle, label: "Add", path: "/new-expense", highlight: true },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="h-screen w-full bg-slate-100 flex items-center justify-center p-0 md:p-8 overflow-hidden">
      {/* Mobile Frame (only visible on desktop to simulate phone) */}
      <div className="w-full h-full md:max-h-[844px] md:w-[390px] bg-background md:rounded-[3rem] md:border-[8px] md:border-slate-900 overflow-hidden relative shadow-2xl flex flex-col">
        
        {/* iOS Dynamic Island / Notch Placeholder (Desktop only) */}
        <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-slate-900 rounded-b-[1rem] z-50"></div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-32">
          {children}
        </div>

        {/* Bottom Navigation */}
        {!hideNav && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-4 pb-8 z-40">
            <div className="flex justify-between items-center">
              {navItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <div className="flex flex-col items-center gap-1 cursor-pointer">
                      <div
                        className={cn(
                          "p-2 rounded-full transition-all duration-300",
                          isActive ? "text-primary" : "text-muted-foreground",
                          item.highlight && "bg-primary text-white shadow-lg shadow-primary/30 -mt-6 p-3"
                        )}
                      >
                        <item.icon className={cn("w-6 h-6", item.highlight && "w-7 h-7")} />
                      </div>
                      {!item.highlight && (
                        <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                          {item.label}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
