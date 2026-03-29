"use client";

import { useState, useRef, useCallback } from "react";
import {
  ImageIcon, Move, Upload, Save, X, ChevronDown, ChevronUp,
  Sun, Contrast, Droplets, RotateCcw, Eye, Check, Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  SiteImageSetting,
  updateImagePosition,
  updateImageSettings,
  replaceImage,
} from "@/lib/actions/site-images";
import { useToast } from "@/components/ui/Toast";

const CATEGORIES = [
  { id: "all", label: "All Images" },
  { id: "hero", label: "Hero" },
  { id: "team", label: "Team" },
  { id: "gallery", label: "Gallery" },
  { id: "equipment", label: "Equipment" },
  { id: "venue", label: "Venue" },
  { id: "booking", label: "Booking" },
  { id: "branding", label: "Branding" },
];

// Default aspect ratios per category (can be overridden per image)
const CATEGORY_ASPECT_RATIOS: Record<string, { ratio: string; label: string }> = {
  hero: { ratio: "aspect-[3/4]", label: "3:4 (Hero)" },
  team: { ratio: "aspect-[4/3]", label: "4:3 (Profile)" },
  gallery: { ratio: "aspect-square", label: "1:1 (Gallery)" },
  equipment: { ratio: "aspect-square", label: "1:1 (Gallery)" },
  venue: { ratio: "aspect-[4/3]", label: "4:3 (Venue)" },
  booking: { ratio: "aspect-[16/9]", label: "16:9 (Banner)" },
  branding: { ratio: "aspect-[16/9]", label: "16:9 (Banner)" },
};

// All available aspect ratios for the override selector
const ALL_ASPECT_RATIOS = [
  { value: "", label: "Default (category)" },
  { value: "aspect-[3/4]", label: "3:4 — Portrait" },
  { value: "aspect-[4/3]", label: "4:3 — Landscape" },
  { value: "aspect-square", label: "1:1 — Square" },
  { value: "aspect-[16/9]", label: "16:9 — Wide" },
  { value: "aspect-[9/16]", label: "9:16 — Tall" },
  { value: "aspect-[2/3]", label: "2:3 — Portrait Narrow" },
  { value: "aspect-[3/2]", label: "3:2 — Landscape Classic" },
  { value: "aspect-[21/9]", label: "21:9 — Ultra-Wide" },
];

