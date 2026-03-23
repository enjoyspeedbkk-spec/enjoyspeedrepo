"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  GripVertical,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getUploadedAssets,
  uploadAsset,
  deleteAsset,
  updateAsset,
  addToCarousel,
  removeFromCarousel,
  reorderCarousel,
} from "@/lib/actions/admin-content";

interface UploadedAsset {
  id: string;
  type: "banner" | "gallery" | "carousel" | "document";
  title: string;
  description?: string;
  storage_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  sort_order: number;
  is_active: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

type TabType = "banners" | "gallery" | "carousel" | "documents" | "all";

const tabs: { id: TabType; label: string }[] = [
  { id: "carousel", label: "Carousel" },
  { id: "banners", label: "Banners" },
  { id: "gallery", label: "Gallery" },
  { id: "documents", label: "Documents" },
  { id: "all", label: "All" },
];

export function ContentManager({ initialAssets }: { initialAssets: UploadedAsset[] }) {
  const [activeTab, setActiveTab] = useState<TabType>("banners");
  const [assets, setAssets] = useState<UploadedAsset[]>(initialAssets);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<UploadedAsset>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const filteredAssets = assets.filter((asset) => {
    if (activeTab === "all") return true;
    const typeMap: Record<TabType, string> = {
      banners: "banner",
      gallery: "gallery",
      carousel: "carousel",
      documents: "document",
      all: "",
    };
    return asset.type === typeMap[activeTab];
  });

  const filteredAssets_sorted = filteredAssets.sort((a, b) => a.sort_order - b.sort_order);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return ImageIcon;
    return FileText;
  };

  const getThumbnailUrl = (asset: UploadedAsset) => {
    if (asset.mime_type.startsWith("image/")) {
      return asset.storage_url;
    }
    return null;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Only images and PDFs are allowed");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setUploadingFile(file);
    setShowUploadForm(true);
  };

  const handleUpload = async (title: string) => {
    if (!uploadingFile) return;

    setUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;

        // Determine asset type from mime type
        let assetType: "banner" | "gallery" | "document" = "gallery";
        if (uploadingFile.type === "application/pdf") {
          assetType = "document";
        } else if (uploadingFile.type.startsWith("image/")) {
          assetType = activeTab === "banners" ? "banner" : "gallery";
        }

        const result = await uploadAsset(
          base64,
          uploadingFile.name,
          uploadingFile.type,
          assetType,
          title || uploadingFile.name
        );

        if (result.success) {
          const updated = await getUploadedAssets();
          setAssets(updated);
          setSuccess("Asset uploaded successfully");
          setTimeout(() => setSuccess(null), 2000);
          setShowUploadForm(false);
          setUploadingFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          setError(result.error || "Failed to upload asset");
        }
        setUploading(false);
      };
      reader.readAsDataURL(uploadingFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload asset");
      setUploading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm("Delete this asset?")) return;

    try {
      const result = await deleteAsset(assetId);
      if (result.success) {
        setAssets((prev) => prev.filter((a) => a.id !== assetId));
        setSuccess("Asset deleted");
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError("Failed to delete asset");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete asset");
    }
  };

  const handleAddToCarousel = async (assetId: string) => {
    const caption = prompt("Enter a caption for this carousel image:");
    if (caption === null) return;
    const result = await addToCarousel(assetId, caption);
    if (result.success) {
      const updated = await getUploadedAssets();
      setAssets(updated);
      setSuccess("Added to carousel");
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError("Failed to add to carousel");
    }
  };

  const handleRemoveFromCarousel = async (assetId: string) => {
    const result = await removeFromCarousel(assetId);
    if (result.success) {
      const updated = await getUploadedAssets();
      setAssets(updated);
      setSuccess("Removed from carousel");
      setTimeout(() => setSuccess(null), 2000);
    } else {
      setError("Failed to remove from carousel");
    }
  };

