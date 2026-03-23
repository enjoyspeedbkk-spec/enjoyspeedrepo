"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Mail,
  Phone,
  Plus,
  Flag,
  Trash2,
  Calendar,
  Users,
  DollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CustomerWithStats } from "@/lib/actions/admin-customers";
import { addCustomerNote, getCustomerNotes, updateCustomerTier } from "@/lib/actions/admin-customers";

interface CustomerDirectoryProps {
  customers: CustomerWithStats[];
}

type TierFilter = "all" | "vip" | "regular" | "new" | "lapsed";

export function CustomerDirectory({ customers }: CustomerDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, any[]>>({});
  const [noteContent, setNoteContent] = useState("");
  const [noteLoading, setNoteLoading] = useState<string | null>(null);
  const [addingNote, setAddingNote] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (customer.full_name?.toLowerCase() || "").includes(searchLower) ||
        (customer.stats.lastEmail?.toLowerCase() || "").includes(searchLower) ||
        (customer.phone?.toLowerCase() || "").includes(searchLower) ||
        (customer.line_id?.toLowerCase() || "").includes(searchLower);

      if (!matchesSearch) return false;

      // Tier filter
      if (tierFilter === "all") return true;
      return (customer.customer_tier || "regular") === tierFilter;
    });
  }, [customers, searchTerm, tierFilter]);

  const getTierColor = (tier?: string): "accent" | "success" | "warning" | "sky" | "default" => {
    switch (tier || "regular") {
      case "vip":
        return "accent";
      case "regular":
        return "sky";
      case "new":
        return "success";
      case "lapsed":
        return "default";
      default:
        return "default";
    }
  };

  const getTierLabel = (tier?: string): string => {
    switch (tier || "regular") {
      case "vip":
        return "VIP";
      case "regular":
        return "Regular";
      case "new":
        return "New";
      case "lapsed":
        return "Lapsed";
      default:
        return "Regular";
    }
  };

  const handleExpandRow = async (customerId: string) => {
    if (expandedId === customerId) {
      setExpandedId(null);
    } else {
      setExpandedId(customerId);
      if (!notes[customerId]) {
        setNoteLoading(customerId);
        try {
          const customerNotes = await getCustomerNotes(customerId);
          setNotes((prev) => ({
            ...prev,
            [customerId]: customerNotes,
          }));
        } catch (error) {
          console.error("Error loading notes:", error);
        } finally {
          setNoteLoading(null);
        }
      }
    }
  };

  const handleAddNote = async (customerId: string) => {
    if (!noteContent.trim()) return;

    setAddingNote(customerId);
    try {
      const result = await addCustomerNote(customerId, noteContent, "general");
      if (result.success) {
        setNoteContent("");
        const updatedNotes = await getCustomerNotes(customerId);
        setNotes((prev) => ({
          ...prev,
          [customerId]: updatedNotes,
        }));
      } else {
        console.error("Error adding note:", result.error);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setAddingNote(null);
    }
  };

  const handleChangeTier = async (customerId: string, newTier: "vip" | "regular" | "new" | "lapsed") => {
    try {
      await updateCustomerTier(customerId, newTier);
      // Optionally reload or update UI
    } catch (error) {
      console.error("Error updating tier:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink mb-2">Customer Directory</h1>
        <p className="text-ink-muted">Manage and view customer information, booking history, and notes</p>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or Line ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-sand/60 text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {(["all", "vip", "regular", "new", "lapsed"] as TierFilter[]).map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                tierFilter === tier
                  ? "bg-ink text-cream"
                  : "bg-sand/40 text-ink hover:bg-sand/60"
              }`}
            >
              {tier === "all" ? "All Customers" : tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-ink-muted">
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
      </Card>

      {/* Customers Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full bg-cream rounded-lg border border-sand/60 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-7 gap-4 p-4 bg-sand/30 border-b border-sand/60 font-semibold text-sm text-ink sticky top-0">
            <div>Name</div>
            <div>Contact</div>
            <div className="text-center">Rides</div>
            <div className="text-center">Spent</div>
            <div className="text-center">Tier</div>
            <div className="text-center">Joined</div>
            <div className="text-center">Actions</div>
          </div>

          {/* Table rows */}
          <AnimatePresence mode="popLayout">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-sand/30 last:border-b-0"
                >
                  {/* Main row */}
                  <button
                    onClick={() => handleExpandRow(customer.id)}
                    className="w-full grid grid-cols-7 gap-4 p-4 hover:bg-sand/20 transition-colors text-left"
                  >
                    {/* Name */}
                    <div>
                      <p className="font-medium text-ink">{customer.full_name || "—"}</p>
                      <p className="text-xs text-ink-muted">{customer.line_id || "No Line ID"}</p>
                    </div>

                    {/* Contact */}
                    <div className="space-y-1">
                      {customer.stats.lastEmail ? (
                        <div className="flex items-center gap-2 text-sm text-ink">
                          <Mail className="h-3.5 w-3.5 text-ink-muted" />
                          <span className="truncate">{customer.stats.lastEmail}</span>
                        </div>
                      ) : null}
                      {customer.phone ? (
                        <div className="flex items-center gap-2 text-sm text-ink">
                          <Phone className="h-3.5 w-3.5 text-ink-muted" />
                          <span>{customer.phone}</span>
                        </div>
                      ) : null}
                      {!customer.stats.lastEmail && !customer.phone ? (
                        <p className="text-sm text-ink-muted">—</p>
                      ) : null}
                    </div>

                    {/* Rides */}
                    <div className="text-center">
                      <p className="font-semibold text-ink text-lg">{customer.stats.bookings}</p>
                      <p className="text-xs text-ink-muted">{customer.stats.riders} riders</p>
                    </div>

                    {/* Spent */}
                    <div className="text-center">
                      <p className="font-semibold text-ink text-lg">
                        ฿{(customer.stats.spent / 100).toFixed(2)}
                      </p>
                    </div>

                    {/* Tier */}
                    <div className="text-center">
                      <Badge variant={getTierColor(customer.customer_tier)}>
                        {getTierLabel(customer.customer_tier)}
                      </Badge>
                    </div>

                    {/* Joined */}
                    <div className="text-center">
                      <p className="font-medium text-ink text-sm">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Expand button */}
                    <div className="flex justify-center items-center">
                      <ChevronDown
                        className={`h-5 w-5 text-ink-muted transition-transform ${
                          expandedId === customer.id ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {expandedId === customer.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-sand/10 border-t border-sand/30 overflow-hidden"
                      >
                        <div className="p-4 space-y-4">
                          {/* Quick stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-cream rounded-lg p-3 border border-sand/40">
                              <p className="text-xs text-ink-muted flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Last Ride
                              </p>
                              <p className="font-semibold text-ink text-sm mt-1">
                                {customer.last_ride_date
                                  ? new Date(customer.last_ride_date).toLocaleDateString()
                                  : "Never"}
                              </p>
                            </div>
                            <div className="bg-cream rounded-lg p-3 border border-sand/40">
                              <p className="text-xs text-ink-muted flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                Total Riders
                              </p>
                              <p className="font-semibold text-ink text-sm mt-1">{customer.stats.riders}</p>
                            </div>
                            <div className="bg-cream rounded-lg p-3 border border-sand/40">
                              <p className="text-xs text-ink-muted flex items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5" />
                                Total Spent
                              </p>
                              <p className="font-semibold text-ink text-sm mt-1">
                                ฿{(customer.stats.spent / 100).toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-cream rounded-lg p-3 border border-sand/40">
                              <p className="text-xs text-ink-muted flex items-center gap-1.5">
                                <Flag className="h-3.5 w-3.5" />
                                Member Since
                              </p>
                              <p className="font-semibold text-ink text-sm mt-1">
                                {Math.floor(
                                  (Date.now() - new Date(customer.created_at).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                days
                              </p>
                            </div>
                          </div>

                          {/* Tier selector */}
                          <div className="bg-cream rounded-lg p-3 border border-sand/40">
                            <p className="text-xs text-ink-muted font-medium mb-2">Change Tier</p>
                            <div className="flex flex-wrap gap-2">
                              {(["vip", "regular", "new", "lapsed"] as const).map((tier) => (
                                <button
                                  key={tier}
                                  onClick={() => handleChangeTier(customer.id, tier)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    customer.customer_tier === tier
                                      ? "bg-accent text-cream"
                                      : "bg-sand/40 text-ink hover:bg-sand/60"
                                  }`}
                                >
                                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Notes section */}
                          <div className="bg-cream rounded-lg p-3 border border-sand/40 space-y-3">
                            <p className="text-xs text-ink-muted font-medium">Notes</p>

                            {/* Notes list */}
                            {noteLoading === customer.id ? (
                              <div className="text-sm text-ink-muted py-2">Loading notes...</div>
                            ) : (notes[customer.id] || []).length > 0 ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {notes[customer.id].map((note) => (
                                  <div key={note.id} className="bg-sand/20 rounded p-2 text-sm">
                                    <p className="text-ink">{note.content}</p>
                                    <p className="text-xs text-ink-muted mt-1">
                                      {new Date(note.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-ink-muted italic">No notes yet</p>
                            )}

                            {/* Add note */}
                            <div className="space-y-2">
                              <textarea
                                value={addingNote === customer.id ? noteContent : ""}
                                onChange={(e) => setNoteContent(e.target.value)}
                                onFocus={() => setAddingNote(customer.id)}
                                placeholder="Add a note..."
                                className="w-full px-3 py-2 rounded-lg border border-sand/40 text-ink text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                                rows={2}
                              />
                              {addingNote === customer.id && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      handleAddNote(customer.id);
                                    }}
                                    disabled={!noteContent.trim()}
                                    className="flex-1 px-3 py-2 rounded-lg bg-accent text-cream text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                  >
                                    Add Note
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAddingNote(null);
                                      setNoteContent("");
                                    }}
                                    className="px-3 py-2 rounded-lg bg-sand/40 text-ink text-sm font-medium hover:bg-sand/60 transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="p-8 text-center text-ink-muted">
                <p>No customers found matching your filters.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
