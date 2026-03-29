"use client";

import { useState, useRef } from "react";
import { Trash2, Plus, Save, Play, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { HeroVideo, getHeroVideos, updateHeroVideos } from "@/lib/actions/hero-videos";
import { useToast } from "@/components/ui/Toast";

interface HeroVideoManagerProps {
  initialVideos: HeroVideo[];
}

export function HeroVideoManager({ initialVideos }: HeroVideoManagerProps) {
  const [videos, setVideos] = useState(initialVideos);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoLabel, setNewVideoLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const toast = useToast();

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) {
      toast.error("Please enter a video URL");
      return;
    }
    if (!newVideoLabel.trim()) {
      toast.error("Please enter a label");
      return;
    }

    setVideos([...videos, { src: newVideoUrl, label: newVideoLabel }]);
    setNewVideoUrl("");
    setNewVideoLabel("");
    toast.success("Video added to list");
  };

  const handleRemoveVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
    if (previewIndex === index) setPreviewIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newVideos = [...videos];
      [newVideos[index - 1], newVideos[index]] = [newVideos[index], newVideos[index - 1]];
      setVideos(newVideos);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < videos.length - 1) {
      const newVideos = [...videos];
      [newVideos[index], newVideos[index + 1]] = [newVideos[index + 1], newVideos[index]];
      setVideos(newVideos);
    }
  };

  const handleLabelChange = (index: number, newLabel: string) => {
    const newVideos = [...videos];
    newVideos[index].label = newLabel;
    setVideos(newVideos);
  };

  const handleSave = async () => {
    if (videos.length === 0) {
      toast.error("At least one video is required");
      return;
    }

    setSaving(true);
    try {
      const result = await updateHeroVideos(videos);
      if (result.success) {
        toast.success("Hero videos saved successfully");
        setPreviewIndex(null);
      } else {
        toast.error(result.error || "Failed to save videos");
      }
    } catch (error) {
      toast.error("Error saving videos");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const truncateUrl = (url: string, maxLength = 50) => {
    return url.length > maxLength ? url.substring(0, maxLength) + "..." : url;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Play className="h-5 w-5 text-accent" />
          Hero Videos
        </h2>
        <p className="text-sm text-ink-muted mt-1">
          Manage the video clips that play in the hero section. Reorder by dragging or using arrows.
        </p>
      </div>

      {/* Video list */}
      {videos.length > 0 && (
        <div className="space-y-3">
          {videos.map((video, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-3">
                {/* Drag handle */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <GripVertical className="h-4 w-4 text-ink-muted opacity-50" />
                </div>

                {/* Video info */}
                <div className="flex-1 min-w-0">
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                        Video URL
                      </label>
                      <button
                        onClick={() => setPreviewIndex(previewIndex === index ? null : index)}
                        className="text-sm text-accent hover:underline cursor-pointer block mt-1 truncate"
                        title={video.src}
                      >
                        {truncateUrl(video.src)}
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                        Label (i18n key or text)
                      </label>
                      <input
                        type="text"
                        value={video.label}
                        onChange={(e) => handleLabelChange(index, e.target.value)}
                        placeholder="e.g., hero.videoLabels.goldenHourMorning"
                        className="mt-1 w-full px-3 py-2 text-sm border border-sand/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {previewIndex === index && (
                    <div className="mt-3 aspect-video bg-ink/5 rounded-lg overflow-hidden border border-sand/30">
                      <video
                        ref={(el) => { videoRefs.current[index] = el; }}
                        src={video.src}
                        controls
                        className="w-full h-full object-cover"
                        onLoadedMetadata={() => {
                          const v = videoRefs.current[index];
                          if (v) v.currentTime = 0;
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setPreviewIndex(previewIndex === index ? null : index)}
                    className="p-2 hover:bg-sand/30 rounded-lg transition-colors"
                    title={previewIndex === index ? "Hide preview" : "Show preview"}
                  >
                    <Play className="h-4 w-4 text-ink-muted" />
                  </button>
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={`p-2 rounded-lg transition-colors ${
                      index === 0
                        ? "text-ink-muted/30 cursor-not-allowed"
                        : "hover:bg-sand/30 text-ink-muted"
                    }`}
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === videos.length - 1}
                    className={`p-2 rounded-lg transition-colors ${
                      index === videos.length - 1
                        ? "text-ink-muted/30 cursor-not-allowed"
                        : "hover:bg-sand/30 text-ink-muted"
                    }`}
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveVideo(index)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                    title="Delete video"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add new video form */}
      <Card className="p-4 bg-sand/20 border-dashed">
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Add New Video</h3>

          <div>
            <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              Supabase Storage URL
            </label>
            <input
              type="text"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="https://oqldbxkluuoyrmzehkpk.supabase.co/storage/v1/object/public/videos/..."
              className="mt-1 w-full px-3 py-2 text-sm border border-sand/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              Label (i18n key or text)
            </label>
            <input
              type="text"
              value={newVideoLabel}
              onChange={(e) => setNewVideoLabel(e.target.value)}
              placeholder="e.g., hero.videoLabels.goldenHourMorning"
              className="mt-1 w-full px-3 py-2 text-sm border border-sand/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <Button
            onClick={handleAddVideo}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Video
          </Button>
        </div>
      </Card>

      {/* Save button */}
      <div className="flex gap-2 justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Order"}
        </Button>
      </div>

      {/* Video count badge */}
      {videos.length > 0 && (
        <div className="text-xs text-ink-muted">
          {videos.length} video{videos.length !== 1 ? "s" : ""} configured
        </div>
      )}
    </div>
  );
}