  const handleSaveEdit = async (assetId: string) => {
    try {
      const result = await updateAsset(assetId, editData);
      if (result.success) {
        setAssets((prev) =>
          prev.map((a) => (a.id === assetId ? { ...a, ...editData } : a))
        );
        setEditingId(null);
        setEditData({});
        setSuccess("Asset updated");
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError("Failed to update asset");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update asset");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink mb-2">Content & Media Manager</h1>
        <p className="text-ink-muted">Manage banners, gallery images, and documents</p>
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
            onClick={() => setActiveTab(tab.id)}
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

      {/* Upload Section */}
      <div>
        {!showUploadForm ? (
          <Button
            variant="secondary"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
            Upload Asset
          </Button>
        ) : (
          <Card padding="lg" className="bg-sand/20">
            <h3 className="font-bold text-ink mb-4">Upload New Asset</h3>
            <div className="space-y-4">
              {uploadingFile && (
                <div className="p-3 rounded-lg bg-white border border-sand">
                  <p className="text-sm font-medium text-ink">
                    {uploadingFile.name}
                  </p>
                  <p className="text-xs text-ink-light">
                    {formatFileSize(uploadingFile.size)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Asset Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Summer Promo Banner"
                  defaultValue={uploadingFile?.name.split(".")[0] || ""}
                  onChange={(e) => {
                    // Store in a temporary state
                    (e.target as any).dataset.title = e.target.value;
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-sand bg-white text-ink placeholder-ink-light focus:outline-none focus:ring-2 focus:ring-accent"
                  id="upload-title"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  loading={uploading}
                  onClick={() => {
                    const titleInput = document.getElementById(
                      "upload-title"
                    ) as HTMLInputElement;
                    handleUpload(titleInput?.value || "");
                  }}
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setShowUploadForm(false);
                    setUploadingFile(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Assets Grid */}
      <div>
        {filteredAssets_sorted.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-ink-light">No assets in this category</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets_sorted.map((asset) => {
              const Icon = getFileIcon(asset.mime_type);
              const thumbnail = getThumbnailUrl(asset);

              return (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() =>
                    setExpandedId(expandedId === asset.id ? null : asset.id)
                  }
                >
                  <Card hover className="h-full flex flex-col">
                    {/* Thumbnail */}
                    <div className="relative bg-sand/40 rounded-lg overflow-hidden mb-3 h-40 flex items-center justify-center">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Icon className="h-8 w-8 text-ink-light" />
                          <p className="text-xs text-ink-light font-medium">
                            {asset.mime_type.split("/")[1].toUpperCase()}
                          </p>
                        </div>
                      )}

                      {/* Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={asset.is_active ? "success" : "default"}
                        >
                          {asset.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-medium text-ink text-sm line-clamp-1 mb-1">
                        {asset.title}
                      </h3>
                      <p className="text-xs text-ink-light">
                        {formatFileSize(asset.file_size)}
                      </p>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedId === asset.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-sand/60 space-y-3"
                        >
                          {editingId === asset.id ? (
                            <>
                              <div>
                                <label className="block text-xs font-semibold text-ink-light uppercase tracking-wide mb-1">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={editData.title || asset.title}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      title: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-1 rounded-lg border border-sand bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-ink-light uppercase tracking-wide mb-1">
                                  Sort Order
                                </label>
                                <input
                                  type="number"
                                  value={editData.sort_order || asset.sort_order}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      sort_order: parseInt(e.target.value),
                                    })
                                  }
                                  className="w-full px-3 py-1 rounded-lg border border-sand bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-ink-light uppercase tracking-wide mb-1">
                                  Description
                                </label>
                                <textarea
                                  value={editData.description || asset.description || ""}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      description: e.target.value,
                                    })
                                  }
                                  rows={2}
                                  className="w-full px-3 py-1 rounded-lg border border-sand bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    handleSaveEdit(asset.id);
                                  }}
                                >
                                  <Check className="h-3 w-3" />
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
                              {asset.description && (
                                <div>
                                  <p className="text-xs font-semibold text-ink-light uppercase tracking-wide mb-1">
                                    Description
                                  </p>
                                  <p className="text-xs text-ink line-clamp-2">
                                    {asset.description}
                                  </p>
                                </div>
                              )}

                              <div className="flex items-center gap-1">
                                <GripVertical className="h-3 w-3 text-ink-light" />
                                <p className="text-xs text-ink-light">
                                  Sort: {asset.sort_order}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2 pt-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    setEditingId(asset.id);
                                    setEditData(asset);
                                  }}
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Edit
                                </Button>
                                {asset.type === "gallery" && asset.mime_type.startsWith("image/") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddToCarousel(asset.id)}
                                  >
                                    <ImageIcon className="h-3 w-3" />
                                    Add to Carousel
                                  </Button>
                                )}
                                {asset.type === "carousel" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveFromCarousel(asset.id)}
                                  >
                                    Remove from Carousel
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-warning hover:bg-warning/10"
                                  onClick={() => {
                                    handleDelete(asset.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
