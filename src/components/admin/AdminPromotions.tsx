"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Save,
  Megaphone,
  Calendar,
  Percent,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Tag,
  Users,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  type Promotion,
} from "@/lib/actions/promotions";

const PACKAGE_OPTIONS = [
  { value: "duo", label: "Duo" },
  { value: "squad", label: "Squad" },
  { value: "peloton", label: "Peloton" },
];

const BADGE_COLORS = [
  { value: "#F59E0B", label: "Gold" },
  { value: "#EF4444", label: "Red" },
  { value: "#10B981", label: "Green" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
];

interface PromoForm {
  name: string;
  name_th: string;
  description: string;
  description_th: string;
  badge_label: string;
  badge_color: string;
  discount_type: "percentage" | "fixed_per_person";
  discount_value: string;
  starts_on: string;
  ends_on: string;
  applicable_packages: string[];
  min_riders: string;
  max_uses: string;
  is_active: boolean;
}

const emptyForm: PromoForm = {
  name: "",
  name_th: "",
  description: "",
  description_th: "",
  badge_label: "PROMO",
  badge_color: "#F59E0B",
  discount_type: "percentage",
  discount_value: "",
  starts_on: "",
  ends_on: "",
  applicable_packages: [],
  min_riders: "",
  max_uses: "",
  is_active: true,
};

export function AdminPromotions() {
  const toast = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Load promotions
  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    setLoading(true);
    const data = await getAllPromotions();
    setPromotions(data);
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (promo: Promotion) => {
    setEditingId(promo.id);
    setForm({
      name: promo.name,
      name_th: promo.name_th || "",
      description: promo.description || "",
      description_th: promo.description_th || "",
      badge_label: promo.badge_label,
      badge_color: promo.badge_color,
      discount_type: promo.discount_type,
      discount_value: String(promo.discount_value),
      starts_on: promo.starts_on,
      ends_on: promo.ends_on,
      applicable_packages: promo.applicable_packages || [],
      min_riders: promo.min_riders ? String(promo.min_riders) : "",
      max_uses: promo.max_uses ? String(promo.max_uses) : "",
      is_active: promo.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.discount_value || !form.starts_on || !form.ends_on) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(form.ends_on) < new Date(form.starts_on)) {
      toast.error("End date must be after start date");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name,
      name_th: form.name_th || null,
      description: form.description || null,
      description_th: form.description_th || null,
      badge_label: form.badge_label,
      badge_color: form.badge_color,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      starts_on: form.starts_on,
      ends_on: form.ends_on,
      applicable_packages: form.applicable_packages.length > 0 ? form.applicable_packages : null,
      min_riders: form.min_riders ? Number(form.min_riders) : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      is_active: form.is_active,
    };

    let result;
    if (editingId) {
      result = await updatePromotion(editingId, payload);
    } else {
      result = await createPromotion(payload);
    }

    setSaving(false);

    if (result.success) {
      toast.success(editingId ? "Promotion updated" : "Promotion created");
      setShowForm(false);
      loadPromotions();
    } else {
      toast.error(result.error || "Failed to save promotion");
    }
  };

  const handleDelete = (promo: Promotion) => {
    setConfirmDialog({
      open: true,
      title: "Delete Promotion",
      description: `Delete "${promo.name}"? This cannot be undone.`,
      onConfirm: async () => {
        const result = await deletePromotion(promo.id);
        if (result.success) {
          toast.success("Promotion deleted");
          loadPromotions();
        } else {
          toast.error(result.error || "Failed to delete");
        }
        setConfirmDialog(null);
      },
    });
  };

  const handleToggleActive = async (promo: Promotion) => {
    const result = await updatePromotion(promo.id, {
      is_active: !promo.is_active,
    });
    if (result.success) {
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === promo.id ? { ...p, is_active: !p.is_active } : p
        )
      );
    }
  };

  const isActive = (promo: Promotion) => {
    const now = new Date().toISOString().split("T")[0];
    return promo.is_active && promo.starts_on <= now && promo.ends_on >= now;
  };

  const isUpcoming = (promo: Promotion) => {
    const now = new Date().toISOString().split("T")[0];
    return promo.is_active && promo.starts_on > now;
  };

  const isExpired = (promo: Promotion) => {
    const now = new Date().toISOString().split("T")[0];
    return promo.ends_on < now;
  };

  const togglePackage = (pkg: string) => {
    setForm((prev) => ({
      ...prev,
      applicable_packages: prev.applicable_packages.includes(pkg)
        ? prev.applicable_packages.filter((p) => p !== pkg)
        : [...prev.applicable_packages, pkg],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-ink">Promotions</h3>
          <p className="text-sm text-ink-muted mt-0.5">
            Time-based discounts shown on the booking calendar. Different from promo codes.
          </p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Promotion
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="p-6 border-accent/30 bg-accent/5">
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-bold text-ink flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              {editingId ? "Edit Promotion" : "New Promotion"}
            </h4>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 rounded hover:bg-sand/40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Songkran Special"
                className="w-full px-3 py-2 rounded-lg border border-sand/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Name (Thai)
              </label>
              <input
                type="text"
                value={form.name_th}
                onChange={(e) => setForm({ ...form, name_th: e.target.value })}
                placeholder="ชื่อภาษาไทย"
                className="w-full px-3 py-2 rounded-lg border border-sand/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. 20% off all packages"
                className="w-full px-3 py-2 rounded-lg border border-sand/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Description (Thai)
              </label>
              <input
                type="text"
                value={form.description_th}
                onChange={(e) => setForm({ ...form, description_th: e.target.value })}
                placeholder="คำอธิบายภาษาไทย"
                className="w-full px-3 py-2 rounded-lg border border-sand/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Discount Type *
              </label>
              <select
                value={form.discount_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discount_type: e.target.value as "percentage" | "fixed_per_person",
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-sand/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_per_person">Fixed per person (THB)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Discount Value *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) =>
                    setForm({ ...form, discount_value: e.target.value })
                  }
                  placeholder={
                    form.discount_type === "percentage" ? "e.g. 20" : "e.g. 500"
                  }
                  className="w-full px-3 py-2 pr-12 rounded-lg border border-sand/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">
                  {form.discount_type === "percentage" ? "%" : "THB"}
                </span>
              </div>
            </div>

            {/* Date range */}
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Starts On *
              </label>
              <input
                type="date"
                value={form.starts_on}
                onChange={(e) => setForm({ ...form, starts_on: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-sand/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Ends On *
              </label>
              <input
                type="date"
                value={form.ends_on}
                onChange={(e) => setForm({ ...form, ends_on: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-sand/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {/* Badge appearance */}
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Badge Label
              </label>
              <input
                type="text"
                value={form.badge_label}
                onChange={(e) =>
                  setForm({ ...form, badge_label: e.target.value })
                }
                placeholder="PROMO"
                maxLength={12}
                className="w-full px-3 py-2 rounded-lg border border-sand/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Badge Color
              </label>
              <div className="flex gap-2">
                {BADGE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm({ ...form, badge_color: c.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      form.badge_color === c.value
                        ? "border-ink scale-110 shadow"
                        : "border-transparent hover:border-ink/20"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Badge preview */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Preview
              </label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-sand/60">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wide"
                  style={{ backgroundColor: form.badge_color }}
                >
                  {form.badge_label || "PROMO"}
                </span>
                <span className="text-sm font-medium text-ink">
                  {form.name || "Promotion Name"} —{" "}
                  {form.discount_value
                    ? form.discount_type === "percentage"
                      ? `${form.discount_value}% off`
                      : `${Number(form.discount_value).toLocaleString()} THB off`
                    : "..."}
                </span>
              </div>
            </div>

            {/* Applicable packages */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Applicable Packages
                <span className="font-normal text-ink-muted/60 ml-1">
                  (leave empty = all packages)
                </span>
              </label>
              <div className="flex gap-2">
                {PACKAGE_OPTIONS.map((pkg) => (
                  <button
                    key={pkg.value}
                    type="button"
                    onClick={() => togglePackage(pkg.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.applicable_packages.includes(pkg.value)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-sand/60 bg-white text-ink-muted hover:border-ink/20"
                    }`}
                  >
                    {pkg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Min riders + max uses */}
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Min Riders
                <span className="font-normal text-ink-muted/60 ml-1">(optional)</span>
              </label>
              <input
                type="number"
                value={form.min_riders}
                onChange={(e) =>
                  setForm({ ...form, min_riders: e.target.value })
                }
                placeholder="No minimum"
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-sand/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">
                Max Uses
                <span className="font-normal text-ink-muted/60 ml-1">(optional)</span>
              </label>
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) =>
                  setForm({ ...form, max_uses: e.target.value })
                }
                placeholder="Unlimited"
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-sand/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          {/* Active toggle + save */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-sand/40">
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className="flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              {form.is_active ? (
                <ToggleRight className="h-5 w-5 text-success" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-ink-muted" />
              )}
              {form.is_active ? "Active" : "Inactive"}
            </button>
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </div>
        </Card>
      )}

      {/* Promotions List */}
      {promotions.length === 0 && !showForm ? (
        <Card className="p-10 text-center">
          <Megaphone className="h-10 w-10 text-ink-muted/30 mx-auto mb-3" />
          <p className="text-ink-muted text-sm">
            No promotions yet. Create one to highlight deals on the booking calendar.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => {
            const active = isActive(promo);
            const upcoming = isUpcoming(promo);
            const expired = isExpired(promo);
            return (
              <Card
                key={promo.id}
                className={`p-4 transition-all ${
                  !promo.is_active
                    ? "opacity-50"
                    : active
                    ? "border-success/30 bg-success/5"
                    : upcoming
                    ? "border-accent/30 bg-accent/5"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Badge preview */}
                    <span
                      className="mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wide flex-shrink-0"
                      style={{ backgroundColor: promo.badge_color }}
                    >
                      {promo.badge_label}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-ink">
                          {promo.name}
                        </h4>
                        {active && (
                          <Badge variant="success">Active Now</Badge>
                        )}
                        {upcoming && <Badge variant="accent">Upcoming</Badge>}
                        {expired && <Badge variant="default">Expired</Badge>}
                        {!promo.is_active && (
                          <Badge variant="default">Disabled</Badge>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted mt-1">
                        {promo.discount_type === "percentage"
                          ? `${promo.discount_value}% off`
                          : `${promo.discount_value.toLocaleString()} THB off per person`}
                        {promo.applicable_packages
                          ? ` · ${promo.applicable_packages.join(", ")}`
                          : " · All packages"}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(promo.starts_on).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          –{" "}
                          {new Date(promo.ends_on).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {promo.max_uses && (
                          <span>
                            {promo.current_uses}/{promo.max_uses} used
                          </span>
                        )}
                        {promo.min_riders && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Min {promo.min_riders} riders
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(promo)}
                      className="p-1.5 rounded hover:bg-sand/40 transition-colors"
                      title={promo.is_active ? "Disable" : "Enable"}
                    >
                      {promo.is_active ? (
                        <ToggleRight className="h-4 w-4 text-success" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-ink-muted" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(promo)}
                      className="p-1.5 rounded hover:bg-sand/40 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="h-4 w-4 text-ink-muted" />
                    </button>
                    <button
                      onClick={() => handleDelete(promo)}
                      className="p-1.5 rounded hover:bg-error/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-error/70" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          description={confirmDialog.description}
          variant="danger"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
