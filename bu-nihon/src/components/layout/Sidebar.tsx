"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import {
  BookOpen,
  Crown,
  Puzzle,
  Map,
  Brain,
  Mic,
  BarChart2,
  MessageSquare,
  FileText,
  Sparkles,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/kanji", icon: "漢字", label: "Hán tự", isEmoji: true },
  { href: "/vocabulary", icon: <Crown size={20} />, label: "Từ vựng" },
  { href: "/grammar", icon: <Puzzle size={20} />, label: "Ngữ pháp" },
  { href: "/roadmap", icon: <Map size={20} />, label: "Lộ trình" },
  { href: "/self-study", icon: <Brain size={20} />, label: "Chủ động" },
  { href: "/shadowing", icon: <Mic size={20} />, label: "Shadowing" },
  { href: "/accent", icon: <BarChart2 size={20} />, label: "Trọng âm" },
  { href: "/kaiwa", icon: <MessageSquare size={20} />, label: "Kaiwa" },
  { href: "/file-generator", icon: <FileText size={20} />, label: "Tạo file" },
];

export function Sidebar() {
  const pathname = usePathname();
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="sidebar-desktop"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: 72,
          height: "100vh",
          background: "var(--color-sidebar-bg)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 80,
          paddingBottom: 16,
          gap: 4,
          zIndex: 50,
          overflowY: "auto",
        }}
      >
        {/* Nav items */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${isActive ? "active" : ""}`}
                title={item.label}
              >
                {item.isEmoji ? (
                  <span style={{ fontSize: 16, fontFamily: "var(--font-jp)", fontWeight: 700, lineHeight: 1 }}>
                    {item.icon as string}
                  </span>
                ) : (
                  <span style={{ display: "flex" }}>{item.icon}</span>
                )}
                <span style={{ fontSize: 9, fontWeight: 500, textAlign: "center", lineHeight: 1.1 }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <button
            className="sidebar-item"
            title="Nâng cấp"
            style={{ color: "#f59e0b" }}
          >
            <Sparkles size={20} />
            <span style={{ fontSize: 9, fontWeight: 500 }}>Nâng cấp</span>
          </button>
          <button
            className="sidebar-item"
            title="Cài đặt"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={20} />
            <span style={{ fontSize: 9, fontWeight: 500 }}>Cài đặt</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 68,
          background: "var(--color-sidebar-bg)",
          borderTop: "1px solid var(--color-border)",
          display: "none",
          alignItems: "center",
          justifyContent: "space-around",
          paddingInline: 8,
          zIndex: 50,
        }}
      >
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? "active" : ""}`}
              style={{ width: 48, height: 48 }}
              title={item.label}
            >
              {item.isEmoji ? (
                <span style={{ fontSize: 16, fontFamily: "var(--font-jp)", fontWeight: 700 }}>
                  {item.icon as string}
                </span>
              ) : (
                <span style={{ display: "flex" }}>{item.icon}</span>
              )}
              <span style={{ fontSize: 9, fontWeight: 500 }}>{item.label}</span>
            </Link>
          );
        })}
        <button
          className="sidebar-item"
          onClick={() => setSettingsOpen(true)}
          style={{ width: 48, height: 48 }}
        >
          <Settings size={18} />
          <span style={{ fontSize: 9 }}>Thêm</span>
        </button>
      </nav>
    </>
  );
}
