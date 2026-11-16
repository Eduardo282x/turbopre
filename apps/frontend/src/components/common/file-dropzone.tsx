import { ImagePlus, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  label?: string;
  description?: string;
  className?: string;
  required?: boolean;
}

export function FileDropzone({
  value,
  onChange,
  label = 'Evidencia fotográfica',
  description = 'Haz clic o arrastra una imagen JPG/PNG. Máximo 3 MB.',
  className,
  required = false,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file?: File) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('La imagen supera el límite de 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => onChange(String(event.target?.result ?? ''));
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
        {value && (
          <Button type="button" variant="ghost" size="xs" onClick={() => onChange(undefined)}>
            <X /> Quitar
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {value ? (
        <button
          type="button"
          className="group relative block w-full overflow-hidden rounded-xl border border-border bg-muted/30"
          onClick={() => inputRef.current?.click()}
        >
          <img src={value} alt="Evidencia cargada" className="max-h-56 w-full object-cover" />
          <span className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            Cambiar imagen
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            handleFile(event.dataTransfer.files?.[0]);
          }}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-4 py-8 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <ImagePlus className="size-5" />
          </span>
          <span className="text-sm font-medium text-foreground">Subir evidencia</span>
          <span className="max-w-xs text-xs text-muted-foreground">{description}</span>
        </button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
