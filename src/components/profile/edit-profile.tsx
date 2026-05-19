"use client";

import { useRef, useState, useTransition } from "react";
import {
  AlertCircle,
  Camera,
  Check,
  Loader2,
  Pencil,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import {
  removeAvatarAction,
  updateProfileNameAction,
  uploadAvatarAction,
} from "@/server/actions/profile";

export function EditProfile({
  initialName,
  initialImage,
}: {
  initialName: string;
  initialImage: string | null;
}) {
  return (
    <div className="space-y-6">
      <AvatarSection initialImage={initialImage} />
      <NameSection initialName={initialName} />
    </div>
  );
}

// ============================================================
// Avatar (upload + preview + delete)
// ============================================================

function AvatarSection({ initialImage }: { initialImage: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(initialImage);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFile = (file: File) => {
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const result = await uploadAvatarAction(fd);
      if (!result.ok) {
        setError(errorMessage(result.error));
        return;
      }
      setImage(result.data?.url ?? null);
    });
  };

  const handleRemove = () =>
    startTransition(async () => {
      setError(null);
      const result = await removeAvatarAction();
      if (!result.ok) {
        setError(errorMessage(result.error));
        return;
      }
      setImage(null);
    });

  return (
    <section className="rounded-xl border-2 border-border bg-card p-6 space-y-4">
      <h2 className="font-display text-2xl">FOTO DE PERFIL</h2>

      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted shrink-0">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <UserIcon className="w-10 h-10 text-muted-foreground absolute inset-0 m-auto" />
          )}
          {isPending && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-bold uppercase tracking-wide text-sm hover:opacity-90 disabled:opacity-70 disabled:cursor-wait"
          >
            <Camera className="w-4 h-4" />
            {image ? "Cambiar foto" : "Subir foto"}
          </button>
          {image && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border-2 border-border text-muted-foreground text-sm font-bold uppercase tracking-wide hover:text-destructive hover:border-destructive disabled:opacity-70"
            >
              <Trash2 className="w-4 h-4" />
              Quitar
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP o GIF. Máximo 2 MB.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive inline-flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </section>
  );
}

// ============================================================
// Display name
// ============================================================

function NameSection({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateProfileNameAction({ name });
      if (!result.ok) {
        setError(errorMessage(result.error));
        return;
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setEditing(false);
      }, 1200);
    });
  };

  if (!editing) {
    return (
      <section className="rounded-xl border-2 border-border bg-card p-6 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl">NOMBRE</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wide text-primary hover:underline"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
        </div>
        <div className="font-display text-3xl">{initialName}</div>
        <p className="text-xs text-muted-foreground">
          Es el nombre que ven los demás jugadores en la tabla y en los
          pronósticos.
        </p>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border-2 border-border bg-card p-6 space-y-3"
    >
      <h2 className="font-display text-2xl">NOMBRE</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={30}
        minLength={2}
        required
        autoFocus
        disabled={isPending}
        className="w-full px-3 py-3 rounded-md border-2 border-border bg-background font-display text-2xl focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || name === initialName || name.length < 2}
          className="flex-1 py-2 bg-primary text-primary-foreground rounded-md font-bold uppercase tracking-wide text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saved ? (
            <span className="inline-flex items-center gap-1 justify-center">
              <Check className="w-4 h-4" />
              Guardado
            </span>
          ) : isPending ? (
            "Guardando..."
          ) : (
            "Guardar"
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setName(initialName);
            setEditing(false);
            setError(null);
          }}
          disabled={isPending}
          className="flex-1 py-2 border-2 border-border rounded-md font-bold uppercase tracking-wide text-sm hover:bg-muted disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
      {error && (
        <p className="text-xs text-destructive inline-flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </form>
  );
}

function errorMessage(code: string): string {
  switch (code) {
    case "unauthorized":
      return "Tenés que iniciar sesión.";
    case "blob_not_configured":
      return "Storage de imágenes no configurado.";
    case "no_file":
    case "empty_file":
      return "No se recibió ninguna imagen.";
    case "file_too_large":
      return "La imagen es demasiado grande (máximo 2 MB).";
    case "invalid_type":
      return "Formato no soportado. Usá JPG, PNG, WebP o GIF.";
    default:
      return code.length > 30
        ? "No pudimos guardar. Probá de nuevo."
        : code;
  }
}
