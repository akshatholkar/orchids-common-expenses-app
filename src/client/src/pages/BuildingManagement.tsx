import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Building2, User, Phone, Home, PieChart, Edit2, Trash2, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Building, Apartment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BuildingManagement() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"list" | "edit-building" | "edit-apt">("list");
  
  const { data: buildings, isLoading: loadingBuildings } = useQuery<Building[]>({
    queryKey: ["/api/protected/buildings"],
  });

    const activeBuilding = buildings?.[0]; 

    const [tempBuilding, setTempBuilding] = useState<Partial<Building> | null>(null);

    useEffect(() => {
      if (activeBuilding) setTempBuilding(activeBuilding);
    }, [activeBuilding]);

    const { data: apartments = [], isLoading: loadingApartments } = useQuery<Apartment[]>({
    queryKey: ["/api/protected/apartments"],
    enabled: !!activeBuilding,
  });

  const [editingApt, setEditingApt] = useState<Partial<Apartment> | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const updateShare = (category: string, value: string) => {
    if (!editingApt) return;
    setEditingApt({
      ...editingApt,
      shares: {
        ...(editingApt.shares as any),
        [category]: parseFloat(value) || 0
      }
    });
  };

  const removeCategory = (category: string) => {
    if (!editingApt) return;
    const newShares = { ...(editingApt.shares as any) };
    delete newShares[category];
    setEditingApt({ ...editingApt, shares: newShares });
  };

  const addCategory = () => {
    if (!editingApt || !newCategoryName) return;
    setEditingApt({
      ...editingApt,
      shares: {
        ...(editingApt.shares as any),
        [newCategoryName.toLowerCase()]: 0
      }
    });
    setNewCategoryName("");
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/protected/apartments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/apartments"] });
      toast({ title: "Success", description: "Apartment deleted" });
      setStep("list");
    }
  });

  const saveAptMutation = useMutation({
    mutationFn: async (apt: any) => {
      if (apt.id) {
        return await apiRequest("PATCH", `/api/protected/apartments/${apt.id}`, apt);
      } else {
        return await apiRequest("POST", "/api/protected/apartments", { ...apt, buildingId: activeBuilding?.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/apartments"] });
      toast({ title: "Success", description: "Apartment saved" });
      setStep("list");
    }
  });

  const saveBuildingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/protected/buildings/${activeBuilding?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/buildings"] });
      toast({ title: "Success", description: "Building updated" });
      setStep("list");
    }
  });

  const saveApartment = () => {
    if (editingApt) saveAptMutation.mutate(editingApt);
  };

  const deleteApartment = (id: string) => {
    deleteMutation.mutate(id);
  };

  const saveBuilding = () => {
    if (tempBuilding) saveBuildingMutation.mutate(tempBuilding);
  };

  if (loadingBuildings || loadingApartments) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-6 pb-24">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => step === "list" ? setLocation("/dashboard") : setStep("list")}>
            <ArrowLeft className="h-6 w-6 text-slate-900" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900">
            {step === "list" ? "Building Management" : step === "edit-building" ? "Edit Building" : "Apartment Details"}
          </h2>
        </div>

        <AnimatePresence mode="wait">
          {step === "list" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <Card className="border-none shadow-sm bg-primary text-white">
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">{activeBuilding?.name}</h3>
                    <p className="text-sm opacity-80">{activeBuilding?.address}</p>
                  </div>
                  <Button variant="secondary" size="icon" onClick={() => setStep("edit-building")}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-900">Apartments</h3>
                    <Button size="sm" onClick={() => { 
                      setEditingApt({
                        id: "",
                        identifier: "",
                        ownerName: "",
                        ownerPhone: "",
                        usage: "residential",
                        shares: { utilities: 0, maintenance: 0, cleaning: 0 }
                      }); 
                      setStep("edit-apt"); 
                    }} className="gap-1">
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                
                <div className="grid gap-3">
                  {apartments.map((apt) => (
                    <Card key={apt.id} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setEditingApt(apt); setStep("edit-apt"); }}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary">
                            {apt.identifier}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{apt.ownerName}</p>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{apt.usage}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === "edit-building" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="space-y-2">
                <Label>Building Name</Label>
                <Input value={tempBuilding?.name || ""} onChange={(e) => setTempBuilding({...tempBuilding!, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={tempBuilding?.address || ""} onChange={(e) => setTempBuilding({...tempBuilding!, address: e.target.value})} />
              </div>
              <Button className="w-full mt-4" onClick={saveBuilding} disabled={saveBuildingMutation.isPending}>
                {saveBuildingMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </motion.div>
          )}

          {step === "edit-apt" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Identifier (e.g. A1)</Label>
                  <Input 
                    value={editingApt?.identifier || ""} 
                    onChange={(e) => setEditingApt({...editingApt!, identifier: e.target.value})}
                    placeholder="A1" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Usage</Label>
                  <Select 
                    value={editingApt?.usage || "residential"}
                    onValueChange={(value) => setEditingApt({...editingApt!, usage: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="parking">Parking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2 text-slate-800 border-b pb-2">
                  <User className="h-4 w-4" /> Owner Details
                </h4>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={editingApt?.ownerName || ""} 
                    onChange={(e) => setEditingApt({...editingApt!, ownerName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    value={editingApt?.ownerPhone || ""} 
                    onChange={(e) => setEditingApt({...editingApt!, ownerPhone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2 text-slate-800 border-b pb-2">
                  <User className="h-4 w-4" /> Tenant Details (Optional)
                </h4>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={editingApt?.tenantName || ""} 
                    onChange={(e) => setEditingApt({...editingApt!, tenantName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    value={editingApt?.tenantPhone || ""} 
                    onChange={(e) => setEditingApt({...editingApt!, tenantPhone: e.target.value})}
                  />
                </div>
              </div>

                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2 text-slate-800 border-b pb-2">
                    <PieChart className="h-4 w-4" /> Shares per Category (%)
                  </h4>
                  <div className="grid gap-4">
                    {editingApt && editingApt.shares && Object.entries(editingApt.shares).map(([category, value]) => (
                      <div key={category} className="flex items-end gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs font-semibold text-slate-500 uppercase">{category}</Label>
                          <Input 
                            type="number" 
                            value={value as number} 
                            onChange={(e) => updateShare(category, e.target.value)}
                            className="bg-white"
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => removeCategory(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="mt-2 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <Label className="text-sm font-bold text-slate-700 block mb-3">Add New Category</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Category name (e.g. Elevator)" 
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="bg-white"
                        />
                        <Button 
                          onClick={addCategory}
                          className="shadow-sm"
                          disabled={!newCategoryName}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    className="flex-1 h-12 rounded-xl text-lg font-bold" 
                    onClick={saveApartment}
                    disabled={saveAptMutation.isPending}
                  >
                    {saveAptMutation.isPending ? "Saving..." : (editingApt?.id ? "Update Apartment" : "Create Apartment")}
                  </Button>
                {editingApt?.id && (
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-12 w-12 rounded-xl shadow-lg shadow-red-500/20"
                    disabled={deleteMutation.isPending}
                      onClick={() => {
                        // Use a simple state-based confirmation instead of window.confirm
                        if (window.confirm("Are you sure you want to delete this apartment?")) {
                          deleteApartment(editingApt.id!);
                        }
                      }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
