"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { uploadPaymentSlip } from "@/lib/actions/slip-upload";

interface SlipUploadProps {
  bookingId: string;
  onUploaded?: (slipUrl: string) => void;
}

export function SlipUpload({ bookingId, onUploaded }: SlipUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];

    if (!allowedTypes.includes(selected.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    if (selected.size > maxSize) {
      setError("Image must be under 5MB.");
      return;
    }

    setFile(selected);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // Convert to base64 for server action
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      const result = await uploadPaymentSlip(
        bookingId,
        base64,
        file.type,
        file.name
      );

      if (result.success) {
        setUploaded(true);
        onUploaded?.(result.slipUrl || "");
      } else {
        setError(result.error || "Upload failed. Please try again.");
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (uploaded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20"
      >
        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-ink">Slip uploaded successfully</p>
          <p className="text-xs text-ink-muted mt-0.5">
            Our team will verify your payment within 15 minutes. You&apos;ll get a confirmation via LINE.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold text-sm mb-2">Upload payment slip</h3>
      <p className="text-xs text-ink-muted mb-3">
        After paying, upload your payment confirmation slip. Our team will
        verify it within 15 minutes.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="picker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-6 rounded-xl border-2 border-dashed border-sand/60 bg-surface hover:border-ink/20 hover:bg-sand/10 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sand/30 group-hover:bg-accent/10 transition-colors">
                    <Camera className="h-5 w-5 text-ink-muted group-hover:text-accent transition-colors" />
                  </div>
                  <div className="p-2 rounded-lg bg-sand/30 group-hover:bg-accent/10 transition-colors">
                    <ImageIcon className="h-5 w-5 text-ink-muted group-hover:text-accent transition-colors" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-ink">
                    Take a photo or choose an image
                  </p>
                  <p className="text-xs text-ink-muted mt-1">
                    JPG, PNG, or WebP · Max 5MB
                  </p>
                </div>
              </div>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Image preview */}
            <div className="relative rounded-xl overflow-hidden border border-sand/60">
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Payment slip preview"
                  className="w-full max-h-64 object-contain bg-sand/10"
                />
              )}
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-ink/70 text-cream hover:bg-ink transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* File info */}
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>{file.name}</span>
              <span>{(file.size / 1024).toFixed(0)} KB</span>
            </div>

            {/* Upload button */}
            <Button
              variant="secondary"
              fullWidth
              onClick={handleUpload}
              loading={uploading}
              disabled={uploading}
            >
              {uploading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Payment Slip
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 text-sm text-error"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}
    </div>
  );
}
