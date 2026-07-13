"use client";

import { useState, useEffect } from "react";

export default function FavoriteButton({ tenderId, title }: { tenderId: string; title: string }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const faves = JSON.parse(localStorage.getItem("favorites") ?? "{}");
    setIsFavorite(!!faves[tenderId]);
  }, [tenderId]);

  const toggle = async () => {
    setLoading(true);
    const faves = JSON.parse(localStorage.getItem("favorites") ?? "{}");
    if (faves[tenderId]) {
      delete faves[tenderId];
    } else {
      faves[tenderId] = { title, savedAt: new Date().toISOString() };
    }
    localStorage.setItem("favorites", JSON.stringify(faves));
    setIsFavorite(!isFavorite);
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-lg px-4 py-2 font-medium transition ${
        isFavorite
          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {isFavorite ? "⭐ Favori" : "☆ Ajouter aux favoris"}
    </button>
  );
}
