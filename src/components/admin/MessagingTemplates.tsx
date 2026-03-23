"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Save,
  X,
  Trash2,
  ChevronDown,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getMessageTemplates,
  updateMessageTemplate,
  createMessageTemplate,
  deleteMessageTemplate,
  getAutoresponders,
  toggleAutoresponder,
} from "@/lib/actions/admin-messaging";

interface MessageTemplate {
  id: string;
  type: "email" | "line" | "sms";
  name: string;
  subject?: string;
  content: string;
  language?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Autoresponder {
  id: string;
  trigger_event: string;
  messaging_template_id: string;
  enabled: boolean;
  messaging_templates: {
    name: string;
    type: string;
  };
}

const tabs = [
  { id: "email", label: "Email" },
  { id: "line", label: "LINE" },
  { id: "sms", label: "SMS" },
];

export function MessagingTemplates({ initialTemplates }: { initialTemplates: MessageTemplate[] }) {
  const [activeTab, setActiveTab] = useState<"email" | "line" | "sms">("email");
  const [templates, setTemplates] = useState<MessageTemplate[]>(initialTemplates);
  const [autoresponders, setAutoresponders] = useState<Autoresponder[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<MessageTemplate>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    content: "",
    language: "en",
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const filteredTemplates = templates.filter((t) => t.type === activeTab);

  useEffect(() => {
    loadAutoresponders();
  }, []);

  const loadAutoresponders = async () => {
    try {
      const data = await getAutoresponders();
      setAutoresponders(data);
    } catch (err) {
      console.error("Failed to load autoresponders:", err);
    }
  };

  const handleSaveEdit = async (templateId: string) => {
    setSaving(templateId);
    setError(null);
    try {
      const result = await updateMessageTemplate(templateId, editData);
      if (result.success) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === templateId ? { ...t, ...editData } : t))
        );
        setEditingId(null);
        setSuccess("Template updated");
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(result.error || "Failed to update template");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update template");
    } finally {
      setSaving(null);
    }
  };

  const handleCreateTemplate = async () => {
    setSaving("new");
    setError(null);
    try {
      const result = await createMessageTemplate({
        type: activeTab,
        name: newTemplate.name,
        subject: newTemplate.subject || undefined,
        content: newTemplate.content,
        language: newTemplate.language,
      });

      if (result.success) {
        // Reload templates
        const updated = await getMessageTemplates();
        setTemplates(updated);
        setNewTemplate({ name: "", subject: "", content: "", language: "en" });
        setShowNewForm(false);
        setSuccess("Template created");
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(result.error || "Failed to create template");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Delete this template?")) return;
    setSaving(templateId);
    setError(null);
    try {
      const result = await deleteMessageTemplate(templateId);
      if (result.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        setSuccess("Template deleted");
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError("Failed to delete template");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
    } finally {
      setSaving(null);
    }
  };

  const handleToggleAutoresponder = async (id: string, currentEnabled: boolean) => {
    setSaving(id);
    try {
      const result = await toggleAutoresponder(id, !currentEnabled);
      if (result.success) {
        setAutoresponders((prev) =>
          prev.map((a) => (a.id === id ? { ...a, enabled: !currentEnabled } : a))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle autoresponder");
    } finally {
      setSaving(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink mb-2">Messaging Templates</h1>
        <p className="text-ink-muted">Manage email, LINE, and SMS templates</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30 text-warning"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/30 text-success"
        >
          <Check className="h-5 w-5 flex-shrink-0" />
          {success}
        </motion.div>
      )}

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-sand/60">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium text-sm transition-all border-b-2 ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-ink-light hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* New Template Form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card padding="lg" className="bg-sand/20">
              <h3 className="font-bold text-ink mb-4">Create New Template</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, name: e.target.value })
                    }
                    placeholder="e.g., Booking Confirmation"
                    className="w-full px-4 py-2 rounded-lg border border-sand bg-white text-ink placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                {activeTab === "email" && (
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={newTemplate.subject}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, subject: e.target.value })
                      }
                      placeholder="Email subject line"
                      className="w-full px-4 py-2 rounded-lg border border-sand bg-white text-ink placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Content
                  </label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, content: e.target.value })
                    }
                    placeholder="Template content (supports variables like {{name}}, {{booking_id}}, etc)"
                    rows={6}
                    className="w-full px-4 py-2 rounded-lg border border-sand bg-white text-ink placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Language
                  </label>
                  <select
                    value={newTemplate.language}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, language: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-sand bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="en">English</option>
                    <option value="th">Thai</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="md"
                    loading={saving === "new"}
                    onClick={handleCreateTemplate}
                  >
                    <Plus className="h-4 w-4" />
                    Create Template
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setShowNewForm(false);
                      setNewTemplate({
                        name: "",
                        subject: "",
                        content: "",
                        language: "en",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add button */}
      {!showNewForm && (
        <Button
          variant="secondary"
          size="md"
          onClick={() => setShowNewForm(true)}
        >
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      )}

      {/* Templates List */}
      <div className="space-y-3">
        {filteredTemplates.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-ink-light">No {activeTab} templates yet</p>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="cursor-pointer rounded-2xl bg-surface border border-sand/60 shadow-sm p-6 hover:shadow-lg hover:border-sand"
                onClick={() =>
                  setExpandedId(expandedId === template.id ? null : template.id)
                }
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-ink text-base">
                          {template.name}
                        </h3>
                        <Badge variant={template.is_active ? "success" : "default"}>
                          {template.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-ink-light line-clamp-1">
                        {template.content.substring(0, 80)}...
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-ink-muted transition-transform ${
                        expandedId === template.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {expandedId === template.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4 border-t border-sand/60"
                      >
                        {editingId === template.id ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-ink mb-2">
                                Name
                              </label>
                              <input
                                type="text"
                                value={editData.name || template.name}
                                onChange={(e) =>
                                  setEditData({ ...editData, name: e.target.value })
                                }
                                className="w-full px-4 py-2 rounded-lg border border-sand bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                            </div>

                            {activeTab === "email" && (
                              <div>
                                <label className="block text-sm font-medium text-ink mb-2">
                                  Subject
                                </label>
                                <input
                                  type="text"
                                  value={editData.subject || template.subject || ""}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      subject: e.target.value,
                                    })
                                  }
                                  className="w-full px-4 py-2 rounded-lg border border-sand bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-ink mb-2">
                                Content
                              </label>
                              <textarea
                                value={editData.content || template.content}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    content: e.target.value,
                                  })
                                }
                                rows={6}
                                className="w-full px-4 py-2 rounded-lg border border-sand bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                              />
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="primary"
                                size="sm"
                                loading={saving === template.id}
                                onClick={() => handleSaveEdit(template.id)}
                              >
                                <Save className="h-4 w-4" />
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditData({});
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            {template.subject && (
                              <div>
                                <p className="text-xs font-semibold text-ink-light uppercase tracking-wide mb-1">
                                  Subject
                                </p>
                                <p className="text-sm text-ink bg-sand/20 p-3 rounded-lg font-mono">
                                  {template.subject}
                                </p>
                              </div>
                            )}

                            <div>
                              <p className="text-xs font-semibold text-ink-light uppercase tracking-wide mb-1">
                                Content
                              </p>
                              <p className="text-sm text-ink bg-sand/20 p-3 rounded-lg whitespace-pre-wrap font-mono">
                                {template.content}
                              </p>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  copyToClipboard(template.content, template.id);
                                }}
                              >
                                {copied === template.id ? (
                                  <>
                                    <Check className="h-4 w-4" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4" />
                                    Copy
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setEditingId(template.id);
                                  setEditData(template);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-warning hover:bg-warning/10"
                                onClick={() => {
                                  handleDelete(template.id);
                                }}
                                loading={saving === template.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Autoresponders Section */}
      <div className="mt-12 pt-8 border-t border-sand/60">
        <h2 className="text-2xl font-bold text-ink mb-4">Auto-Responders</h2>
        <div className="space-y-3">
          {autoresponders.length === 0 ? (
            <Card padding="lg" className="text-center">
              <p className="text-ink-light">No auto-responders configured</p>
            </Card>
          ) : (
            autoresponders.map((responder) => (
              <motion.div
                key={responder.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-ink">
                        {responder.trigger_event}
                      </p>
                      <p className="text-sm text-ink-light">
                        Sends: {responder.messaging_templates.name} (
                        {responder.messaging_templates.type.toUpperCase()})
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={responder.enabled}
                        onChange={(e) =>
                          handleToggleAutoresponder(responder.id, responder.enabled)
                        }
                        disabled={saving === responder.id}
                        className="w-4 h-4 rounded border-sand cursor-pointer"
                      />
                      <span className="text-sm font-medium text-ink-light">
                        {responder.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
