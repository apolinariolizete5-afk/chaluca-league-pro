import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { uploadMedia } from "@/lib/media";
import { MediaImage } from "@/components/MediaImage";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  folder: string;
  value: string | null;
  onChange: (path: string | null) => void;
};

export function UploadField({ label, folder, value, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um ficheiro de imagem");
      return;
    }
    setBusy(true);
    try {
      const path = await uploadMedia(file, folder);
      onChange(path);
      toast.success("Imagem carregada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="text-sm font-medium">{label}</span>
      <div
        tabIndex={0}
        role="button"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onPaste={(e) => void handle(e.clipboardData.files?.[0])}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "mt-1 flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border p-3 transition-colors",
          over && "border-primary bg-primary/5",
          busy && "opacity-60",
        )}
      >
        <MediaImage path={value} alt={label} className="size-14 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5 font-semibold text-foreground">
            <Upload className="size-3.5" />
            {busy ? "A carregar…" : "Clique, arraste ou cole (Ctrl+V)"}
          </p>
          <p className="mt-0.5">A imagem é reduzida automaticamente antes de enviar.</p>
        </div>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="text-xs text-destructive hover:underline"
          >
            Remover
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => void handle(e.target.files?.[0])}
          className="hidden"
        />
      </div>
    </div>
  );
}