export function SiteImageManager({ initialImages }: { initialImages: SiteImageSetting[] }) {
  const [images, setImages] = useState(initialImages);
  const [activeCategory, setActiveCategory] = useState("all");
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const filtered = activeCategory === "all"
    ? images
    : images.filter((img) => img.category === activeCategory);

  const updateLocal = (key: string, updates: Partial<SiteImageSetting>) => {
    setImages((prev) =>
      prev.map((img) => (img.image_key === key ? { ...img, ...updates } : img))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-accent" />
          Site Images
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Manage all images across the website. Adjust positioning, cropping, and filters for each image.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const count = cat.id === "all"
            ? images.length
            : images.filter((img) => img.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-ink text-cream"
                  : "bg-sand/30 text-ink-muted hover:bg-sand/50 hover:text-ink"
              }`}
            >
              {cat.label}
              <span className="text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Image grid */}
      <div className="grid gap-4">
        {filtered.map((img) => (
          <ImageCard
            key={img.image_key}
            image={img}
            isEditing={editingKey === img.image_key}
            onEdit={() => setEditingKey(editingKey === img.image_key ? null : img.image_key)}
            onUpdate={updateLocal}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <Card padding="lg" className="text-center text-ink-muted">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No images in this category.</p>
        </Card>
      )}
    </div>
  );
}

function ImageCard({
  image,
  isEditing,
  onEdit,
  onUpdate,
}: {
  image: SiteImageSetting;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (key: string, updates: Partial<SiteImageSetting>) => void;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [localPosition, setLocalPosition] = useState(image.object_position || "50% 50%");
  const [localBrightness, setLocalBrightness] = useState(image.brightness || 1);
  const [localContrast, setLocalContrast] = useState(image.contrast || 1);
  const [localSaturate, setLocalSaturate] = useState(image.saturate || 1);
  // Aspect ratio override: empty string means use category default
  const [localAspectRatio, setLocalAspectRatio] = useState(image.custom_css || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolve which aspect ratio to use: override → category default → 16:9
  const effectiveAspectRatio = localAspectRatio || CATEGORY_ASPECT_RATIOS[image.category]?.ratio || "aspect-[16/9]";
  const effectiveLabel = localAspectRatio
    ? ALL_ASPECT_RATIOS.find((ar) => ar.value === localAspectRatio)?.label || localAspectRatio
    : CATEGORY_ASPECT_RATIOS[image.category]?.label || "16:9";

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateImageSettings(image.image_key, {
        object_position: localPosition,
        brightness: localBrightness,
        contrast: localContrast,
        saturate: localSaturate,
        custom_css: localAspectRatio || undefined,
      });
      if (result.success) {
        onUpdate(image.image_key, {
          object_position: localPosition,
          brightness: localBrightness,
          contrast: localContrast,
          saturate: localSaturate,
          custom_css: localAspectRatio || undefined,
        });
        toast.success("Image settings saved");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error("Failed to save image settings");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image is too large. Maximum size is 10 MB.");
      return;
    }

    setReplacing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const result = await replaceImage(image.image_key, base64, file.name, file.type);
        if (result.success && result.url) {
          onUpdate(image.image_key, { current_url: result.url });
          toast.success("Image replaced successfully");
        } else {
          toast.error("Failed to upload image. Please try again.");
        }
      } catch {
        toast.error("Upload failed. Check your connection and try again.");
      } finally {
        setReplacing(false);
        // Reset file input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      toast.error("Could not read the file. Please try a different image.");
      setReplacing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setLocalPosition("50% 50%");
    setLocalBrightness(1);
    setLocalContrast(1);
    setLocalSaturate(1);
    setLocalAspectRatio("");
  };

  const filterStyle = {
    filter: `brightness(${localBrightness}) contrast(${localContrast}) saturate(${localSaturate})`,
  };

  return (
    <Card padding="sm" className="overflow-hidden !p-0">
      {/* Header — always visible */}
      <button
        onClick={onEdit}
        className="w-full flex items-center gap-4 p-4 hover:bg-sand/20 transition-colors"
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-sand/20 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.current_url}
            alt={image.label}
            className="w-full h-full object-cover"
            style={{ objectPosition: image.object_position, ...filterStyle }}
          />
        </div>

        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-sm truncate">{image.label}</p>
          <p className="text-xs text-ink-muted truncate">
            {image.image_key}
            <span className="text-ink-muted/50 ml-1.5">
              · {image.custom_css ? ALL_ASPECT_RATIOS.find((ar) => ar.value === image.custom_css)?.label || image.custom_css : CATEGORY_ASPECT_RATIOS[image.category]?.label || "16:9"}
            </span>
          </p>
        </div>

        <Badge variant="default" className="flex-shrink-0">{image.category}</Badge>

        {isEditing ? (
          <ChevronUp className="h-4 w-4 text-ink-muted flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-ink-muted flex-shrink-0" />
        )}
      </button>

      {/* Editor — expanded */}
      {isEditing && (
        <div className="border-t border-sand/60 p-4 space-y-4">
          {/* Preview with position editor */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Live preview — matches the actual aspect ratio used on site */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-ink-muted uppercase">Preview</p>
                <span className="text-xs text-ink-muted bg-sand/30 px-2 py-0.5 rounded-full">
                  {effectiveLabel}
                </span>
              </div>
              {/* Aspect ratio selector */}
              <div className="mb-2">
                <select
                  value={localAspectRatio}
                  onChange={(e) => setLocalAspectRatio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-sand/60 text-sm focus:border-ink focus:outline-none bg-surface"
                >
                  {ALL_ASPECT_RATIOS.map((ar) => (
                    <option key={ar.value} value={ar.value}>
                      {ar.value === "" ? `Default — ${CATEGORY_ASPECT_RATIOS[image.category]?.label || "16:9"}` : ar.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={`relative ${effectiveAspectRatio} rounded-xl overflow-hidden bg-sand/20 border border-sand/40`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.current_url}
                  alt={image.label}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: localPosition, ...filterStyle }}
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-mono">
                  {localPosition}
                </div>
              </div>
            </div>

            {/* Position control */}
            <div>
              <p className="text-xs font-semibold text-ink-muted uppercase mb-2">
                <Move className="h-3.5 w-3.5 inline mr-1" />
                Focal Point
              </p>
              <PositionPicker
                imageUrl={image.current_url}
                position={localPosition}
                onPositionChange={setLocalPosition}
                filterStyle={filterStyle}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid sm:grid-cols-3 gap-4">
            <FilterSlider
              icon={Sun}
              label="Brightness"
              value={localBrightness}
              onChange={setLocalBrightness}
              min={0.2}
              max={2}
              step={0.05}
            />
            <FilterSlider
              icon={Contrast}
              label="Contrast"
              value={localContrast}
              onChange={setLocalContrast}
              min={0.2}
              max={2}
              step={0.05}
            />
            <FilterSlider
              icon={Droplets}
              label="Saturation"
              value={localSaturate}
              onChange={setLocalSaturate}
              min={0}
              max={2}
              step={0.05}
            />
          </div>

          {/* Quick position presets */}
          <div>
            <p className="text-xs font-semibold text-ink-muted uppercase mb-2">Quick Positions</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                ["Center", "50% 50%"],
                ["Top", "50% 20%"],
                ["Bottom", "50% 80%"],
                ["Left", "20% 50%"],
                ["Right", "80% 50%"],
                ["Top-Left", "20% 20%"],
                ["Top-Right", "80% 20%"],
                ["Bottom-Left", "20% 80%"],
                ["Bottom-Right", "80% 80%"],
              ].map(([label, pos]) => (
                <button
                  key={label}
                  onClick={() => setLocalPosition(pos)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    localPosition === pos
                      ? "bg-accent text-white"
                      : "bg-sand/30 text-ink-muted hover:bg-sand/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-sand/40">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleReplace}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (replacing) {
                  setReplacing(false);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  toast.info("Upload cancelled");
                } else {
                  fileInputRef.current?.click();
                }
              }}
            >
              {replacing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading... <span className="text-xs opacity-70 ml-1">(click to cancel)</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Replace Image
                </>
              )}
            </Button>

            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>

            <div className="flex-1" />

            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className={saved ? "!bg-success" : ""}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saved ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// Visual focal point picker — click on the image to set the position
function PositionPicker({
  imageUrl,
  position,
  onPositionChange,
  filterStyle,
}: {
  imageUrl: string;
  position: string;
  onPositionChange: (pos: string) => void;
  filterStyle: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const parsePosition = (pos: string): { x: number; y: number } => {
    const parts = pos.split(" ").map((p) => parseFloat(p));
    return { x: parts[0] || 50, y: parts[1] || 50 };
  };

  const { x, y } = parsePosition(position);

  const handlePointerEvent = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const py = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      onPositionChange(`${Math.round(px)}% ${Math.round(py)}%`);
    },
    [onPositionChange]
  );

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] rounded-xl overflow-hidden bg-sand/20 border border-sand/40 cursor-crosshair select-none"
      onPointerDown={(e) => {
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        handlePointerEvent(e);
      }}
      onPointerMove={(e) => {
        if (isDragging) handlePointerEvent(e);
      }}
      onPointerUp={() => setIsDragging(false)}
    >
      {/* Full image (no crop) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Position picker"
        className="w-full h-full object-contain"
        style={filterStyle}
        draggable={false}
      />

      {/* Crosshair / focal point indicator */}
      <div
        className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <div className="w-full h-full rounded-full border-2 border-white shadow-lg" />
        <div className="absolute inset-[6px] rounded-full bg-accent" />
      </div>

      {/* Crosshair lines */}
      <div
        className="absolute top-0 bottom-0 w-px bg-white/40 pointer-events-none"
        style={{ left: `${x}%` }}
      />
      <div
        className="absolute left-0 right-0 h-px bg-white/40 pointer-events-none"
        style={{ top: `${y}%` }}
      />

      {/* Instruction */}
      <div className="absolute bottom-2 inset-x-2 text-center">
        <span className="text-[10px] text-white bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
          Click or drag to set focal point
        </span>
      </div>
    </div>
  );
}

function FilterSlider({
  icon: Icon,
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  icon: typeof Sun;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-ink-muted mb-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
        <span className="ml-auto font-mono text-[10px]">{value.toFixed(2)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-sand/40 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:cursor-grab"
      />
    </div>
  );
}
