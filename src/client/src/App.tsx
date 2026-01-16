import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import OTP from "@/pages/OTP";
import Dashboard from "@/pages/Dashboard";
import Expenses from "@/pages/Expenses";
import NewExpense from "@/pages/NewExpense";
import Profile from "@/pages/Profile";
import Statements from "@/pages/Statements";
import History from "@/pages/History";
import Notifications from "@/pages/Notifications";
import PersonalInformation from "@/pages/PersonalInformation";
import SecurityPrivacy from "@/pages/SecurityPrivacy";
import AppSettings from "@/pages/AppSettings";
import HelpSupport from "@/pages/HelpSupport";
import FAQ from "@/pages/FAQ";
import BuildingManagement from "@/pages/BuildingManagement";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import SuperAdminLogin from "@/pages/SuperAdminLogin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/otp" component={OTP} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/super-admin" component={SuperAdminDashboard} />
      <Route path="/super-admin-login" component={SuperAdminLogin} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/new-expense" component={NewExpense} />
      <Route path="/profile" component={Profile} />
      <Route path="/statements" component={Statements} />
      <Route path="/history" component={History} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/personal-information" component={PersonalInformation} />
      <Route path="/security-privacy" component={SecurityPrivacy} />
      <Route path="/app-settings" component={AppSettings} />
      <Route path="/help-support" component={HelpSupport} />
      <Route path="/faq" component={FAQ} />
      <Route path="/building-management" component={BuildingManagement} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-cancel" component={PaymentCancel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <Router />
          <Toaster />
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
