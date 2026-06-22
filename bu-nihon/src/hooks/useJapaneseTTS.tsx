"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface TTSOptions {
  rate?: number;   // 0.1 – 10, default 1
  pitch?: number;  // 0 – 2, default 1
  volume?: number; // 0 – 1, default 1
}

interface TTSState {
  speaking: boolean;
  supported: boolean;
  currentText: string | null;
}

/**
 * Hook for Japanese TTS using Web Speech API.
 * Free, no API key needed, works in all modern browsers.
 * Chrome / Edge have the best Japanese voices.
 */
export function useJapaneseTTS(options: TTSOptions = {}) {
  const { rate = 0.9, pitch = 1.05, volume = 1 } = options;
  const [state, setState] = useState<TTSState>({
    speaking: false,
    supported: false,
    currentText: null,
  });
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setState((s) => ({ ...s, supported: typeof window !== "undefined" && "speechSynthesis" in window }));
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  /** Pick best available Japanese voice */
  const getJapaneseVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined") return null;
    const voices = window.speechSynthesis.getVoices();
    // Prefer high-quality voices first
    const priority = [
      (v: SpeechSynthesisVoice) => v.lang === "ja-JP" && v.name.includes("Google"),
      (v: SpeechSynthesisVoice) => v.lang === "ja-JP" && v.name.includes("Kyoko"),
      (v: SpeechSynthesisVoice) => v.lang === "ja-JP" && !v.localService,
      (v: SpeechSynthesisVoice) => v.lang === "ja-JP",
      (v: SpeechSynthesisVoice) => v.lang.startsWith("ja"),
    ];
    for (const pred of priority) {
      const found = voices.find(pred);
      if (found) return found;
    }
    return null;
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!state.supported) return;
      // Stop any current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      const voice = getJapaneseVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () =>
        setState({ speaking: true, supported: true, currentText: text });
      utterance.onend = () =>
        setState({ speaking: false, supported: true, currentText: null });
      utterance.onerror = () =>
        setState({ speaking: false, supported: true, currentText: null });

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [state.supported, rate, pitch, volume, getJapaneseVoice]
  );

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setState((s) => ({ ...s, speaking: false, currentText: null }));
  }, []);

  const isSpeaking = useCallback(
    (text: string) => state.speaking && state.currentText === text,
    [state]
  );

  return { speak, stop, ...state, isSpeaking };
}

/* ─────────────────── SpeakButton ─────────────────── */
interface SpeakButtonProps {
  text: string;
  accentColor?: string;
  size?: number;
  title?: string;
}

/**
 * A ready-to-use speak button — just pass the Japanese text.
 * Usage: <SpeakButton text="でんき" accentColor="#059669" />
 */
export function SpeakButton({
  text,
  accentColor = "#6366f1",
  size = 14,
  title = "Phát âm",
}: SpeakButtonProps) {
  const { speak, stop, isSpeaking, supported } = useJapaneseTTS();
  const active = isSpeaking(text);

  if (!supported) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        active ? stop() : speak(text);
      }}
      title={title}
      style={{
        flexShrink: 0,
        background: active ? `${accentColor}18` : "none",
        border: active ? `1px solid ${accentColor}50` : "none",
        cursor: "pointer",
        color: active ? accentColor : "#94a3b8",
        padding: 4,
        borderRadius: 6,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = accentColor;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = "#94a3b8";
      }}
    >
      {active ? (
        /* Animated bars when playing */
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="6" width="3" height="12" rx="1.5">
            <animate attributeName="height" values="12;4;12" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="y" values="6;10;6" dur="0.8s" repeatCount="indefinite" />
          </rect>
          <rect x="9" y="3" width="3" height="18" rx="1.5">
            <animate attributeName="height" values="18;6;18" dur="0.8s" begin="0.15s" repeatCount="indefinite" />
            <animate attributeName="y" values="3;9;3" dur="0.8s" begin="0.15s" repeatCount="indefinite" />
          </rect>
          <rect x="15" y="7" width="3" height="10" rx="1.5">
            <animate attributeName="height" values="10;4;10" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
            <animate attributeName="y" values="7;10;7" dur="0.8s" begin="0.3s" repeatCount="indefinite" />
          </rect>
          <rect x="21" y="5" width="3" height="14" rx="1.5">
            <animate attributeName="height" values="14;5;14" dur="0.8s" begin="0.45s" repeatCount="indefinite" />
            <animate attributeName="y" values="5;9.5;5" dur="0.8s" begin="0.45s" repeatCount="indefinite" />
          </rect>
        </svg>
      ) : (
        /* Speaker icon */
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}
