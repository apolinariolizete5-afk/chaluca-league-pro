import { useState } from "react";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/media";
import { MediaImage } from "@/components/MediaImage";

type Props = {
  label: string;
  folder: string;
  value: string | null;
  onChange: (path: string | null) => void;
};

export function UploadField({ label, folder, value, onChange }: Props) {
  const [busy, setBusy] = useState(false);

  async function handle(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const path = await uploadMedia(file, folder);
      onChange(path);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        <MediaImage path={value} alt={label} className="size-14 rounded-md" />
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => handle(e.target.files?.[0])}
          className="text-xs"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-destructive hover:underline"
          >
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
