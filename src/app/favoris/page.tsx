"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FavoriteEntry {
  id: string;
  title: string;
  savedAt: string;
}

export default function FavorisPage() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const map = JSON.parse(localStorage.getItem("favorites") ?? "{}") as Record<
      string,
      { title: string; savedAt: string }
    >;
    setFavorites(
      Object.entries(map)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    );
    setLoaded(true);
  }, []);

  const remove = (id: string) => {
    const map = JSON.parse(localStorage.getItem("favorites") ?? "{}") as Record<string, unknown>;
    delete map[id];
    localStorage.setItem("favorites", JSON.stringify(map));
    setFavorites((f) => f.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">⭐ Favoris</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Les annonces que vous avez mises de côté (stockées sur cet appareil).
        </p>
      </div>

      {loaded && favorites.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-3xl" aria-hidden>☆</p>
          <p className="mt-2 font-medium text-slate-700 dark:text-slate-300">Aucun favori pour l&apos;instant</p>
          <p className="mt-1 text-sm text-slate-500">
            Ouvrez une annonce et cliquez sur « Ajouter aux favoris ».
          </p>
          <Link
            href="/ao"
            className="mt-4 inline-block rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
          >
            Parcourir les annonces
          </Link>
        </div>
      )}

      <ul className="space-y-2">
        {favorites.map((f) => (
          <li
            key={f.id}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <span aria-hidden>⭐</span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/ao/${f.id}`}
                className="font-medium text-slate-900 hover:text-teal-700 hover:underline dark:text-white dark:hover:text-teal-400"
              >
                {f.title}
              </Link>
              <p className="text-xs text-slate-400">
                Ajouté le {new Date(f.savedAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <button
              onClick={() => remove(f.id)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-red-400 hover:text-red-600 dark:border-slate-700"
            >
              Retirer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
