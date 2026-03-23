"use client";

import { useState } from "react";
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
} from "@/lib/actions/admin";

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
  const [activeSection, setActiveSection] = useState("packages");
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Local state for each section
  const [localPackages, setLocalPackages] = useState(packages);
  const [localSlots, setLocalSlots] = useState(timeSlots);
  const [localBikes, setLocalBikes] = useState(bikeRentals);
  const [localKit, setLocalKit] = useState(starterKit);
  const [localStaff, setLocalStaff] = useState(staff);
  const [localPromos, setLocalPromos] = useState(promos);

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
      is_popular: false,
    });

    const handleSave = async (pkg: any) => {
      setSaving(pkg.id);
      setError(null);
      const result = await updatePackage(pkg.id, {
        name: pkg.name,
        price_per_person: pkg.price_per_person,
        min_riders: pkg.min_riders,
        max_riders: pkg.max_riders,
        leaders_count: pkg.leaders_count,
        heroes_count: pkg.heroes_count,
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
        setLocalPackages((prev) => [...prev, { ...newPkg, id: crypto.randomUUID() }]);
        setShowNewForm(false);
        setNewPkg({ type: "", name: "", min_riders: 2, max_riders: 4, price_per_person: 2000, leaders_count: 1, heroes_count: 0, is_popular: false });
        showSaved("new");
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
                      <Field label="Price/Person (THB)" type="number" value={pkg.price_per_person} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, price_per_person: Number(v) } : p))} />
                      <Field label="Min Riders" type="number" value={pkg.min_riders} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, min_riders: Number(v) } : p))} />
                      <Field label="Max Riders" type="number" value={pkg.max_riders} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, max_riders: Number(v) } : p))} />
                      <Field label="Leaders" type="number" value={pkg.leaders_count} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, leaders_count: Number(v) } : p))} />
                      <Field label="Heroes" type="number" value={pkg.heroes_count} onChange={(v) => setLocalPackages((prev) => prev.map((p) => p.id === pkg.id ? { ...p, heroes_count: Number(v) } : p))} />
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
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setLocalPackages(packages); }}>
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
                      <Edit3 className="h-4 w-4 text-ink-muted" />
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
              <Field label="Type (slug)" value={newPkg.type} onChange={(v) => setNewPkg((p) => ({ ...p, type: v }))} />
              <Field label="Name" value={newPkg.name} onChange={(v) => setNewPkg((p) => ({ ...p, name: v }))} />
              <Field label="Price/Person" type="number" value={newPkg.price_per_person} onChange={(v) => setNewPkg((p) => ({ ...p, price_per_person: Number(v) }))} />
              <Field label="Min Riders" type="number" value={newPkg.min_riders} onChange={(v) => setNewPkg((p) => ({ ...p, min_riders: Number(v) }))} />
              <Field label="Max Riders" type="number" value={newPkg.max_riders} onChange={(v) => setNewPkg((p) => ({ ...p, max_riders: Number(v) }))} />
              <Field label="Leaders" type="number" value={newPkg.leaders_count} onChange={(v) => setNewPkg((p) => ({ ...p, leaders_count: Number(v) }))} />
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
                  {saving === slot.id ? "..." : "Save"}
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
  // BIKE RENTALS
  // =============================================
  const BikeRentalsSection = () => (
    <div className="space-y-3">
      {localBikes.map((bike) => (
        <Card key={bike.id} padding="sm">
          <div className="p-3 flex items-center gap-4">
            <Bike className="h-5 w-5 text-ink-muted flex-shrink-0" />
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={async () => {
                  setSaving(bike.id);
                  await updateBikeRental(bike.id, { type: bike.type, name: bike.name, price: bike.price });
                  setSaving(null);
                  showSaved(bike.id);
                }}
                disabled={saving === bike.id}
              >
                <Save className="h-3 w-3" />
                {saving === bike.id ? "..." : "Save"}
              </Button>
              {saved === bike.id && <CheckCircle2 className="h-4 w-4 text-success" />}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

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
                  setLocalKit((prev) => [...prev, { id: crypto.randomUUID(), name: newName, description: newDesc }]);
                  setShowNew(false);
                  setNewName("");
                  setNewDesc("");
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
                        <label className="text-[10px] text-ink-muted mb-1 block">Role</label>
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
                        {saving === member.id ? "..." : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setLocalStaff(staff); }}>Cancel</Button>
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
                      <Edit3 className="h-4 w-4 text-ink-muted" />
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
                <label className="text-[10px] text-ink-muted mb-1 block">Role</label>
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
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={async () => {
                setSaving("newstaff");
                const result = await createStaffMember(newMember);
                setSaving(null);
                if (result.success) {
                  setLocalStaff((prev) => [...prev, { ...newMember, id: crypto.randomUUID() }]);
                  setShowNew(false);
                  setNewMember({ name: "", nickname: "", role: "leader", phone: "", bio: "", max_sessions_per_day: 2 });
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
                        <label className="text-[10px] text-ink-muted mb-1 block">Discount Type</label>
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
                        {saving === promo.id ? "..." : "Save"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setLocalPromos(promos); }}>Cancel</Button>
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
                      <Edit3 className="h-4 w-4 text-ink-muted" />
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
                <label className="text-[10px] text-ink-muted mb-1 block">Discount Type</label>
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
                  setLocalPromos((prev) => [...prev, { ...newCode, id: crypto.randomUUID(), times_used: 0 }]);
                  setShowNew(false);
                  setNewCode({ code: "", discount_type: "percentage", discount_value: 10, max_uses: 0, valid_from: "", valid_until: "", is_active: true });
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
  // RENDER
  // =============================================
  const sectionContent: Record<string, () => React.ReactElement> = {
    packages: PackagesSection,
    slots: TimeSlotsSection,
    bikes: BikeRentalsSection,
    kit: StarterKitSection,
    staff: StaffSection,
    promos: PromoCodesSection,
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
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeSection === section.id
                ? "bg-ink text-cream"
                : "bg-surface border border-sand/60 text-ink-muted hover:bg-sand/20"
            }`}
          >
            <section.icon className="h-3.5 w-3.5" />
            {section.label}
          </button>
        ))}
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
      <label className="text-[10px] text-ink-muted mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none transition-colors bg-surface"
      />
    </div>
  );
}
