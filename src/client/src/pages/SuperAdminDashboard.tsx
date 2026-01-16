import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Settings, 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit2, 
  Building2,
  Lock,
  LogOut,
  LayoutDashboard,
  Search,
  MoreHorizontal,
  Eye,
  EyeOff
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const apiRequest = async (method: string, url: string, body?: any) => {
  const token = localStorage.getItem("superAdminToken");
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
};

export default function SuperAdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [managers, setManagers] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalManagers: 0, totalResidents: 0, totalBuildings: 0, totalSubscriptions: 0, activeSubscriptions: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<any>(null);
  const [managerData, setManagerData] = useState({ fullName: "", email: "", phone: "" });

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    const token = localStorage.getItem("superAdminToken");
    const adminData = localStorage.getItem("superAdmin");
    
    if (!token || !adminData) {
      setLocation("/");
      return;
    }
    
    setAdmin(JSON.parse(adminData));
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [managersData, residentsData, subsData, statsData] = await Promise.all([
        apiRequest("GET", "/api/super-admin/protected/managers"),
        apiRequest("GET", "/api/super-admin/protected/residents"),
        apiRequest("GET", "/api/super-admin/protected/subscriptions"),
        apiRequest("GET", "/api/super-admin/protected/stats"),
      ]);
      
      setManagers(managersData);
      setResidents(residentsData);
      setSubscriptions(subsData);
      setStats(statsData);
    } catch (error: any) {
      if (error.message === "Invalid token") {
        handleLogout();
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("superAdminToken");
    localStorage.removeItem("superAdmin");
    setLocation("/");
  };

  const handleSaveManager = async () => {
    try {
      if (editingManager) {
        await apiRequest("PATCH", `/api/super-admin/protected/managers/${editingManager.id}`, managerData);
        toast({ title: "Success", description: "Manager updated successfully" });
      } else {
        await apiRequest("POST", "/api/super-admin/protected/managers", managerData);
        toast({ title: "Success", description: "Manager added successfully" });
      }
      setIsDialogOpen(false);
      setEditingManager(null);
      setManagerData({ fullName: "", email: "", phone: "" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteManager = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/super-admin/protected/managers/${id}`);
      toast({ title: "Success", description: "Manager deleted successfully" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", "/api/super-admin/protected/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast({ title: "Success", description: "Password updated successfully" });
      setIsPasswordDialogOpen(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredManagers = managers.filter(m => 
    m.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone?.includes(searchQuery)
  );

  const filteredResidents = residents.filter(r => 
    r.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone?.includes(searchQuery)
  );

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "managers", label: "Managers", icon: Users },
    { id: "residents", label: "Residents", icon: Building2 },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-tight">Common Expense</h1>
          <p className="text-sm text-slate-400 mt-1">Super Admin Panel</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? "bg-slate-800 text-white" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
              {admin?.fullName?.charAt(0) || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{admin?.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{admin?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-2 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
              <p className="text-slate-500 mt-1">Overview of your platform</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Managers</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalManagers}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Residents</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalResidents}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Buildings</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalBuildings}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Active Subscriptions</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{stats.activeSubscriptions}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Managers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {managers.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">
                          {m.fullName?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{m.fullName}</p>
                          <p className="text-xs text-slate-500">{m.email || m.phone}</p>
                        </div>
                      </div>
                    ))}
                    {managers.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">No managers yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Residents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {residents.slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">
                          {r.fullName?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{r.fullName}</p>
                          <p className="text-xs text-slate-500">{r.phone}</p>
                        </div>
                        <Badge variant={r.role === 'owner' ? 'default' : 'secondary'}>
                          {r.role}
                        </Badge>
                      </div>
                    ))}
                    {residents.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">No residents yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "managers" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Managers</h2>
                <p className="text-slate-500 mt-1">Manage building managers</p>
              </div>
              <Button onClick={() => {
                setEditingManager(null);
                setManagerData({ fullName: "", email: "", phone: "" });
                setIsDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" /> Add Manager
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search managers..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredManagers.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.fullName}</TableCell>
                        <TableCell>{m.email || "-"}</TableCell>
                        <TableCell>{m.phone || "-"}</TableCell>
                        <TableCell>{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingManager(m);
                                setManagerData({
                                  fullName: m.fullName,
                                  email: m.email || "",
                                  phone: m.phone || "",
                                });
                                setIsDialogOpen(true);
                              }}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteManager(m.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredManagers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          No managers found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "residents" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Residents</h2>
              <p className="text-slate-500 mt-1">Track owners and tenants</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search residents..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResidents.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.fullName}</TableCell>
                        <TableCell>
                          <Badge variant={r.role === 'owner' ? 'default' : 'secondary'}>
                            {r.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{r.phone || "-"}</TableCell>
                        <TableCell>{r.email || "-"}</TableCell>
                        <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                    {filteredResidents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          No residents found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Subscriptions</h2>
              <p className="text-slate-500 mt-1">Manager subscription details</p>
            </div>

            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manager</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period End</TableHead>
                      <TableHead>Price ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.users?.fullName || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === 'active' ? 'default' : 'destructive'}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell className="text-xs font-mono">{s.stripePriceId || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {subscriptions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                          No subscriptions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
              <p className="text-slate-500 mt-1">Manage your account</p>
            </div>

            <Card className="bg-white border-0 shadow-sm max-w-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your super admin password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsPasswordDialogOpen(true)}>
                  Change Password
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm max-w-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Account Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-500 text-xs">Full Name</Label>
                  <p className="font-medium">{admin?.fullName}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs">Email</Label>
                  <p className="font-medium">{admin?.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingManager ? "Edit Manager" : "Add New Manager"}</DialogTitle>
            <DialogDescription>
              Managers can manage buildings, apartments, and expenses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={managerData.fullName} 
                onChange={e => setManagerData({...managerData, fullName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={managerData.email} 
                onChange={e => setManagerData({...managerData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone (with country code)</Label>
              <Input 
                placeholder="+30XXXXXXXXXX"
                value={managerData.phone} 
                onChange={e => setManagerData({...managerData, phone: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveManager}>Save Manager</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword.current ? "text" : "password"}
                  value={passwordData.currentPassword} 
                  onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                >
                  {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword.new ? "text" : "password"}
                  value={passwordData.newPassword} 
                  onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                >
                  {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword} 
                  onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                />
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                >
                  {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
