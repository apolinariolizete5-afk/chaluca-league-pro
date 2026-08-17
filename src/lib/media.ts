import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MAX_SIDE = 1280;

async function resizeImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 400_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export async function uploadMedia(file: File, folder: string): Promise<string> {
  const blob = await resizeImage(file);
  const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, blob, {
    cacheControl: "3600",
    upsert: false,
    contentType: blob.type || "image/jpeg",
  });
  if (error) throw error;
  return path;
}

export function useMediaUrl(path?: string | null) {
  return useQuery({
    queryKey: ["media-url", path],
    enabled: Boolean(path),
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage.from("media").createSignedUrl(path!, 60 * 60 * 6);
      return data?.signedUrl ?? null;
    },
  });
}
