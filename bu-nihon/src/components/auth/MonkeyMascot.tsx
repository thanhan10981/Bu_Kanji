"use client";

interface MonkeyMascotProps {
  coverEyes: boolean;
}

export function MonkeyMascot({ coverEyes }: MonkeyMascotProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: -128,
        left: 10,
        zIndex: 10,
        pointerEvents: "none",
        filter: "drop-shadow(0 10px 28px rgba(0,0,0,0.32))",
        userSelect: "none",
      }}
    >
      <style>{`
        /* ── Idle swing: pivot at hands (modal top edge) ── */
        @keyframes mk-swing {
          0%,100% { transform: rotate(-5deg); }
          50%      { transform: rotate(5deg);  }
        }
        @keyframes mk-swing-fast {
          0%,100% { transform: rotate(-3deg); }
          50%      { transform: rotate(3deg);  }
        }

        /* ── Leg dangle ── */
        @keyframes mk-legl {
          0%,100% { transform: rotate(-12deg); }
          50%      { transform: rotate(6deg);  }
        }
        @keyframes mk-legr {
          0%,100% { transform: rotate(12deg); }
          50%      { transform: rotate(-6deg); }
        }

        /* ── Blink ── */
        @keyframes mk-blink {
          0%,92%,100% { transform: scaleY(1);    }
          95%          { transform: scaleY(0.06); }
        }

        /* ── Drop-in on mount ── */
        @keyframes mk-dropin {
          0%   { opacity:0; transform: rotate(-12deg) translateY(-30px); }
          60%  { opacity:1; transform: rotate(6deg) translateY(8px); }
          80%  { transform: rotate(-3deg) translateY(-3px); }
          100% { transform: rotate(0deg) translateY(0); }
        }

        /* Applied classes */
        .mk-root {
          transform-origin: 60px 133px; /* pivot = hands on modal edge */
          animation:
            mk-dropin 0.6s cubic-bezier(.34,1.56,.64,1) both,
            mk-swing  3s ease-in-out 0.65s infinite;
        }
        .mk-root.peeking {
          animation:
            mk-swing-fast 1.5s ease-in-out infinite;
        }

        .mk-legl {
          transform-origin: 50px 116px;
          animation: mk-legl 2.2s ease-in-out infinite;
        }
        .mk-legr {
          transform-origin: 70px 116px;
          animation: mk-legr 2.2s ease-in-out 0.5s infinite;
        }

        .mk-eyeleft {
          transform-origin: 46px 42px;
          animation: mk-blink 6s ease-in-out 2s infinite;
        }
        .mk-eyeright {
          transform-origin: 74px 42px;
          animation: mk-blink 6s ease-in-out 2.3s infinite;
        }

        .mk-arms-normal { transition: opacity 0.38s cubic-bezier(.4,0,.2,1); }
        .mk-arms-cover  { transition: opacity 0.38s cubic-bezier(.4,0,.2,1); }
        .mk-blush       { transition: opacity 0.38s ease; }
        .mk-eyes-wrap   { transition: opacity 0.22s ease; }
        .mk-mouth-shy   { transition: opacity 0.22s ease; }
      `}</style>

      <svg
        viewBox="0 0 120 190"
        width="120"
        height="190"
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className={`mk-root${coverEyes ? " peeking" : ""}`}>

          {/* ─────── TAIL ─────── */}
          <path
            d="M 73 106 Q 100 115 103 97 Q 106 82 91 82"
            stroke="#7B5230"
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* ─────── BODY ─────── */}
          <ellipse cx="60" cy="101" rx="21" ry="21" fill="#9B6B3A" />
          {/* belly */}
          <ellipse cx="60" cy="104" rx="13.5" ry="14" fill="#D4966A" />

          {/* ─────── EARS ─────── */}
          {/* left ear outer */}
          <ellipse cx="27" cy="44" rx="14" ry="12" fill="#9B6B3A" />
          {/* left ear inner */}
          <ellipse cx="27" cy="44" rx="9"  ry="7.5" fill="#D4966A" />
          {/* right ear outer */}
          <ellipse cx="93" cy="44" rx="14" ry="12" fill="#9B6B3A" />
          {/* right ear inner */}
          <ellipse cx="93" cy="44" rx="9"  ry="7.5" fill="#D4966A" />

          {/* ─────── HEAD ─────── */}
          <ellipse cx="60" cy="46" rx="33" ry="32" fill="#9B6B3A" />

          {/* ─────── FACE PLATE ─────── */}
          <ellipse cx="60" cy="54" rx="22" ry="20" fill="#D4966A" />

          {/* ─────── EYES + EYEBROWS (normal state) ─────── */}
          <g
            className="mk-eyes-wrap"
            style={{ opacity: coverEyes ? 0 : 1 }}
          >
            {/* Left eye */}
            <g className="mk-eyeleft">
              <ellipse cx="46" cy="42" rx="9.5" ry="11" fill="white" />
              <circle  cx="48" cy="44" r="6"         fill="#1A0A00" />
              <circle  cx="51" cy="40" r="2.5"       fill="white"   />
            </g>
            {/* Right eye */}
            <g className="mk-eyeright">
              <ellipse cx="74" cy="42" rx="9.5" ry="11" fill="white" />
              <circle  cx="76" cy="44" r="6"         fill="#1A0A00" />
              <circle  cx="79" cy="40" r="2.5"       fill="white"   />
            </g>
            {/* Eyebrows */}
            <path d="M39 31 Q46 27 53 31" stroke="#5C3A1E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M67 31 Q74 27 81 31" stroke="#5C3A1E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>

          {/* ─────── NOSE ─────── */}
          <ellipse cx="60" cy="59" rx="6"  ry="4"   fill="#c47a45" />
          <circle  cx="57" cy="59" r="2"             fill="#7a4020" />
          <circle  cx="63" cy="59" r="2"             fill="#7a4020" />

          {/* ─────── MOUTH ─────── */}
          {/* happy smile */}
          <path
            d="M52 67 Q60 74 68 67"
            stroke="#7a4020"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            style={{ opacity: coverEyes ? 0 : 1, transition: "opacity 0.25s ease" }}
          />
          {/* shy mouth */}
          <path
            d="M54 70 Q60 67 66 70"
            stroke="#7a4020"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            className="mk-mouth-shy"
            style={{ opacity: coverEyes ? 1 : 0 }}
          />

          {/* ─────── BLUSH (cover state) ─────── */}
          <g className="mk-blush" style={{ opacity: coverEyes ? 0.65 : 0 }}>
            <ellipse cx="33" cy="63" rx="9" ry="6" fill="#F4A0A0" />
            <ellipse cx="87" cy="63" rx="9" ry="6" fill="#F4A0A0" />
          </g>

          {/* ─────── NORMAL ARMS (hands grip modal top edge) ─────── */}
          <g className="mk-arms-normal" style={{ opacity: coverEyes ? 0 : 1 }}>
            {/* Left arm path */}
            <path
              d="M43 83 C36 97 29 113 23 130"
              stroke="#9B6B3A"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            {/* Left hand */}
            <circle cx="21" cy="133" r="9.5" fill="#9B6B3A" />
            <circle cx="21" cy="133" r="6.5" fill="#D4966A" />

            {/* Right arm path */}
            <path
              d="M77 83 C84 97 91 113 97 130"
              stroke="#9B6B3A"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right hand */}
            <circle cx="99" cy="133" r="9.5" fill="#9B6B3A" />
            <circle cx="99" cy="133" r="6.5" fill="#D4966A" />
          </g>

          {/* ─────── COVER ARMS (hands over eyes) ─────── */}
          <g className="mk-arms-cover" style={{ opacity: coverEyes ? 1 : 0 }}>
            {/* Left arm bent up toward left eye */}
            <path
              d="M43 83 C39 70 42 58 44 44"
              stroke="#9B6B3A"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            {/* Left hand palm covering left eye */}
            <ellipse cx="44" cy="40" rx="15.5" ry="13" fill="#9B6B3A" />
            <ellipse cx="44" cy="40" rx="12"   ry="10" fill="#c47a45" />
            {/* Left fingers (5 fingers fanning up) */}
            <ellipse cx="32" cy="33" rx="4"   ry="7"   fill="#9B6B3A" transform="rotate(-18 32 33)" />
            <ellipse cx="37" cy="30" rx="4"   ry="7.5" fill="#9B6B3A" transform="rotate(-6  37 30)" />
            <ellipse cx="44" cy="29" rx="4"   ry="7.5" fill="#9B6B3A" />
            <ellipse cx="51" cy="30" rx="4"   ry="7.5" fill="#9B6B3A" transform="rotate(6   51 30)" />
            <ellipse cx="56" cy="33" rx="4"   ry="7"   fill="#9B6B3A" transform="rotate(18  56 33)" />
            {/* Peek left eye between fingers */}
            <ellipse cx="44" cy="37" rx="7" ry="3.5" fill="white"   />
            <circle  cx="44" cy="38" r="2"            fill="#1A0A00" />

            {/* Right arm bent up toward right eye */}
            <path
              d="M77 83 C81 70 78 58 76 44"
              stroke="#9B6B3A"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right hand palm covering right eye */}
            <ellipse cx="76" cy="40" rx="15.5" ry="13" fill="#9B6B3A" />
            <ellipse cx="76" cy="40" rx="12"   ry="10" fill="#c47a45" />
            {/* Right fingers */}
            <ellipse cx="64" cy="33" rx="4"   ry="7"   fill="#9B6B3A" transform="rotate(-18 64 33)" />
            <ellipse cx="69" cy="30" rx="4"   ry="7.5" fill="#9B6B3A" transform="rotate(-6  69 30)" />
            <ellipse cx="76" cy="29" rx="4"   ry="7.5" fill="#9B6B3A" />
            <ellipse cx="83" cy="30" rx="4"   ry="7.5" fill="#9B6B3A" transform="rotate(6   83 30)" />
            <ellipse cx="88" cy="33" rx="4"   ry="7"   fill="#9B6B3A" transform="rotate(18  88 33)" />
            {/* Peek right eye between fingers */}
            <ellipse cx="76" cy="37" rx="7" ry="3.5" fill="white"   />
            <circle  cx="76" cy="38" r="2"            fill="#1A0A00" />
          </g>

          {/* ─────── LEGS ─────── */}
          <g className="mk-legl">
            <path
              d="M50 118 C45 137 41 153 37 169"
              stroke="#9B6B3A"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse cx="35" cy="171" rx="10" ry="7" fill="#9B6B3A" transform="rotate(-22 35 171)" />
          </g>

          <g className="mk-legr">
            <path
              d="M70 118 C75 137 79 153 83 169"
              stroke="#9B6B3A"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse cx="85" cy="171" rx="10" ry="7" fill="#9B6B3A" transform="rotate(22 85 171)" />
          </g>

        </g>
      </svg>
    </div>
  );
}
