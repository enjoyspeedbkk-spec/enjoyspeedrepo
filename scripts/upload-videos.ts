/**
 * Upload videos to Supabase Storage for production use.
 *
 * Usage:
 *   npx tsx scripts/upload-videos.ts
 *
 * Prerequisites:
 *   - Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 *   - Create a "videos" storage bucket in Supabase (public access)
 *
 * After running, update Hero.tsx video src to use the returned public URL.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const BUCKET = "videos";
const videosDir = path.join(__dirname, "../public/videos");

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: ["video/mp4", "video/webm"],
    });
    if (error) {
      console.error("Failed to create bucket:", error);
      process.exit(1);
    }
    console.log(`Created "${BUCKET}" bucket`);
  }
}

async function uploadVideo(fileName: string) {
  const filePath = path.join(videosDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  console.log(`Uploading ${fileName} (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB)...`);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, fileBuffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error) {
    console.error(`Upload failed for ${fileName}:`, error);
    return;
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  console.log(`✓ ${fileName} → ${urlData.publicUrl}`);
  return urlData.publicUrl;
}

async function main() {
  await ensureBucket();

  const files = fs.readdirSync(videosDir).filter((f) => f.endsWith(".mp4"));
  console.log(`Found ${files.length} video(s) to upload\n`);

  const urls: Record<string, string> = {};
  for (const file of files) {
    const url = await uploadVideo(file);
    if (url) urls[file] = url;
  }

  console.log("\n--- Done! Update your Hero.tsx with these URLs ---");
  for (const [file, url] of Object.entries(urls)) {
    console.log(`${file}: ${url}`);
  }
  console.log("\nOr use the environment variable approach:");
  console.log("NEXT_PUBLIC_VIDEO_BASE_URL=<supabase-storage-url>/videos");
}

main().catch(console.error);
