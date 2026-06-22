"use client";

import { useState } from "react";
import { Search, Upload, LogIn, FileText, Image, Code, Download } from "lucide-react";
import { fileGeneratorSchema } from "@/lib/schemas";
import { useAppStore } from "@/lib/store";

type Tab = "kanji" | "vocabulary";
type Format = "pdf" | "png" | "svg";

export default function FileGeneratorPage() {
  const { isLoggedIn } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>("kanji");
  const [searchInput, setSearchInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [format, setFormat] = useState<Format>("pdf");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    const result = fileGeneratorSchema.safeParse({
      tab: activeTab,
      searchInput,
      bulkInput,
      exportFormat: format,
    });
    if (!result.success) {
      setError("Vui lòng kiểm tra lại thông tin nhập.");
      return;
    }
    if (!isLoggedIn) {
      setError("Vui lòng đăng nhập để tạo file.");
      return;
    }
    setError(null);
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  const formatIcons: Record<Format, React.ReactNode> = {
    pdf: <FileText size={16} />,
    png: <Image size={16} />,
    svg: <Code size={16} />,
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
          📄 Tạo file
        </h1>
        <p style={{ color: "var(--color-text-secondary)", margin: "4px 0 0", fontSize: 14 }}>
          Tạo tài liệu luyện viết Kanji và Từ vựng theo định dạng của bạn
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, alignItems: "start" }}>
        {/* Main panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Tabs */}
          <div className="card animate-fade-in-up" style={{ padding: 20 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {(["kanji", "vocabulary"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  id={`file-tab-${tab}`}
                  className={`tab-item ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "kanji" ? "漢字 Kanji" : "📚 Từ vựng"}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <Search
                size={16}
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}
              />
              <input
                id="file-search-input"
                className="input-base"
                style={{ paddingLeft: 42 }}
                placeholder={activeTab === "kanji" ? "Nhập kanji hoặc âm hán việt..." : "Nhập từ vựng..."}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Textarea */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: 8 }}>
                Nhập {activeTab === "kanji" ? "Kanji" : "từ vựng"} cách nhau bằng dấu phẩy
              </label>
              <textarea
                id="file-bulk-input"
                className="input-base"
                style={{ minHeight: 140, resize: "vertical", fontFamily: "var(--font-jp)" }}
                placeholder={activeTab === "kanji" ? "日, 月, 火, 水, 木, 金, 土..." : "食べる, 飲む, 行く, 来る..."}
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
              />
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>
                {bulkInput.split(",").filter((s) => s.trim()).length} mục đã nhập
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                color: "#dc2626",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="card animate-fade-in-up" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px", color: "var(--color-text-secondary)" }}>
              Hành động
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                id="file-import-btn"
                className="btn-secondary"
                style={{ justifyContent: "center", width: "100%" }}
              >
                <Upload size={15} />
                Nhập dữ liệu vào hệ thống
              </button>
              {!isLoggedIn ? (
                <button
                  id="file-login-btn"
                  className="btn-primary"
                  style={{ justifyContent: "center", width: "100%", background: "linear-gradient(135deg, #1e40af, #7c3aed)" }}
                >
                  <LogIn size={15} />
                  Đăng nhập để tạo file
                </button>
              ) : (
                <button
                  id="file-generate-btn"
                  className="btn-primary"
                  onClick={handleGenerate}
                  disabled={generating}
                  style={{ justifyContent: "center", width: "100%", opacity: generating ? 0.7 : 1 }}
                >
                  {generating ? (
                    <>
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Download size={15} />
                      Tạo file
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Export format panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card animate-fade-in-up" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Xuất file
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(["pdf", "png", "svg"] as Format[]).map((fmt) => {
                const labels: Record<Format, { name: string; desc: string; color: string }> = {
                  pdf: { name: "PDF", desc: "Tài liệu in ấn", color: "#ef4444" },
                  png: { name: "PNG", desc: "Hình ảnh chất lượng cao", color: "#3b82f6" },
                  svg: { name: "SVG", desc: "Vector có thể chỉnh sửa", color: "#10b981" },
                };
                return (
                  <button
                    key={fmt}
                    id={`export-${fmt}-btn`}
                    onClick={() => setFormat(fmt)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1.5px solid ${format === fmt ? labels[fmt].color : "var(--color-border)"}`,
                      background: format === fmt ? labels[fmt].color + "10" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: labels[fmt].color + "15",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: labels[fmt].color,
                        flexShrink: 0,
                      }}
                    >
                      {formatIcons[fmt]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: format === fmt ? labels[fmt].color : "var(--color-text-primary)" }}>
                        {labels[fmt].name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{labels[fmt].desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview card */}
          <div
            className="card animate-fade-in-up"
            style={{
              padding: 20,
              background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
              border: "1px solid #bbf7d0",
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px", color: "#059669" }}>
              ✨ File mẫu
            </h3>
            <div
              style={{
                borderRadius: 10,
                background: "#fff",
                border: "1px solid #d1fae5",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {["日", "月", "火"].map((k) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "#f0fdf4",
                  }}
                >
                  <span style={{ fontSize: 22, fontFamily: "var(--font-jp)", fontWeight: 700, minWidth: 28 }}>{k}</span>
                  <div style={{ flex: 1, height: 1, background: "#d1fae5" }} />
                  <div style={{ flex: 1, height: 1, background: "#d1fae5" }} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#059669", margin: "10px 0 0" }}>
              Xuất với ô tập viết chuẩn giáo trình
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
