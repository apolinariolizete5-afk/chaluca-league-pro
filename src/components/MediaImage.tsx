import { useMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type Props = {
  path?: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
};

export function MediaImage({ path, alt, className, fallback }: Props) {
  const { data: url } = useMediaUrl(path);

  if (!path || !url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-xs font-semibold text-muted-foreground",
          className,
        )}
        aria-label={alt}
      >
        {fallback ?? alt.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
