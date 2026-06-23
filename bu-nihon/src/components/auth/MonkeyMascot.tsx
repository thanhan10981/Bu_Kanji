"use client";

import { useState, useEffect, useRef } from "react";

interface MonkeyMascotProps {
  coverEyes: boolean;
}

export function MonkeyMascot({ coverEyes }: MonkeyMascotProps) {
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  /* ── Pupil eye-tracking ── */
  useEffect(() => {
    if (coverEyes) {
      setPupil({ x: 0, y: 0 });
      return;
    }

    const onMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();

      // Eye center in screen space — viewBox coords (120, 52)
      const scX = rect.width / 240;
      const scY = rect.height / 160;
      const eyeScreenX = rect.left + 120 * scX;
      const eyeScreenY = rect.top  +  52 * scY;

      const dx = e.clientX - eyeScreenX;
      const dy = e.clientY - eyeScreenY;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) return;

      const maxOff = 5.5; // max pupil offset (SVG units)
      const t = Math.min(1, dist / 280);
      setPupil({
        x: (dx / dist) * maxOff * t,
        y: (dy / dist) * maxOff * t,
      });
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [coverEyes]);

  /* ── Natural random blink ── */
  useEffect(() => {
    if (coverEyes) return;
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    const schedule = () => {
      t1 = setTimeout(() => {
        setBlinking(true);
        t2 = setTimeout(() => { setBlinking(false); schedule(); }, 140);
      }, 2500 + Math.random() * 3500);
    };
    schedule();
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [coverEyes]);

  /* ── Derived pupil positions ── */
  const lx = 97  + pupil.x;
  const ly = 51  + pupil.y;
  const rx = 143 + pupil.x;
  const ry = 51  + pupil.y;

  return (
    <>
      <style>{`
        @keyframes mk-float {
          0%,100% { transform: translateY(0);    }
          50%      { transform: translateY(-5px); }
        }
        @keyframes mk-peek-bob {
          0%,100% { transform: translateY(0); }
          40%      { transform: translateY(-3px); }
          60%      { transform: translateY(1px);  }
        }
        .mk-idle  { animation: mk-float    3.5s ease-in-out infinite; }
        .mk-cover { animation: mk-peek-bob 1.6s ease-in-out infinite; }
      `}</style>

      <svg
        ref={svgRef}
        viewBox="0 0 240 165"
        width="240"
        height="165"
        overflow="visible"
        style={{ display: "block", userSelect: "none", pointerEvents: "none" }}
      >
        <g className={coverEyes ? "mk-cover" : "mk-idle"}>

          {/* ════ BODY (behind box rim, bottom cut off by card) ════ */}
          <ellipse cx="120" cy="172" rx="56" ry="44" fill="#9B6B3A" />

          {/* ════ NORMAL ARMS (resting on box top) ════ */}
          <g style={{ opacity: coverEyes ? 0 : 1, transition: "opacity 0.32s ease" }}>
            {/* Left arm */}
            <path
              d="M83 162 C76 152 68 143 56 134"
              stroke="#9B6B3A" strokeWidth="15" strokeLinecap="round" fill="none"
            />
            {/* Left hand (flat on surface, slightly angled) */}
            <ellipse cx="48" cy="133" rx="26" ry="10.5" fill="#9B6B3A" transform="rotate(-12,48,133)" />
            <ellipse cx="48" cy="131" rx="21" ry="7.5"  fill="#C47A45" transform="rotate(-12,48,131)" />
            {/* Left fingers hanging over edge */}
            <ellipse cx="28" cy="128" rx="5" ry="9"   fill="#9B6B3A" transform="rotate(-28,28,128)" />
            <ellipse cx="36" cy="124" rx="5" ry="9.5" fill="#9B6B3A" transform="rotate(-12,36,124)" />
            <ellipse cx="45" cy="122" rx="5" ry="9.5" fill="#9B6B3A" />
            <ellipse cx="54" cy="124" rx="5" ry="9"   fill="#9B6B3A" transform="rotate(12,54,124)" />
            <ellipse cx="62" cy="128" rx="5" ry="8.5" fill="#9B6B3A" transform="rotate(24,62,128)" />

            {/* Right arm */}
            <path
              d="M157 162 C164 152 172 143 184 134"
              stroke="#9B6B3A" strokeWidth="15" strokeLinecap="round" fill="none"
            />
            {/* Right hand */}
            <ellipse cx="192" cy="133" rx="26" ry="10.5" fill="#9B6B3A" transform="rotate(12,192,133)" />
            <ellipse cx="192" cy="131" rx="21" ry="7.5"  fill="#C47A45" transform="rotate(12,192,131)" />
            {/* Right fingers */}
            <ellipse cx="178" cy="128" rx="5" ry="8.5" fill="#9B6B3A" transform="rotate(-24,178,128)" />
            <ellipse cx="186" cy="124" rx="5" ry="9"   fill="#9B6B3A" transform="rotate(-12,186,124)" />
            <ellipse cx="195" cy="122" rx="5" ry="9.5" fill="#9B6B3A" />
            <ellipse cx="204" cy="124" rx="5" ry="9.5" fill="#9B6B3A" transform="rotate(12,204,124)" />
            <ellipse cx="212" cy="128" rx="5" ry="9"   fill="#9B6B3A" transform="rotate(28,212,128)" />
          </g>

          {/* ════ EARS ════ */}
          <ellipse cx="65"  cy="54" rx="24" ry="21" fill="#9B6B3A" />
          <ellipse cx="65"  cy="54" rx="15" ry="13" fill="#D4966A" />
          <ellipse cx="175" cy="54" rx="24" ry="21" fill="#9B6B3A" />
          <ellipse cx="175" cy="54" rx="15" ry="13" fill="#D4966A" />

          {/* ════ HEAD ════ */}
          <ellipse cx="120" cy="56" rx="57" ry="54" fill="#9B6B3A" />

          {/* ════ FACE PLATE ════ */}
          <ellipse cx="120" cy="68" rx="42" ry="37" fill="#D4966A" />

          {/* ════ EYE WHITES ════ */}
          <ellipse cx="97"  cy="51" rx="18" ry="20" fill="white" />
          <ellipse cx="143" cy="51" rx="18" ry="20" fill="white" />

          {/* ════ PUPILS — mouse tracking ════ */}
          {!coverEyes && (
            <>
              {blinking ? (
                /* Blink: flat line over eye whites */
                <>
                  <rect x="81"  y="49" width="32" height="5.5" rx="3" fill="#9B6B3A" />
                  <rect x="127" y="49" width="32" height="5.5" rx="3" fill="#9B6B3A" />
                </>
              ) : (
                /* Normal pupils with highlight */
                <>
                  {/* Left pupil */}
                  <circle cx={lx}   cy={ly}   r="11"  fill="#1A0A00" />
                  <circle cx={lx+3} cy={ly-4} r="4"   fill="white"   />
                  <circle cx={lx-2} cy={ly+3} r="1.8" fill="white" opacity="0.45" />
                  {/* Right pupil */}
                  <circle cx={rx}   cy={ry}   r="11"  fill="#1A0A00" />
                  <circle cx={rx+3} cy={ry-4} r="4"   fill="white"   />
                  <circle cx={rx-2} cy={ry+3} r="1.8" fill="white" opacity="0.45" />
                </>
              )}
            </>
          )}

          {/* ════ EYEBROWS ════ */}
          <path
            d={coverEyes
              ? "M83 34 Q97 30 111 35"   /* worried ↗ */
              : "M83 36 Q97 31 111 37"}  /* friendly */
            stroke="#4A2C10" strokeWidth="3.5" fill="none" strokeLinecap="round"
          />
          <path
            d={coverEyes
              ? "M129 35 Q143 30 157 34"
              : "M129 37 Q143 31 157 36"}
            stroke="#4A2C10" strokeWidth="3.5" fill="none" strokeLinecap="round"
          />

          {/* ════ NOSE ════ */}
          <ellipse cx="120" cy="75" rx="10" ry="7"  fill="#E8956A" />
          <circle  cx="116" cy="75" r="3"           fill="#C06040" opacity="0.65" />
          <circle  cx="124" cy="75" r="3"           fill="#C06040" opacity="0.65" />

          {/* ════ MOUTH ════ */}
          <path
            d={coverEyes
              ? "M109 85 Q120 82 131 85"   /* flat/shy */
              : "M106 83 Q120 96 134 83"}  /* big smile */
            stroke="#7A3515" strokeWidth="2.8" fill="none" strokeLinecap="round"
          />

          {/* ════ BLUSH ════ */}
          <ellipse cx="70"  cy="73" rx="12" ry="8"
            fill="#F4A0A0"
            style={{ opacity: coverEyes ? 0.65 : 0, transition: "opacity 0.35s" }}
          />
          <ellipse cx="170" cy="73" rx="12" ry="8"
            fill="#F4A0A0"
            style={{ opacity: coverEyes ? 0.65 : 0, transition: "opacity 0.35s" }}
          />

          {/* ════ COVER HANDS (hands over eyes) ════ */}
          <g style={{ opacity: coverEyes ? 1 : 0, transition: "opacity 0.32s ease" }}>
            {/* Left arm raised */}
            <path
              d="M83 162 C76 132 73 98 80 60"
              stroke="#9B6B3A" strokeWidth="14" strokeLinecap="round" fill="none"
            />
            {/* Left palm over left eye */}
            <ellipse cx="87"  cy="52" rx="21" ry="18" fill="#9B6B3A" />
            <ellipse cx="87"  cy="52" rx="17" ry="14" fill="#C47A45" />
            {/* Left fingers fanning up */}
            <ellipse cx="72"  cy="41" rx="5"  ry="9.5" fill="#9B6B3A" transform="rotate(-22,72,41)" />
            <ellipse cx="79"  cy="37" rx="5"  ry="10"  fill="#9B6B3A" transform="rotate(-8,79,37)"  />
            <ellipse cx="87"  cy="35" rx="5"  ry="10"  fill="#9B6B3A" />
            <ellipse cx="95"  cy="37" rx="5"  ry="10"  fill="#9B6B3A" transform="rotate(8,95,37)"   />
            <ellipse cx="102" cy="41" rx="5"  ry="9.5" fill="#9B6B3A" transform="rotate(22,102,41)" />
            {/* Left peek eye through fingers */}
            <ellipse cx="87" cy="48" rx="10" ry="5"  fill="white"   />
            <circle  cx="88" cy="49" r="3.5"          fill="#1A0A00" />
            <circle  cx="90" cy="47" r="1.4"          fill="white"   />

            {/* Right arm raised */}
            <path
              d="M157 162 C164 132 167 98 160 60"
              stroke="#9B6B3A" strokeWidth="14" strokeLinecap="round" fill="none"
            />
            {/* Right palm over right eye */}
            <ellipse cx="153" cy="52" rx="21" ry="18" fill="#9B6B3A" />
            <ellipse cx="153" cy="52" rx="17" ry="14" fill="#C47A45" />
            {/* Right fingers */}
            <ellipse cx="138" cy="41" rx="5"  ry="9.5" fill="#9B6B3A" transform="rotate(-22,138,41)" />
            <ellipse cx="145" cy="37" rx="5"  ry="10"  fill="#9B6B3A" transform="rotate(-8,145,37)"  />
            <ellipse cx="153" cy="35" rx="5"  ry="10"  fill="#9B6B3A" />
            <ellipse cx="161" cy="37" rx="5"  ry="10"  fill="#9B6B3A" transform="rotate(8,161,37)"   />
            <ellipse cx="168" cy="41" rx="5"  ry="9.5" fill="#9B6B3A" transform="rotate(22,168,41)"  />
            {/* Right peek eye */}
            <ellipse cx="153" cy="48" rx="10" ry="5"  fill="white"   />
            <circle  cx="154" cy="49" r="3.5"          fill="#1A0A00" />
            <circle  cx="156" cy="47" r="1.4"          fill="white"   />
          </g>

        </g>
      </svg>
    </>
  );
}
