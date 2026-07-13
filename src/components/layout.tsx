"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { BRANDING } from "./branding";

interface LayoutProps {
  children: ReactNode;
  user?: { name: string; email: string };
}

export function Layout({ children, user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { label: "Tableau de bord", href: "/", icon: "📊" },
    { label: "Annonces", href: "/ao", icon: "📢" },
    { label: "Favoris", href: "/favoris", icon: "⭐" },
    { label: "Veilles", href: "/veilles", icon: "🔔" },
    { label: "Opportunities", href: "/opportunities", icon: "💼" },
    { label: "Configuration", href: "/config", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white dark:bg-slate-900 shadow-lg transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-700">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl">{BRANDING.logo}</span>
            <div className="hidden sm:block">
              <div className="font-bold text-slate-900 dark:text-white">{BRANDING.appName}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">BTP</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 px-3 py-4 dark:border-slate-700">
          {user ? (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
              <div>{user.email}</div>
            </div>
          ) : (
            <Link href="/login" className="block text-sm font-medium text-blue-600 hover:underline">
              Connexion
            </Link>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-700 dark:bg-slate-900">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ☰
          </button>
          <div className="ml-auto flex items-center gap-4">
            <button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">🔔</button>
            <button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">👤</button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
