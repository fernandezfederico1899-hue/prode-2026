"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlayerWithTeam } from "@/server/queries/players";

// Normaliza para buscar sin importar acentos / mayúsculas.
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const MAX_RESULTS = 80;

/**
 * Selector de jugador con buscador: tipeás nombre (o país / código FIFA) y
 * filtra contra toda la lista. Necesario porque hay ~1247 jugadores y los
 * nombres están en formatos mezclados (ej "Kylian Mbappé" vs "O. Dembélé").
 */
export function PlayerCombobox({
  value,
  onChange,
  disabled,
  options,
  placeholder = "Buscá y elegí un jugador...",
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled: boolean;
  options: PlayerWithTeam[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value],
  );

  // Índice de búsqueda: nombre + país + código FIFA, normalizado.
  const indexed = useMemo(
    () =>
      options.map((p) => ({
        p,
        key: norm(`${p.name} ${p.team.name} ${p.team.fifaCode}`),
      })),
    [options],
  );

  const matches = useMemo(() => {
    const q = norm(query);
    if (!q) return indexed;
    const tokens = q.split(/\s+/).filter(Boolean);
    return indexed.filter((x) => tokens.every((t) => x.key.includes(t)));
  }, [indexed, query]);

  const visible = matches.slice(0, MAX_RESULTS).map((x) => x.p);

  // Cerrar al hacer click afuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const choose = (id: string | null) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        className={cn(
          "inline-flex items-center justify-between gap-2 w-full px-3 py-3 rounded-md border-2 border-border bg-card",
          "text-base font-semibold text-left",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            {selected.photoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selected.photoUrl}
                alt=""
                className="w-6 h-6 rounded-full border border-border object-cover bg-muted shrink-0"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`https://flagcdn.com/${selected.team.flagCode}.svg`}
                alt=""
                className="w-5 h-[15px] rounded-sm border border-border object-cover shrink-0"
              />
            )}
            <span className="truncate">{selected.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {selected.team.fifaCode}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground font-normal">{placeholder}</span>
        )}
        <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border-2 border-border bg-card shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (visible[0]) choose(visible[0].id);
                }
              }}
              placeholder="Escribí un nombre o país..."
              className="w-full px-2 py-2 rounded bg-muted/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto p-1">
            {value && (
              <li>
                <button
                  type="button"
                  onClick={() => choose(null)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded text-sm text-muted-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4 shrink-0" />
                  Quitar selección
                </button>
              </li>
            )}
            {visible.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Sin resultados
              </li>
            ) : (
              visible.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => choose(p.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-2 rounded text-left hover:bg-muted",
                      p.id === value && "bg-muted",
                    )}
                  >
                    {p.photoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.photoUrl}
                        alt=""
                        className="w-6 h-6 rounded-full border border-border object-cover bg-muted shrink-0"
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={`https://flagcdn.com/${p.team.flagCode}.svg`}
                        alt=""
                        className="w-5 h-[15px] rounded-sm border border-border object-cover shrink-0"
                      />
                    )}
                    <span className="font-semibold truncate">{p.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      {p.team.fifaCode}
                      {p.shirtNumber ? ` · #${p.shirtNumber}` : ""}
                      {p.position ? ` · ${p.position.slice(0, 3)}` : ""}
                    </span>
                  </button>
                </li>
              ))
            )}
            {matches.length > visible.length && (
              <li className="px-3 py-2 text-center text-xs text-muted-foreground">
                Mostrando {visible.length} de {matches.length} — seguí
                escribiendo para refinar
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
