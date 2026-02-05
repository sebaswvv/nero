"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavLinkProps {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
}

function NavLink({ href, icon, label, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
        isActive
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", icon: "📊", label: "Dashboard" },
    { href: "/ledgers", icon: "📒", label: "Ledgers" },
    { href: "/recurring", icon: "🔄", label: "Recurring" },
    { href: "/transactions", icon: "💰", label: "Transactions" },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
      >
        {mobileMenuOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar navigation */}
      <nav
        className={`fixed top-0 right-0 lg:right-auto lg:left-0 h-full w-64 bg-slate-900/95 backdrop-blur-sm border-l lg:border-l-0 lg:border-r border-slate-800 p-6 flex flex-col gap-6 z-40 transition-transform lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Nero</h1>
          <p className="text-sm text-slate-400">Personal Finance</p>
        </div>

        <div className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="w-full px-4 py-2.5 text-left text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-all"
            >
              <span className="text-xl mr-3">🚪</span>
              <span className="font-medium">Sign out</span>
            </button>
          </form>
        </div>
      </nav>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
