"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Settings,
  Package,
  Clock,
  Bike,
  Gift,
  UserCog,
  Tag,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Users,
  Edit3,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  updateSiteConfig,
  updatePackage,
  createPackage,
  deletePackage,
  updateTimeSlot,
  updateBikeRental,
  deleteBikeRental,
  updateStarterKitItem,
  createStarterKitItem,
  deleteStarterKitItem,
  updateStaffMember,
  createStaffMember,
  deleteStaffMember,
  updatePromoCode,
  createPromoCode,
  deletePromoCode,
  listAdmins,
  grantAdminAccess,
  revokeAdminAccess,
} from "@/lib/actions/admin";
import { Shield } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface SectionProps {
  id: string;
  label: string;
  icon: typeof Settings;
}

const SECTIONS: SectionProps[] = [
  { id: "packages", label: "Ride Packages", icon: Package },
  { id: "slots", label: "Time Slots", icon: Clock },
  { id: "bikes", label: "Bike Rentals", icon: Bike },
  { id: "kit", label: "Pro-pack", icon: Gift },
  { id: "staff", label: "Staff Members", icon: UserCog },
  { id: "promos", label: "Promo Codes", icon: Tag },
  { id: "access", label: "Admin Access", icon: Shield },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminSettings({
  siteConfig,
  packages,
  timeSlots,
  bikeRentals,
  starterKit,
  staff,
  promos,
}: {
  siteConfig: any[];
  packages: any[];
  timeSlots: any[];
  bikeRentals: any[];
  starterKit: any[];
  staff: any[];
  promos: any[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeSection, setActiveSection] = useState(
    tabParam && SECTIONS.some((s) => s.id === tabParam) ? tabParam : "packages"
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toast = useToast();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    detail?: string;
    variant: "danger" | "warning" | "default";
    onConfirm: () => void;
  } | null>(null);

  // Sync with URL tab param when it changes
  useEffect(() => {
    if (tabParam && SECTIONS.some((s) => s.id === tabParam)) {
      setActiveSection(tabParam);
    }
  }, [tabParam]);

  // Local state for each section
  const [localPackages, setLocalPackages] = useState(packages);
  const [localSlots, setLocalSlots] = useState(timeSlots);
  const [localBikes, setLocalBikes] = useState(bikeRentals);
  const [localKit, setLocalKit] = useState(starterKit);
  const [localStaff, setLocalStaff] = useState(staff);
  const [localPromos, setLocalPromos] = useState(promos);

  // Detect unsaved changes per section
  const hasUnsavedChanges = (section: string): boolean => {
    switch (section) {
      case "packages": return JSON.stringify(localPackages) !== JSON.stringify(packages);
      case "slots": return JSON.stringify(localSlots) !== JSON.stringify(timeSlots);
      case "bikes": return JSON.stringify(localBikes) !== JSON.stringify(bikeRentals);
      case "kit": return JSON.stringify(localKit) !== JSON.stringify(starterKit);
      case "staff": return JSON.stringify(localStaff) !== JSON.stringify(staff);
      case "promos": return JSON.stringify(localPromos) !== JSON.stringify(promos);
      default: return false;
    }
  };

  const handleTabSwitch = (newTab: string) => {
    if (newTab === activeSection) return;
    if (hasUnsavedChanges(activeSection)) {
      setConfirmDialog({
        open: true,
        title: "Unsaved Changes",
        description: "You have unsaved changes. Switch tabs and lose them?",
        variant: "warning",
        onConfirm: () => {
          // Revert current section to server state
          switch (activeSection) {
            case "packages": setLocalPackages(packages); break;
            case "slots": setLocalSlots(timeSlots); break;
            case "bikes": setLocalBikes(bikeRentals); break;
            case "kit": setLocalKit(starterKit); break;
            case "staff": setLocalStaff(staff); break;
            case "promos": setLocalPromos(promos); break;
          }
          setActiveSection(newTab);
        },
      });
      return;
    }
    setActiveSection(newTab);
  };

  const showSaved = (id: string) => {
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  };

  // =============================================
  // PACKAGES
  // =============================================
  const PackagesSection = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [newPkg, setNewPkg] = useState({
      type: "",
      name: "",
      name_th: "",
      min_riders: 2,
      max_riders: 4,
      price_per_person: 2000,
      leaders_count: 1,
      heroes_count: 0,
      description: "",
      icon: "star",
      sort_order: (localPackages.length + 1) * 10,
      is_popular: false,
      is_active: true,
    });

    const validatePkg = (pkg: any): string | null => {
      if (!pkg.name?.trim()) return "Package name is required";
      if (!pkg.type?.trim()) return "URL key is required";
      if (pkg.min_riders < 1) return "Min riders must be at least 1";
      if (pkg.max_riders < pkg.min_riders) return "Max riders cannot be less than min riders";
      if (pkg.price_per_person < 0) return "Price cannot be negative";
      return null;
    };

    const handleSave = async (pkg: any) => {
      const validationError = validatePkg(pkg);
      if (validationError) { setError(validationError); return; }
      setSaving(pkg.id);
      setError(null);
      const result = await updatePackage(pkg.id, {
        type: pkg.type,
        name: pkg.name,
        name_th: pkg.name_th || null,
        description: pkg.description || null,
        price_per_person: pkg.price_per_person,
        min_riders: pkg.min_riders,
        max_riders: pkg.max_riders,
        leaders_count: pkg.leaders_count,
        heroes_count: pkg.heroes_count,
        icon: pkg.icon || null,
        sort_order: pkg.sort_order || 0,
        is_popular: pkg.is_popular,
        is_active: pkg.is_active,
      });
      setSaving(null);
      if (result.success) {
        showSaved(pkg.id);
        setEditingId(null);
        toast.success("Package saved successfully");
      } else {
        toast.error("Failed to save package. Please try again.");
      }
    };

    const handleCreate = async () => {
      const validationError = validatePkg(newPkg);
      if (validationError) { setError(validationError); return; }
      setSaving("new");
      const result = await createPackage(newPkg);
      setSaving(null);
      if (result.success) {
        setShowNewForm(false);
        setNewPkg({ type: "", name: "", name_th: "", min_riders: 2, max_riders: 4, price_per_person: 2000, leaders_count: 1, heroes_count: 0, description: "", icon: "star", sort_order: (localPackages.length + 2) * 10, is_popular: false, is_active: true });
        showSaved("new");
        toast.success("Package created successfully");
        router.refresh(); // Fetch real DB IDs
      } else {
        toast.error("Failed to create package. Please try again.");
      }
    };

    return (
      <div className="space-y-3">
        {localPackages.map((pkg) => {
          const isEditing = editingId === pkg.id;
          return (
            <Card key={pkg.id} padding="sm">
              <div className="p-3">
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Price — most common edit, top and prominent */}
                    <div className="p-3 rounded-xl bg-accent/5 border border-accent/15">
                      <Field label="💰 Price per Person (THB)" type="number" value={pkg.price_per_person} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, price_per_person: Number(v) } : p))} />
                    </div>

                    {/* Names */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field label="Display Name" value={pkg.name} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, name: v } : p))} />
                      <Field label="Thai Name" value={pkg.name_th || ""} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, name_th: v } : p))} />
                      <Field label="URL Key" value={pkg.type} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, type: v.toLowerCase().replace(/\s+/g, "_") } : p))} />
                    </div>

                    {/* Capacity & Staff */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Field label="Min Riders" type="number" value={pkg.min_riders} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, min_riders: Number(v) } : p))} />
                      <Field label="Max Riders" type="number" value={pkg.max_riders} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, max_riders: Number(v) } : p))} />
                      <Field label="Leaders" type="number" value={pkg.leaders_count} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, leaders_count: Number(v) } : p))} />
                      <Field label="Heroes" type="number" value={pkg.heroes_count} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, heroes_count: Number(v) } : p))} />
                    </div>

                    {/* Display options */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-ink-muted mb-1 block">Icon</label>
                        <select
                          value={pkg.icon || "star"}
                          onChange={(e) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, icon: e.target.value } : p))}
                          className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none bg-surface"
                        >
                          <option value="star">Star</option>
                          <option value="zap">Zap</option>
                          <option value="crown">Crown</option>
                        </select>
                      </div>
                      <Field label="Sort Order" type="number" value={pkg.sort_order || 0} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, sort_order: Number(v) } : p))} />
                    </div>
                    <div>
                      <label className="text-xs text-ink-muted mb-1 block">Description</label>
                      <textarea
                        value={pkg.description || ""}
                        onChange={(e) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, description: e.target.value } : p))}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none transition-colors bg-surface resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={pkg.is_popular}
                          onChange={(e) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, is_popular: e.target.checked } : p))}
                          className="rounded"
                        />
                        Popular badge
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={pkg.is_active !== false}
                          onChange={(e) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, is_active: e.target.checked } : p))}
                          className="rounded"
                        />
                        Active
                      </label>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button size="sm" onClick={() => handleSave(pkg)} disabled={saving === pkg.id}>
                        <Save className="h-3 w-3" />
                        {saving === pkg.id ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingId(null);
                        const original = packages.find((p) => p.id === pkg.id);
                        if (original) setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? original : p));
                      }}>
                        Cancel
                      </Button>
                      <button
                        className="ml-auto p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete package"
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: "Delete Package",
                            description: `Delete "${pkg.name}"?`,
                            detail: "This cannot be undone.",
                            variant: "danger",
                            onConfirm: async () => {
                              setSaving(pkg.id);
                              const result = await deletePackage(pkg.id);
                              setSaving(null);
                              if (result.success) {
                                setLocalPackages((prev) => prev.filter((p) => p.id !== pkg.id));
                                setEditingId(null);
                                toast.success("Package deleted successfully");
                              } else {
                                toast.error("Failed to delete package. Please try again.");
                              }
                            },
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setEditingId(pkg.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setEditingId(pkg.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{pkg.name}</span>
                        {/* Package names are English-only (Duo/Squad/Peloton) */}
                        {pkg.is_popular && <Badge variant="accent">Popular</Badge>}
                        {pkg.is_active === false && <Badge variant="default">Inactive</Badge>}
                        {saved === pkg.id && <CheckCircle2 className="h-4 w-4 text-success" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-sm font-bold text-accent">{pkg.price_per_person?.toLocaleString()} THB</span>
                        <span className="text-xs text-ink-muted">{pkg.min_riders}–{pkg.max_riders} riders</span>
                        <span className="text-xs text-ink-muted">{pkg.leaders_count}L / {pkg.heroes_count}H</span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted group-hover:text-accent transition-colors px-2 py-1 rounded-lg group-hover:bg-accent/5">
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {showNewForm ? (
          <Card padding="md">
            <p className="font-semibold text-sm mb-3">New Package</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="URL Key (e.g. trio)" value={newPkg.type} onChange={(v) => setNewPkg((p) => ({ ...p, type: v.toLowerCase().replace(/\s+/g, "_") }))} />
              <Field label="Display Name" value={newPkg.name} onChange={(v) => setNewPkg((p) => ({ ...p, name: v }))} />
              <Field label="Thai Name" value={newPkg.name_th || ""} onChange={(v) => setNewPkg((p) => ({ ...p, name_th: v }))} />
              <Field label="Price/Person (THB)" type="number" value={newPkg.price_per_person} onChange={(v) => setNewPkg((p) => ({ ...p, price_per_person: Number(v) }))} />
              <Field label="Min Riders" type="number" value={newPkg.min_riders} onChange={(v) => setNewPkg((p) => ({ ...p, min_riders: Number(v) }))} />
              <Field label="Max Riders" type="number" value={newPkg.max_riders} onChange={(v) => setNewPkg((p) => ({ ...p, max_riders: Number(v) }))} />
              <Field label="Leaders" type="number" value={newPkg.leaders_count} onChange={(v) => setNewPkg((p) => ({ ...p, leaders_count: Number(v) }))} />
              <Field label="Heroes" type="number" value={newPkg.heroes_count} onChange={(v) => setNewPkg((p) => ({ ...p, heroes_count: Number(v) }))} />
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Icon</label>
                <select
                  value={newPkg.icon}
                  onChange={(e) => setNewPkg((p) => ({ ...p, icon: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none bg-surface"
                >
                  <option value="star">Star</option>
                  <option value="zap">Zap</option>
                  <option value="crown">Crown</option>
                </select>
              </div>
              <Field label="Sort Order" type="number" value={newPkg.sort_order} onChange={(v) => setNewPkg((p) => ({ ...p, sort_order: Number(v) }))} />
            </div>
            <div className="mt-3">
              <label className="text-xs text-ink-muted mb-1 block">Description</label>
              <textarea
                value={newPkg.description}
                onChange={(e) => setNewPkg((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                placeholder="Short description for the package card"
                className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none transition-colors bg-surface resize-none placeholder:text-ink-muted/70"
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={newPkg.is_popular} onChange={(e) => setNewPkg((p) => ({ ...p, is_popular: e.target.checked }))} className="rounded" />
                Popular badge
              </label>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleCreate} disabled={saving === "new" || !newPkg.type || !newPkg.name}>
                {saving === "new" ? "Creating..." : "Create Package"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>Cancel</Button>
            </div>
          </Card>
        ) : (
          <button
            onClick={() => setShowNewForm(true)}
            className="w-full p-3 rounded-xl border-2 border-dashed border-sand/60 text-sm text-ink-muted hover:border-ink/20 hover:text-ink transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Package
          </button>
        )}
      </div>
    );
  };

  // =============================================
  // TIME SLOTS
  // =============================================
  const TimeSlotsSection = () => (
    <div className="space-y-3">
      {localSlots.map((slot) => (
        <Card key={slot.id} padding="sm">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{slot.slot_id || slot.id}</span>
                <span className="font-semibold text-sm">{slot.name}</span>
                {slot.is_staff_pick && <Badge variant="accent">Staff Pick</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field
                label="Start Time"
                value={slot.start_time}
                onChange={(v) => setLocalSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, start_time: v } : s))}
              />
              <Field
                label="End Time"
                value={slot.end_time}
                onChange={(v) => setLocalSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, end_time: v } : s))}
              />
              <Field
                label="Thai Description"
                value={slot.description_th || ""}
                onChange={(v) => setLocalSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, description_th: v } : s))}
              />
              <div className="flex items-end gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    setSaving(slot.id);
                    await updateTimeSlot(slot.id, {
                      start_time: slot.start_time,
                      end_time: slot.end_time,
                      description_th: slot.description_th,
                      is_staff_pick: slot.is_staff_pick,
                    });
                    setSaving(null);
                    showSaved(slot.id);
                  }}
                  disabled={saving === slot.id}
                >
                  <Save className="h-3 w-3" />
                  {saving === slot.id ? "Saving..." : "Save"}
                </Button>
                {saved === slot.id && <CheckCircle2 className="h-4 w-4 text-success" />}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // =============================================
  // BIKE RENTALS — each bike editable independently
  // =============================================
  const BikeRentalsSection = () => {
    const [editingBikeId, setEditingBikeId] = useState<string | null>(null);

    return (
      <div className="space-y-3">
        {localBikes.map((bike) => {
          const isEditing = editingBikeId === bike.id;
          const original = bikeRentals.find((b) => b.id === bike.id);
          const hasChanges = original && JSON.stringify(original) !== JSON.stringify(bike);
          return (
            <Card key={bike.id} padding="sm">
              <div className="p-3">
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Price — prominent at top */}
                    <div className="p-3 rounded-xl bg-accent/5 border border-accent/15">
                      <Field
                        label="💰 Price (THB)"
                        type="number"
                        value={bike.price}
                        onChange={(v) => setLocalBikes((prev) => prev.map((b) => b.id === bike.id ? { ...b, price: Number(v) } : b))}
                      />
                    </div>

                    {/* Name & Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field
                        label="Display Name"
                        value={bike.name}
                        onChange={(v) => setLocalBikes((prev) => prev.map((b) => b.id === bike.id ? { ...b, name: v } : b))}
                      />
                      <Field
                        label="Type Key"
                        value={bike.type}
                        onChange={(v) => setLocalBikes((prev) => prev.map((b) => b.id === bike.id ? { ...b, type: v } : b))}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-sand/30">
                      <Button
                        size="sm"
                        onClick={async () => {
                          setSaving(bike.id);
                          setError(null);
                          const result = await updateBikeRental(bike.id, { type: bike.type, name: bike.name, price: bike.price });
                          setSaving(null);
                          if (result.success) {
                            showSaved(bike.id);
                            setEditingBikeId(null);
                            toast.success("Bike rental saved successfully");
                          } else {
                            toast.error("Failed to save bike rental. Please try again.");
                          }
                        }}
                        disabled={saving === bike.id || !hasChanges}
                      >
                        <Save className="h-3 w-3" />
                        {saving === bike.id ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingBikeId(null);
                        if (original) setLocalBikes((prev) => prev.map((b) => b.id === bike.id ? original : b));
                      }}>
                        Cancel
                      </Button>
                      {hasChanges && <span className="text-xs text-accent ml-1">Unsaved changes</span>}
                      <button
                        className="ml-auto p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete bike"
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: "Delete Bike Rental",
                            description: `Delete "${bike.name}"?`,
                            detail: "This cannot be undone.",
                            variant: "danger",
                            onConfirm: async () => {
                              setSaving(bike.id);
                              const result = await deleteBikeRental(bike.id);
                              setSaving(null);
                              if (result.success) {
                                setLocalBikes((prev) => prev.filter((b) => b.id !== bike.id));
                                setEditingBikeId(null);
                                toast.success("Bike rental deleted successfully");
                              } else {
                                toast.error("Failed to delete bike rental. Please try again.");
                              }
                            },
                          });
                        }}
                        disabled={saving === bike.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setEditingBikeId(bike.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setEditingBikeId(bike.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/8 border border-accent/10">
                        <Bike className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{bike.name}</span>
                          <span className="text-xs text-ink-muted">({bike.type})</span>
                          {saved === bike.id && <CheckCircle2 className="h-4 w-4 text-success" />}
                        </div>
                        <span className="text-sm font-bold text-accent">{bike.price?.toLocaleString()} THB</span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted group-hover:text-accent transition-colors px-2 py-1 rounded-lg group-hover:bg-accent/5">
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  // =============================================
  // STARTER KIT
  // =============================================
  const StarterKitSection = () => {
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");

    return (
      <div className="space-y-3">
        {localKit.map((item) => (
          <Card key={item.id} padding="sm">
            <div className="p-3 flex items-center gap-4">
              <Gift className="h-5 w-5 text-accent flex-shrink-0" />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="Item Name"
                  value={item.name}
                  onChange={(v) => setLocalKit((prev) => prev.map((k) => k.id === item.id ? { ...k, name: v } : k))}
                />
                <Field
                  label="Description"
                  value={item.description || ""}
                  onChange={(v) => setLocalKit((prev) => prev.map((k) => k.id === item.id ? { ...k, description: v } : k))}
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={async () => {
                    setSaving(item.id);
                    const result = await updateStarterKitItem(item.id, { name: item.name, description: item.description });
                    setSaving(null);
                    if (result.success) {
                      showSaved(item.id);
                      toast.success("Item saved successfully");
                    } else {
                      toast.error("Failed to save item. Please try again.");
                    }
                  }}
                  disabled={saving === item.id}
                >
                  <Save className="h-3 w-3" />
                </Button>
                <button
                  className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete item"
                  onClick={() => {
                    setConfirmDialog({
                      open: true,
                      title: "Delete Item",
                      description: `Delete "${item.name}"?`,
                      variant: "danger",
                      onConfirm: async () => {
                        setSaving(item.id);
                        const result = await deleteStarterKitItem(item.id);
                        setSaving(null);
                        if (result.success) {
                          setLocalKit((prev) => prev.filter((k) => k.id !== item.id));
                          toast.success("Item deleted successfully");
                        } else {
                          toast.error("Failed to delete item. Please try again.");
                        }
                      },
                    });
                  }}
                  disabled={saving === item.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {saved === item.id && <CheckCircle2 className="h-4 w-4 text-success" />}
              </div>
            </div>
          </Card>
        ))}

        {showNew ? (
          <Card padding="md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Name" value={newName} onChange={setNewName} />
              <Field label="Description" value={newDesc} onChange={setNewDesc} />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={async () => {
                setSaving("newkit");
                const result = await createStarterKitItem({ name: newName, description: newDesc });
                setSaving(null);
                if (result.success) {
                  setShowNew(false);
                  setNewName("");
                  setNewDesc("");
                  toast.success("Item created successfully");
                  router.refresh();
                } else {
                  toast.error("Failed to create item. Please try again.");
                }
              }} disabled={saving === "newkit" || !newName}>
                {saving === "newkit" ? "Adding..." : "Add Item"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </Card>
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="w-full p-3 rounded-xl border-2 border-dashed border-sand/60 text-sm text-ink-muted hover:border-ink/20 hover:text-ink transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Kit Item
          </button>
        )}
      </div>
    );
  };

  // =============================================
  // STAFF
  // =============================================
  const StaffSection = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showNew, setShowNew] = useState(false);
    const [newMember, setNewMember] = useState({ name: "", nickname: "", role: "leader", phone: "", bio: "", max_sessions_per_day: 2 });

    return (
      <div className="space-y-3">
        {localStaff.map((member) => {
          const isEditing = editingId === member.id;
          return (
            <Card key={member.id} padding="sm">
              <div className="p-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Field label="Name" value={member.name} onChange={(v) => setLocalStaff((prev) => prev.map((s) => s.id === member.id ? { ...s, name: v } : s))} />
                      <Field label="Nickname" value={member.nickname || ""} onChange={(v) => setLocalStaff((prev) => prev.map((s) => s.id === member.id ? { ...s, nickname: v } : s))} />
                      <div>
                        <label className="text-xs text-ink-muted mb-1 block">Role</label>
                        <select
                          value={member.role}
                          onChange={(e) => setLocalStaff((prev) => prev.map((s) => s.id === member.id ? { ...s, role: e.target.value } : s))}
                          className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none bg-surface"
                        >
                          <option value="leader">Athlete Leader</option>
                          <option value="hero">Hero</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <Field label="Phone" value={member.phone || ""} onChange={(v) => setLocalStaff((prev) => prev.map((s) => s.id === member.id ? { ...s, phone: v } : s))} />
                      <Field label="Bio" value={member.bio || ""} onChange={(v) => setLocalStaff((prev) => prev.map((s) => s.id === member.id ? { ...s, bio: v } : s))} />
                      <Field label="Max Sessions/Day" type="number" value={member.max_sessions_per_day || 2} onChange={(v) => setLocalStaff((prev) => prev.map((s) => s.id === member.id ? { ...s, max_sessions_per_day: Number(v) } : s))} />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={member.is_active !== false}
                          onChange={(e) => setLocalStaff((prev) => prev.map((s) => s.id === member.id ? { ...s, is_active: e.target.checked } : s))}
                          className="rounded"
                        />
                        Active
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => {
                        setSaving(member.id);
                        const result = await updateStaffMember(member.id, {
                          name: member.name, nickname: member.nickname, role: member.role,
                          phone: member.phone, bio: member.bio, max_sessions_per_day: member.max_sessions_per_day, is_active: member.is_active,
                        });
                        setSaving(null);
                        if (result.success) {
                          showSaved(member.id);
                          setEditingId(null);
                          toast.success("Staff member saved successfully");
                        } else {
                          toast.error("Failed to save staff member. Please try again.");
                        }
                      }} disabled={saving === member.id}>
                        <Save className="h-3 w-3" />
                        {saving === member.id ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingId(null);
                        const original = staff.find((s) => s.id === member.id);
                        if (original) setLocalStaff((prev) => prev.map((s) => s.id === member.id ? original : s));
                      }}>Cancel</Button>
                      <button
                        className="ml-auto p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete staff member"
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: "Delete Staff Member",
                            description: `Delete "${member.name}"?`,
                            detail: "This cannot be undone.",
                            variant: "danger",
                            onConfirm: async () => {
                              setSaving(member.id);
                              const result = await deleteStaffMember(member.id);
                              setSaving(null);
                              if (result.success) {
                                setLocalStaff((prev) => prev.filter((s) => s.id !== member.id));
                                setEditingId(null);
                                toast.success("Staff member deleted successfully");
                              } else {
                                toast.error("Failed to delete staff member. Please try again.");
                              }
                            },
                          });
                        }}
                        disabled={saving === member.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sand/40 flex items-center justify-center">
                        <UserCog className="h-4 w-4 text-ink-muted" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{member.name}</span>
                          {member.nickname && <span className="text-xs text-ink-muted">({member.nickname})</span>}
                          <Badge variant={member.role === "leader" ? "accent" : member.role === "hero" ? "sky" : "warning"}>
                            {member.role}
                          </Badge>
                          {member.is_active === false && <Badge variant="default">Inactive</Badge>}
                          {saved === member.id && <CheckCircle2 className="h-4 w-4 text-success" />}
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {member.phone || "No phone"} · Max {member.max_sessions_per_day || 2} sessions/day
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setEditingId(member.id)} className="p-2 rounded-lg hover:bg-sand/30 transition-colors">
                      <Edit3 className="h-4 w-4 text-ink-muted" aria-hidden="true" /><span className="sr-only">Edit</span>
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {showNew ? (
          <Card padding="md">
            <p className="font-semibold text-sm mb-3">New Staff Member</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Name" value={newMember.name} onChange={(v) => setNewMember((p) => ({ ...p, name: v }))} />
              <Field label="Nickname" value={newMember.nickname} onChange={(v) => setNewMember((p) => ({ ...p, nickname: v }))} />
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Role</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none bg-surface"
                >
                  <option value="leader">Athlete Leader</option>
                  <option value="hero">Hero</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Field label="Phone" value={newMember.phone} onChange={(v) => setNewMember((p) => ({ ...p, phone: v }))} />
              <Field label="Bio" value={newMember.bio} onChange={(v) => setNewMember((p) => ({ ...p, bio: v }))} />
              <Field label="Max Sessions/Day" type="number" value={newMember.max_sessions_per_day} onChange={(v) => setNewMember((p) => ({ ...p, max_sessions_per_day: Number(v) }))} />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={async () => {
                setSaving("newstaff");
                const result = await createStaffMember(newMember);
                setSaving(null);
                if (result.success) {
                  setShowNew(false);
                  setNewMember({ name: "", nickname: "", role: "leader", phone: "", bio: "", max_sessions_per_day: 2 });
                  toast.success("Staff member created successfully");
                  router.refresh();
                } else {
                  toast.error("Failed to create staff member. Please try again.");
                }
              }} disabled={saving === "newstaff" || !newMember.name}>
                {saving === "newstaff" ? "Adding..." : "Add Staff"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </Card>
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="w-full p-3 rounded-xl border-2 border-dashed border-sand/60 text-sm text-ink-muted hover:border-ink/20 hover:text-ink transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Staff Member
          </button>
        )}
      </div>
    );
  };

  // =============================================
  // PROMO CODES
  // =============================================
  const PromoCodesSection = () => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showNew, setShowNew] = useState(false);
    const [newCode, setNewCode] = useState({
      code: "",
      discount_type: "percentage" as "percentage" | "fixed",
      discount_value: 10,
      max_uses: 0,
      valid_from: "",
      valid_until: "",
      is_active: true,
    });

    return (
      <div className="space-y-3">
        {localPromos.length === 0 && !showNew && (
          <Card padding="lg">
            <p className="text-center text-ink-muted text-sm">
              No promo codes yet. Create one to offer discounts.
            </p>
          </Card>
        )}

        {localPromos.map((promo) => {
          const isEditing = editingId === promo.id;
          return (
            <Card key={promo.id} padding="sm">
              <div className="p-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Field label="Code" value={promo.code} onChange={(v) => setLocalPromos((prev) => prev.map((p) => p.id === promo.id ? { ...p, code: v.toUpperCase() } : p))} />
                      <div>
                        <label className="text-xs text-ink-muted mb-1 block">Discount Type</label>
                        <select
                          value={promo.discount_type}
                          onChange={(e) => setLocalPromos((prev) => prev.map((p) => p.id === promo.id ? { ...p, discount_type: e.target.value } : p))}
                          className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none bg-surface"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed (THB)</option>
                        </select>
                      </div>
                      <Field label="Discount Value" type="number" value={promo.discount_value} onChange={(v) => setLocalPromos((prev) => prev.map((p) => p.id === promo.id ? { ...p, discount_value: Number(v) } : p))} />
                      <Field label="Max Uses (0 = unlimited)" type="number" value={promo.max_uses || 0} onChange={(v) => setLocalPromos((prev) => prev.map((p) => p.id === promo.id ? { ...p, max_uses: Number(v) } : p))} />
                      <Field label="Valid From" type="date" value={promo.valid_from || ""} onChange={(v) => setLocalPromos((prev) => prev.map((p) => p.id === promo.id ? { ...p, valid_from: v } : p))} />
                      <Field label="Valid Until" type="date" value={promo.valid_until || ""} onChange={(v) => setLocalPromos((prev) => prev.map((p) => p.id === promo.id ? { ...p, valid_until: v } : p))} />
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={promo.is_active}
                        onChange={(e) => setLocalPromos((prev) => prev.map((p) => p.id === promo.id ? { ...p, is_active: e.target.checked } : p))}
                        className="rounded"
                      />
                      Active
                    </label>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => {
                        setSaving(promo.id);
                        const result = await updatePromoCode(promo.id, {
                          code: promo.code, discount_type: promo.discount_type,
                          discount_value: promo.discount_value, max_uses: promo.max_uses,
                          valid_from: promo.valid_from || null, valid_until: promo.valid_until || null,
                          is_active: promo.is_active,
                        });
                        setSaving(null);
                        if (result.success) {
                          showSaved(promo.id);
                          setEditingId(null);
                          toast.success("Promo code saved successfully");
                        } else {
                          toast.error("Failed to save promo code. Please try again.");
                        }
                      }} disabled={saving === promo.id}>
                        <Save className="h-3 w-3" />
                        {saving === promo.id ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingId(null);
                        const original = promos.find((p) => p.id === promo.id);
                        if (original) setLocalPromos((prev) => prev.map((p) => p.id === promo.id ? original : p));
                      }}>Cancel</Button>
                      <button
                        className="ml-auto p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete promo code"
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            title: "Delete Promo Code",
                            description: `Delete promo "${promo.code}"?`,
                            detail: "This cannot be undone.",
                            variant: "danger",
                            onConfirm: async () => {
                              setSaving(promo.id);
                              const result = await deletePromoCode(promo.id);
                              setSaving(null);
                              if (result.success) {
                                setLocalPromos((prev) => prev.filter((p) => p.id !== promo.id));
                                setEditingId(null);
                                toast.success("Promo code deleted successfully");
                              } else {
                                toast.error("Failed to delete promo code. Please try again.");
                              }
                            },
                          });
                        }}
                        disabled={saving === promo.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm bg-sand/30 px-2 py-0.5 rounded">{promo.code}</span>
                        <Badge variant={promo.is_active ? "success" : "default"}>
                          {promo.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {saved === promo.id && <CheckCircle2 className="h-4 w-4 text-success" />}
                      </div>
                      <p className="text-xs text-ink-muted mt-1">
                        {promo.discount_type === "percentage"
                          ? `${promo.discount_value}% off`
                          : `${promo.discount_value?.toLocaleString()} THB off`}
                        {promo.max_uses ? ` · Max ${promo.max_uses} uses` : " · Unlimited"}
                        {promo.times_used ? ` · Used ${promo.times_used}x` : ""}
                        {promo.valid_until && ` · Expires ${new Date(promo.valid_until).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                      </p>
                    </div>
                    <button onClick={() => setEditingId(promo.id)} className="p-2 rounded-lg hover:bg-sand/30 transition-colors">
                      <Edit3 className="h-4 w-4 text-ink-muted" aria-hidden="true" /><span className="sr-only">Edit</span>
                    </button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {showNew ? (
          <Card padding="md">
            <p className="font-semibold text-sm mb-3">New Promo Code</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Code" value={newCode.code} onChange={(v) => setNewCode((p) => ({ ...p, code: v.toUpperCase() }))} />
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Discount Type</label>
                <select
                  value={newCode.discount_type}
                  onChange={(e) => setNewCode((p) => ({ ...p, discount_type: e.target.value as "percentage" | "fixed" }))}
                  className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none bg-surface"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (THB)</option>
                </select>
              </div>
              <Field label="Discount Value" type="number" value={newCode.discount_value} onChange={(v) => setNewCode((p) => ({ ...p, discount_value: Number(v) }))} />
              <Field label="Max Uses (0 = unlimited)" type="number" value={newCode.max_uses} onChange={(v) => setNewCode((p) => ({ ...p, max_uses: Number(v) }))} />
              <Field label="Valid From" type="date" value={newCode.valid_from} onChange={(v) => setNewCode((p) => ({ ...p, valid_from: v }))} />
              <Field label="Valid Until" type="date" value={newCode.valid_until} onChange={(v) => setNewCode((p) => ({ ...p, valid_until: v }))} />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={async () => {
                setSaving("newpromo");
                const result = await createPromoCode(newCode);
                setSaving(null);
                if (result.success) {
                  setShowNew(false);
                  setNewCode({ code: "", discount_type: "percentage", discount_value: 10, max_uses: 0, valid_from: "", valid_until: "", is_active: true });
                  toast.success("Promo code created successfully");
                  router.refresh();
                } else {
                  toast.error("Failed to create promo code. Please try again.");
                }
              }} disabled={saving === "newpromo" || !newCode.code}>
                {saving === "newpromo" ? "Creating..." : "Create Code"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </Card>
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="w-full p-3 rounded-xl border-2 border-dashed border-sand/60 text-sm text-ink-muted hover:border-ink/20 hover:text-ink transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Promo Code
          </button>
        )}
      </div>
    );
  };

  // =============================================
  // ADMIN ACCESS MANAGEMENT
  // =============================================
  const [admins, setAdmins] = useState<
    { user_id: string; email: string; full_name: string; role: string; created_at: string }[]
  >([]);
  const [adminsLoaded, setAdminsLoaded] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  const loadAdmins = async () => {
    const data = await listAdmins();
    setAdmins(data);
    setAdminsLoaded(true);
  };


  const AdminAccessSection = () => {
    const [accessMessage, setAccessMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Load admins on mount
    useEffect(() => {
      if (!adminsLoaded) loadAdmins();
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    const onGrant = async () => {
      setAccessMessage(null);
      const emailToGrant = newAdminEmail.trim();
      if (!emailToGrant) return;
      setAdminActionLoading(true);
      const result = await grantAdminAccess(emailToGrant);
      if (result.success) {
        setAccessMessage({ type: "success", text: `Admin access granted to ${emailToGrant}` });
        setNewAdminEmail("");
        toast.success("Admin access granted");
        await loadAdmins();
      } else {
        toast.error("Failed to grant access. Please try again.");
        setAccessMessage({ type: "error", text: result.message || "Failed to grant access" });
      }
      setAdminActionLoading(false);
    };

    const onRevoke = async (email: string) => {
      setConfirmDialog({
        open: true,
        title: "Revoke Admin Access",
        description: `Revoke admin access for ${email}?`,
        variant: "warning",
        onConfirm: async () => {
          setAccessMessage(null);
          setAdminActionLoading(true);
          const result = await revokeAdminAccess(email);
          if (result.success) {
            setAccessMessage({ type: "success", text: `Admin access revoked for ${email}` });
            toast.success("Admin access revoked");
            await loadAdmins();
          } else {
            toast.error("Failed to revoke access. Please try again.");
            setAccessMessage({ type: "error", text: result.message || "Failed to revoke access" });
          }
          setAdminActionLoading(false);
        },
      });
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            Admin Access
          </h2>
        </div>

        {accessMessage && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
            accessMessage.type === "success"
              ? "bg-success/10 text-success border border-success/20"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {accessMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {accessMessage.text}
            <button onClick={() => setAccessMessage(null)} className="ml-auto"><X className="h-3 w-3" /></button>
          </div>
        )}

        {/* Add new admin */}
        <Card padding="md" className="space-y-3">
          <p className="text-sm font-semibold">Grant Admin Access</p>
          <p className="text-xs text-ink-muted">
            The user must have already signed up with their email. Enter it below to grant admin access.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none transition-colors bg-surface placeholder:text-ink-muted/70"
              onKeyDown={(e) => e.key === "Enter" && onGrant()}
            />
            <Button
              size="sm"
              onClick={onGrant}
              disabled={adminActionLoading || !newAdminEmail.trim()}
            >
              {adminActionLoading ? "..." : <><Plus className="h-4 w-4 mr-1" /> Grant</>}
            </Button>
          </div>
        </Card>

        {/* Current admins list */}
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Current Admins</p>
            <span className="text-xs text-ink-muted">{admins.length} admin{admins.length !== 1 ? "s" : ""}</span>
          </div>
          {!adminsLoaded ? (
            <div className="flex items-center gap-2 py-4 justify-center">
              <div className="h-4 w-4 border-2 border-ink-muted/30 border-t-ink-muted rounded-full animate-spin" />
              <p className="text-xs text-ink-muted">Loading admins...</p>
            </div>
          ) : admins.length === 0 ? (
            <p className="text-xs text-ink-muted py-4 text-center">No admins found. Grant access above.</p>
          ) : (
            <div className="space-y-2">
              {admins.map((a) => (
                <div
                  key={a.user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-sand/20 border border-sand/40"
                >
                  <div>
                    <p className="text-sm font-medium">{a.full_name || "No name"}</p>
                    <p className="text-xs text-ink-muted">{a.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.email === "enjoyspeed.bkk@gmail.com" ? (
                      <Badge variant="accent">Owner</Badge>
                    ) : (
                      <button
                        onClick={() => onRevoke(a.email)}
                        disabled={adminActionLoading}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  // =============================================
  // RENDER
  // =============================================
  // NOTE: All sections are rendered as function calls (not <Component />)
  // and kept mounted with display:none to prevent React from remounting
  // them on parent re-render (which would destroy input focus & internal state).

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-ink-muted mt-1">
          Manage packages, pricing, staff, and promotions
        </p>
      </div>

      {/* Section tabs */}
      <div className="border-b border-sand/60">
        <div className="flex gap-0 overflow-x-auto">
          {SECTIONS.map((section) => {
            const unsaved = hasUnsavedChanges(section.id);
            return (
              <button
                key={section.id}
                onClick={() => handleTabSwitch(section.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium whitespace-nowrap transition-all border-b-2 ${
                  activeSection === section.id
                    ? "text-ink border-b-ink text-base"
                    : "text-ink-muted border-b-transparent text-sm hover:text-ink hover:border-b-sand/60"
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
                {unsaved && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" title="Unsaved changes" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* All sections rendered (hidden when inactive) to preserve internal state & focus */}
      <div style={{ display: activeSection === "packages" ? undefined : "none" }}>{PackagesSection()}</div>
      <div style={{ display: activeSection === "slots" ? undefined : "none" }}>{TimeSlotsSection()}</div>
      <div style={{ display: activeSection === "bikes" ? undefined : "none" }}>{BikeRentalsSection()}</div>
      <div style={{ display: activeSection === "kit" ? undefined : "none" }}>{StarterKitSection()}</div>
      <div style={{ display: activeSection === "staff" ? undefined : "none" }}>{StaffSection()}</div>
      <div style={{ display: activeSection === "promos" ? undefined : "none" }}>{PromoCodesSection()}</div>
      <div style={{ display: activeSection === "access" ? undefined : "none" }}>{AdminAccessSection()}</div>

      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          description={confirmDialog.description}
          detail={confirmDialog.detail}
          variant={confirmDialog.variant}
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

// =============================================
// Reusable field component
// =============================================
function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-ink-muted mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none transition-colors bg-surface"
      />
    </div>
  );
}
