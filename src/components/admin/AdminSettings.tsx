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
  updateTimeSlot,
  updateBikeRental,
  updateStarterKitItem,
  createStarterKitItem,
  updateStaffMember,
  createStaffMember,
  updatePromoCode,
  createPromoCode,
  listAdmins,
  grantAdminAccess,
  revokeAdminAccess,
} from "@/lib/actions/admin";
import { Shield } from "lucide-react";

interface SectionProps {
  id: string;
  label: string;
  icon: typeof Settings;
}

const SECTIONS: SectionProps[] = [
  { id: "packages", label: "Ride Packages", icon: Package },
  { id: "slots", label: "Time Slots", icon: Clock },
  { id: "bikes", label: "Bike Rentals", icon: Bike },
  { id: "kit", label: "Starter Kit", icon: Gift },
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
      if (!confirm("You have unsaved changes. Switch tabs and lose them?")) return;
      // Revert current section to server state
      switch (activeSection) {
        case "packages": setLocalPackages(packages); break;
        case "slots": setLocalSlots(timeSlots); break;
        case "bikes": setLocalBikes(bikeRentals); break;
        case "kit": setLocalKit(starterKit); break;
        case "staff": setLocalStaff(staff); break;
        case "promos": setLocalPromos(promos); break;
      }
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

    const handleSave = async (pkg: any) => {
      setSaving(pkg.id);
      setError(null);
      const result = await updatePackage(pkg.id, {
        type: pkg.type,
        name: pkg.name,
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
      } else {
        setError("Failed to save");
      }
    };

    const handleCreate = async () => {
      setSaving("new");
      const result = await createPackage(newPkg);
      setSaving(null);
      if (result.success) {
        setShowNewForm(false);
        setNewPkg({ type: "", name: "", min_riders: 2, max_riders: 4, price_per_person: 2000, leaders_count: 1, heroes_count: 0, description: "", icon: "star", sort_order: (localPackages.length + 2) * 10, is_popular: false, is_active: true });
        showSaved("new");
        router.refresh(); // Fetch real DB IDs
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
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Field label="Name" value={pkg.name} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, name: v } : p))} />
                      <Field label="URL Key" value={pkg.type} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, type: v.toLowerCase().replace(/\s+/g, "_") } : p))} />
                      <Field label="Price/Person (THB)" type="number" value={pkg.price_per_person} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, price_per_person: Number(v) } : p))} />
                      <Field label="Min Riders" type="number" value={pkg.min_riders} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, min_riders: Number(v) } : p))} />
                      <Field label="Max Riders" type="number" value={pkg.max_riders} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, max_riders: Number(v) } : p))} />
                      <Field label="Leaders" type="number" value={pkg.leaders_count} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, leaders_count: Number(v) } : p))} />
                      <Field label="Heroes" type="number" value={pkg.heroes_count} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, heroes_count: Number(v) } : p))} />
                      <div>
                        <label className="text-[11px] text-ink-muted mb-1 block">Icon</label>
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
                      <label className="text-[11px] text-ink-muted mb-1 block">Description</label>
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
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(pkg)} disabled={saving === pkg.id}>
                        <Save className="h-3 w-3" />
                        {saving === pkg.id ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingId(null);
                        // Revert only this package, not all
                        const original = packages.find((p) => p.id === pkg.id);
                        if (original) setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? original : p));
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{pkg.name}</span>
                        <span className="text-xs text-ink-muted capitalize">({pkg.type})</span>
                        {pkg.is_popular && <Badge variant="accent">Popular</Badge>}
                        {pkg.is_active === false && <Badge variant="default">Inactive</Badge>}
                        {saved === pkg.id && <CheckCircle2 className="h-4 w-4 text-success" />}
                      </div>
                      <p className="text-xs text-ink-muted mt-1">
                        {pkg.price_per_person?.toLocaleString()} THB/person · {pkg.min_riders}–{pkg.max_riders} riders · {pkg.leaders_count} leader{pkg.leaders_count > 1 ? "s" : ""}, {pkg.heroes_count} hero{pkg.heroes_count !== 1 ? "es" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingId(pkg.id)}
                      className="p-2 rounded-lg hover:bg-sand/30 transition-colors"
                    >
                      <Edit3 className="h-4 w-4 text-ink-muted" aria-hidden="true" /><span className="sr-only">Edit</span>
                    </button>
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
              <Field label="Price/Person (THB)" type="number" value={newPkg.price_per_person} onChange={(v) => setNewPkg((p) => ({ ...p, price_per_person: Number(v) }))} />
              <Field label="Min Riders" type="number" value={newPkg.min_riders} onChange={(v) => setNewPkg((p) => ({ ...p, min_riders: Number(v) }))} />
              <Field label="Max Riders" type="number" value={newPkg.max_riders} onChange={(v) => setNewPkg((p) => ({ ...p, max_riders: Number(v) }))} />
              <Field label="Leaders" type="number" value={newPkg.leaders_count} onChange={(v) => setNewPkg((p) => ({ ...p, leaders_count: Number(v) }))} />
              <Field label="Heroes" type="number" value={newPkg.heroes_count} onChange={(v) => setNewPkg((p) => ({ ...p, heroes_count: Number(v) }))} />
              <div>
                <label className="text-[11px] text-ink-muted mb-1 block">Icon</label>
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
              <label className="text-[11px] text-ink-muted mb-1 block">Description</label>
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
          return (
            <Card key={bike.id} padding="sm">
              <div className="p-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Bike className="h-5 w-5 text-ink-muted" />
                      <span className="font-semibold text-sm">Editing: {bike.name}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Field
                        label="Type"
                        value={bike.type}
                        onChange={(v) => setLocalBikes((prev) => prev.map((b) => b.id === bike.id ? { ...b, type: v } : b))}
                      />
                      <Field
                        label="Name"
                        value={bike.name}
                        onChange={(v) => setLocalBikes((prev) => prev.map((b) => b.id === bike.id ? { ...b, name: v } : b))}
                      />
                      <Field
                        label="Price (THB)"
                        type="number"
                        value={bike.price}
                        onChange={(v) => setLocalBikes((prev) => prev.map((b) => b.id === bike.id ? { ...b, price: Number(v) } : b))}
                      />
                    </div>
                    <div className="flex gap-2">
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
                          } else {
                            setError("Failed to save bike rental");
                          }
                        }}
                        disabled={saving === bike.id}
                      >
                        <Save className="h-3 w-3" />
                        {saving === bike.id ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingBikeId(null);
                        const original = bikeRentals.find((b) => b.id === bike.id);
                        if (original) setLocalBikes((prev) => prev.map((b) => b.id === bike.id ? original : b));
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bike className="h-5 w-5 text-ink-muted flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{bike.name}</span>
                          <span className="text-xs text-ink-muted">({bike.type})</span>
                          {saved === bike.id && <CheckCircle2 className="h-4 w-4 text-success" />}
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">{bike.price?.toLocaleString()} THB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingBikeId(bike.id)}
                      className="p-2 rounded-lg hover:bg-sand/30 transition-colors"
                    >
                      <Edit3 className="h-4 w-4 text-ink-muted" aria-hidden="true" /><span className="sr-only">Edit</span>
                    </button>
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
                    await updateStarterKitItem(item.id, { name: item.name, description: item.description });
                    setSaving(null);
                    showSaved(item.id);
                  }}
                  disabled={saving === item.id}
                >
                  <Save className="h-3 w-3" />
                </Button>
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
                  router.refresh();
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
                        <label className="text-[11px] text-ink-muted mb-1 block">Role</label>
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
                        await updateStaffMember(member.id, {
                          name: member.name, nickname: member.nickname, role: member.role,
                          phone: member.phone, bio: member.bio, max_sessions_per_day: member.max_sessions_per_day, is_active: member.is_active,
                        });
                        setSaving(null);
                        showSaved(member.id);
                        setEditingId(null);
                      }} disabled={saving === member.id}>
                        <Save className="h-3 w-3" />
                        {saving === member.id ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingId(null);
                        const original = staff.find((s) => s.id === member.id);
                        if (original) setLocalStaff((prev) => prev.map((s) => s.id === member.id ? original : s));
                      }}>Cancel</Button>
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
                <label className="text-[11px] text-ink-muted mb-1 block">Role</label>
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
                  router.refresh();
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
                        <label className="text-[11px] text-ink-muted mb-1 block">Discount Type</label>
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
                        await updatePromoCode(promo.id, {
                          code: promo.code, discount_type: promo.discount_type,
                          discount_value: promo.discount_value, max_uses: promo.max_uses,
                          valid_from: promo.valid_from || null, valid_until: promo.valid_until || null,
                          is_active: promo.is_active,
                        });
                        setSaving(null);
                        showSaved(promo.id);
                        setEditingId(null);
                      }} disabled={saving === promo.id}>
                        <Save className="h-3 w-3" />
                        {saving === promo.id ? "Saving..." : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        setEditingId(null);
                        const original = promos.find((p) => p.id === promo.id);
                        if (original) setLocalPromos((prev) => prev.map((p) => p.id === promo.id ? original : p));
                      }}>Cancel</Button>
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
                <label className="text-[11px] text-ink-muted mb-1 block">Discount Type</label>
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
                  router.refresh();
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
        await loadAdmins();
      } else {
        setAccessMessage({ type: "error", text: result.message || "Failed to grant access" });
      }
      setAdminActionLoading(false);
    };

    const onRevoke = async (email: string) => {
      if (!confirm(`Revoke admin access for ${email}?`)) return;
      setAccessMessage(null);
      setAdminActionLoading(true);
      const result = await revokeAdminAccess(email);
      if (result.success) {
        setAccessMessage({ type: "success", text: `Admin access revoked for ${email}` });
        await loadAdmins();
      } else {
        setAccessMessage({ type: "error", text: result.message || "Failed to revoke access" });
      }
      setAdminActionLoading(false);
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
  const sectionContent: Record<string, () => React.ReactElement> = {
    packages: PackagesSection,
    slots: TimeSlotsSection,
    bikes: BikeRentalsSection,
    kit: StarterKitSection,
    staff: StaffSection,
    promos: PromoCodesSection,
    access: AdminAccessSection,
  };

  const ActiveContent = sectionContent[activeSection] || PackagesSection;

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

      {/* Active section content */}
      <ActiveContent />
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
      <label className="text-[11px] text-ink-muted mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none transition-colors bg-surface"
      />
    </div>
  );
}
