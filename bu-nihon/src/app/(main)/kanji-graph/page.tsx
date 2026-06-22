"use client";

import KanjiGraph from "@/components/KanjiGraph";

const SAMPLE_NODES = [
  { id: "den",  kanji: "電", meaning: "ĐIỆN",  reading: "Den / Dien",   color: "blue",   x: 280, y: 200 },
  { id: "ame",  kanji: "雨", meaning: "MƯA",   reading: "Ame",          color: "orange", x: 530, y: 120 },
  { id: "hi",   kanji: "日", meaning: "NHẬT",  reading: "Hi / Nichi",   color: "orange", x: 530, y: 300 },
  { id: "mizu", kanji: "水", meaning: "NƯỚC",  reading: "Mizu / Sui",   color: "green",  x: 80,  y: 120 },
  { id: "ki",   kanji: "気", meaning: "KHÍ",   reading: "Ki / Ke",      color: "purple", x: 80,  y: 300 },
];

const SAMPLE_EDGES = [
  { from: "ame",  to: "den" },
  { from: "hi",   to: "den" },
  { from: "mizu", to: "den" },
  { from: "ki",   to: "den" },
];

export default function KanjiGraphDemoPage() {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", margin: 0 }}>
          Sơ đồ liên kết Kanji
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>
          Kéo thả các node, hover để xem nghĩa, reset layout hoặc xuất SVG.
        </p>
      </div>

      <KanjiGraph
        nodes={SAMPLE_NODES}
        edges={SAMPLE_EDGES}
        width={700}
        height={440}
      />

      {/* Mini demo: 電話 */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>
          Ví dụ: 電話 (điện thoại)
        </h2>
        <KanjiGraph
          nodes={[
            { id: "denwa", kanji: "電話", meaning: "ĐIỆN THOẠI", reading: "Denwa", color: "blue", x: 240, y: 160 },
            { id: "den2",  kanji: "電",   meaning: "ĐIỆN",       reading: "Den",   color: "orange", x: 500, y: 100 },
            { id: "wa",    kanji: "話",   meaning: "NÓI CHUYỆN", reading: "Wa",    color: "green",  x: 500, y: 240 },
          ]}
          edges={[
            { from: "den2", to: "denwa" },
            { from: "wa",   to: "denwa" },
          ]}
          width={640}
          height={320}
        />
      </div>
    </div>
  );
}
