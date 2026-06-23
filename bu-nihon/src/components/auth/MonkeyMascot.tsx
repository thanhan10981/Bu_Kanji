"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useSpring, useTransform, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
interface MonkeyMascotProps {
  showPassword: boolean;
}

/* ─────────────────────────────────────────
   SVG Defs — gradients & filters for 3D premium look
───────────────────────────────────────── */
function MonkeyDefs() {
  return (
    <defs>
      {/* ── Head sphere – warm brown, lit from upper-left ── */}
      <radialGradient id="mk-head" cx="36%" cy="28%" r="70%">
        <stop offset="0%"   stopColor="#D4894A" />
        <stop offset="35%"  stopColor="#A86530" />
        <stop offset="70%"  stopColor="#7A4520" />
        <stop offset="100%" stopColor="#4A2510" />
      </radialGradient>

      {/* ── Face muzzle – lighter, peachy ── */}
      <radialGradient id="mk-face" cx="42%" cy="35%" r="65%">
        <stop offset="0%"   stopColor="#F2C890" />
        <stop offset="45%"  stopColor="#D4966A" />
        <stop offset="100%" stopColor="#A06840" />
      </radialGradient>

      {/* ── Ear outer ── */}
      <radialGradient id="mk-ear-out" cx="40%" cy="30%" r="68%">
        <stop offset="0%"   stopColor="#C47840" />
        <stop offset="100%" stopColor="#5A3015" />
      </radialGradient>

      {/* ── Ear inner ── */}
      <radialGradient id="mk-ear-in" cx="45%" cy="40%" r="60%">
        <stop offset="0%"   stopColor="#F0B898" />
        <stop offset="100%" stopColor="#C07858" />
      </radialGradient>

      {/* ── Body / arms ── */}
      <radialGradient id="mk-body" cx="38%" cy="25%" r="72%">
        <stop offset="0%"   stopColor="#C07840" />
        <stop offset="50%"  stopColor="#8B5530" />
        <stop offset="100%" stopColor="#4A2510" />
      </radialGradient>

      {/* ── Palm / hand ── */}
      <radialGradient id="mk-palm" cx="40%" cy="30%" r="65%">
        <stop offset="0%"   stopColor="#E8B078" />
        <stop offset="100%" stopColor="#A06845" />
      </radialGradient>

      {/* ── Eyeball glossy dark ── */}
      <radialGradient id="mk-eye-ball" cx="28%" cy="22%" r="75%">
        <stop offset="0%"   stopColor="#2C1400" />
        <stop offset="45%"  stopColor="#1A0A00" />
        <stop offset="100%" stopColor="#0D0500" />
      </radialGradient>

      {/* ── Eye white ── */}
      <radialGradient id="mk-eye-white" cx="35%" cy="28%" r="70%">
        <stop offset="0%"   stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E8E0D8" />
      </radialGradient>

      {/* ── Eye iris ring ── */}
      <radialGradient id="mk-iris" cx="30%" cy="25%" r="70%">
        <stop offset="0%"   stopColor="#4A2800" />
        <stop offset="100%" stopColor="#1A0800" />
      </radialGradient>

      {/* ── Nose ── */}
      <radialGradient id="mk-nose" cx="38%" cy="30%" r="65%">
        <stop offset="0%"   stopColor="#D4A080" />
        <stop offset="100%" stopColor="#904830" />
      </radialGradient>

      {/* ── Ambient occlusion shadow under head ── */}
      <radialGradient id="mk-ao" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="rgba(0,0,0,0.35)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>

      {/* ── Drop shadow filter ── */}
      <filter id="mk-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#3A1800" floodOpacity="0.4" />
      </filter>

      {/* ── Soft glow filter for eyes ── */}
      <filter id="mk-eye-glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* ── Fur texture overlay ── */}
      <filter id="mk-fur">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
        <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
        <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blend" />
        <feComposite in="blend" in2="SourceGraphic" operator="in" />
      </filter>

      {/* ── Clip: head circle ── */}
      <clipPath id="mk-head-clip">
        <ellipse cx="120" cy="80" rx="72" ry="70" />
      </clipPath>
    </defs>
  );
}

/* ─────────────────────────────────────────
   MonkeyMascot — main export
───────────────────────────────────────── */
export function MonkeyMascot({ showPassword }: MonkeyMascotProps) {
  /* ── Pupil spring physics ── */
  const springCfg = { stiffness: 280, damping: 28, mass: 0.6 };
  const rawX = useSpring(0, springCfg);
  const rawY = useSpring(0, springCfg);

  /* Clamp to ±5px */
  const pupilX = useTransform(rawX, v => Math.max(-5, Math.min(5, v)));
  const pupilY = useTransform(rawY, v => Math.max(-5, Math.min(5, v)));

  /* ── Blink state ── */
  const [blinking, setBlinking] = useState(false);
  const blinkRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Refs ── */
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobileRef  = useRef(false);

  /* ── Detect mobile ── */
  useEffect(() => {
    isMobileRef.current = window.matchMedia("(pointer:coarse)").matches;
  }, []);

  /* ── Mouse tracking ── */
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (isMobileRef.current || showPassword) return;
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    // Eye center in screen space (approx. cx=120, cy=78 within 240px-wide SVG)
    const scaleX = rect.width / 240;
    const scaleY = rect.height / 220; // approx rendered height
    const eyeX = rect.left + 120 * scaleX;
    const eyeY = rect.top  +  78 * scaleY;

    const dx = e.clientX - eyeX;
    const dy = e.clientY - eyeY;
    const dist = Math.hypot(dx, dy) || 1;
    const t = Math.min(1, dist / 300);
    rawX.set((dx / dist) * 5 * t);
    rawY.set((dy / dist) * 5 * t);
  }, [showPassword, rawX, rawY]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [onMouseMove]);

  /* reset pupils when covering */
  useEffect(() => {
    if (showPassword) { rawX.set(0); rawY.set(0); }
  }, [showPassword, rawX, rawY]);

  /* ── Random blink scheduler ── */
  useEffect(() => {
    if (showPassword) return;
    const schedule = () => {
      blinkRef.current = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => { setBlinking(false); schedule(); }, 150);
      }, 4000 + Math.random() * 4000);
    };
    schedule();
    return () => { if (blinkRef.current) clearTimeout(blinkRef.current); };
  }, [showPassword]);

  /* ── Hand spring (cover-eyes y-offset) ── */
  const handSpring = useSpring(showPassword ? -88 : 0, {
    stiffness: 320,
    damping:   26,
    mass:      0.8,
  });
  useEffect(() => {
    handSpring.set(showPassword ? -88 : 0);
  }, [showPassword, handSpring]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: 240, height: 220 }}>

      {/* ══════════════════════════════════════════
          LAYER 2 — body/arms behind card
          (rendered at z-index 1 in LoginModal)
      ══════════════════════════════════════════ */}

      {/* ══════════════════════════════════════════
          LAYER 4 — head + gripping hands in front
      ══════════════════════════════════════════ */}
      <motion.svg
        viewBox="0 0 240 220"
        width="240"
        height="220"
        overflow="visible"
        style={{ display: "block", position: "absolute", top: 0, left: 0 }}
        animate={{ rotate: [0, -2.5, 2.5, -1.5, 1.5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
      >
        <MonkeyDefs />

        {/* ── Ambient shadow under chin (depth cue) ── */}
        <ellipse cx="120" cy="148" rx="68" ry="14" fill="url(#mk-ao)" />

        {/* ── EARS (behind head) ── */}
        {/* Left ear */}
        <ellipse cx="52"  cy="86" rx="26" ry="23" fill="url(#mk-ear-out)" filter="url(#mk-shadow)" />
        <ellipse cx="52"  cy="86" rx="16" ry="14" fill="url(#mk-ear-in)"  />
        {/* Right ear */}
        <ellipse cx="188" cy="86" rx="26" ry="23" fill="url(#mk-ear-out)" filter="url(#mk-shadow)" />
        <ellipse cx="188" cy="86" rx="16" ry="14" fill="url(#mk-ear-in)"  />

        {/* ── HEAD SPHERE ── */}
        <ellipse
          cx="120" cy="83"
          rx="72" ry="70"
          fill="url(#mk-head)"
          filter="url(#mk-shadow)"
        />
        {/* Fur texture overlay */}
        <ellipse cx="120" cy="83" rx="72" ry="70" fill="url(#mk-head)" filter="url(#mk-fur)" opacity="0.18" />
        {/* Rim light from right */}
        <ellipse cx="120" cy="83" rx="72" ry="70"
          fill="none"
          stroke="rgba(220,140,70,0.25)"
          strokeWidth="12"
          strokeDasharray="180 300"
          strokeDashoffset="-80"
        />

        {/* ── FACE MUZZLE ── */}
        <ellipse cx="120" cy="100" rx="48" ry="42" fill="url(#mk-face)" />
        {/* Face highlight */}
        <ellipse cx="108" cy="88" rx="20" ry="14" fill="rgba(255,230,190,0.22)" />

        {/* ── EYE AREAS (white sclera) ── */}
        {/* Left eye socket */}
        <ellipse cx="93"  cy="80" rx="22" ry="23" fill="url(#mk-eye-white)" />
        {/* Right eye socket */}
        <ellipse cx="147" cy="80" rx="22" ry="23" fill="url(#mk-eye-white)" />

        {/* ── Eye shadow rims ── */}
        <ellipse cx="93"  cy="80" rx="22" ry="23" fill="none" stroke="rgba(80,40,10,0.25)" strokeWidth="2.5" />
        <ellipse cx="147" cy="80" rx="22" ry="23" fill="none" stroke="rgba(80,40,10,0.25)" strokeWidth="2.5" />

        {/* ── IRISES + PUPILS (animated, mouse-tracking) ── */}
        {!showPassword && (
          <>
            {/* Left iris */}
            <motion.g style={{ x: pupilX, y: pupilY }}>
              {blinking ? (
                /* Blink: eyelid closes */
                <rect x="75" y="77" width="36" height="7" rx="3.5" fill="url(#mk-head)" />
              ) : (
                <>
                  {/* Iris ring */}
                  <circle cx="93" cy="80" r="14" fill="url(#mk-iris)" />
                  {/* Pupil */}
                  <circle cx="93" cy="80" r="9.5" fill="url(#mk-eye-ball)" />
                  {/* Primary specular highlight */}
                  <circle cx="97" cy="75" r="4.5" fill="rgba(255,255,255,0.92)" />
                  {/* Secondary soft highlight */}
                  <circle cx="89" cy="84" r="2.5" fill="rgba(255,255,255,0.35)" />
                  {/* Corneal glint */}
                  <ellipse cx="98" cy="73" rx="2" ry="1.2" fill="white" opacity="0.6" transform="rotate(-30,98,73)" />
                </>
              )}
            </motion.g>

            {/* Right iris */}
            <motion.g style={{ x: pupilX, y: pupilY }}>
              {blinking ? (
                <rect x="129" y="77" width="36" height="7" rx="3.5" fill="url(#mk-head)" />
              ) : (
                <>
                  <circle cx="147" cy="80" r="14" fill="url(#mk-iris)" />
                  <circle cx="147" cy="80" r="9.5" fill="url(#mk-eye-ball)" />
                  <circle cx="151" cy="75" r="4.5" fill="rgba(255,255,255,0.92)" />
                  <circle cx="143" cy="84" r="2.5" fill="rgba(255,255,255,0.35)" />
                  <ellipse cx="152" cy="73" rx="2" ry="1.2" fill="white" opacity="0.6" transform="rotate(-30,152,73)" />
                </>
              )}
            </motion.g>
          </>
        )}

        {/* Eyes covered state: hands show instead of pupils */}
        {showPassword && (
          <>
            {/* Closed eyes behind hands */}
            <path d="M75 80 Q93 88 111 80" stroke="rgba(80,40,10,0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M129 80 Q147 88 165 80" stroke="rgba(80,40,10,0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* ── EYEBROWS ── */}
        <motion.path
          d={showPassword ? "M76 58 Q93 52 110 58" : "M76 60 Q93 54 110 61"}
          stroke="#4A2C10" strokeWidth="4" fill="none" strokeLinecap="round"
          animate={{ d: showPassword ? "M76 58 Q93 52 110 58" : "M76 60 Q93 54 110 61" }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
        <motion.path
          d={showPassword ? "M130 58 Q147 52 164 58" : "M130 61 Q147 54 164 60"}
          stroke="#4A2C10" strokeWidth="4" fill="none" strokeLinecap="round"
          animate={{ d: showPassword ? "M130 58 Q147 52 164 58" : "M130 61 Q147 54 164 60" }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />

        {/* ── NOSE ── */}
        <ellipse cx="120" cy="108" rx="12" ry="8.5" fill="url(#mk-nose)" />
        <ellipse cx="115" cy="108" rx="4.5" ry="3.5" fill="rgba(80,30,10,0.55)" />
        <ellipse cx="125" cy="108" rx="4.5" ry="3.5" fill="rgba(80,30,10,0.55)" />
        {/* Nose highlight */}
        <ellipse cx="118" cy="105" rx="4" ry="2.5" fill="rgba(255,200,160,0.5)" />

        {/* ── MOUTH ── */}
        <motion.path
          d={showPassword
            ? "M106 122 Q120 118 134 122"   /* flat/embarrassed */
            : "M104 120 Q120 134 136 120"}  /* big warm smile    */
          stroke="#7A3515" strokeWidth="3" fill="none" strokeLinecap="round"
          animate={{ d: showPassword ? "M106 122 Q120 118 134 122" : "M104 120 Q120 134 136 120" }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
        />
        {/* Smile cheek dimples */}
        {!showPassword && (
          <>
            <ellipse cx="78"  cy="118" rx="14" ry="10" fill="rgba(230,130,100,0.3)" />
            <ellipse cx="162" cy="118" rx="14" ry="10" fill="rgba(230,130,100,0.3)" />
          </>
        )}
        {/* Blush when covering */}
        <AnimatePresence>
          {showPassword && (
            <>
              <motion.ellipse
                cx="78" cy="118" rx="14" ry="10" fill="rgba(240,120,100,0.45)"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.ellipse
                cx="162" cy="118" rx="14" ry="10" fill="rgba(240,120,100,0.45)"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════
            GRIPPING HANDS
            Normal: at bottom (card top edge)
            Cover:  raised over eyes
        ═══════════════════════════════ */}

        {/* ── Left arm + hand ── */}
        <motion.g style={{ y: handSpring }}>
          {/* Arm */}
          <motion.path
            d={showPassword
              ? "M82 148 C74 136 72 110 80 88"
              : "M82 148 C70 162 56 174 44 182"}
            stroke="url(#mk-body)" strokeWidth="18" strokeLinecap="round" fill="none"
            animate={{ d: showPassword
              ? "M82 148 C74 136 72 110 80 88"
              : "M82 148 C70 162 56 174 44 182"
            }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          />
          {/* Palm */}
          <motion.ellipse
            animate={showPassword
              ? { cx: 85,  cy: 82, rx: 24, ry: 20, transform: "rotate(0,85,82)"  }
              : { cx: 40,  cy: 182, rx: 30, ry: 12, transform: "rotate(-12,40,182)" }
            }
            fill="url(#mk-body)"
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          />
          <motion.ellipse
            animate={showPassword
              ? { cx: 85,  cy: 82,  rx: 20, ry: 16, transform: "rotate(0,85,82)"    }
              : { cx: 40,  cy: 181, rx: 24, ry:  9,  transform: "rotate(-12,40,181)" }
            }
            fill="url(#mk-palm)"
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          />

          {/* Fingers — fan shape */}
          <AnimatePresence mode="wait">
            {showPassword ? (
              <motion.g key="fingers-cover-l"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ellipse cx="69"  cy="71" rx="5.5" ry="10" fill="url(#mk-body)" transform="rotate(-25,69,71)" />
                <ellipse cx="77"  cy="66" rx="5.5" ry="10.5" fill="url(#mk-body)" transform="rotate(-10,77,66)" />
                <ellipse cx="86"  cy="64" rx="5.5" ry="11" fill="url(#mk-body)" />
                <ellipse cx="95"  cy="66" rx="5.5" ry="10.5" fill="url(#mk-body)" transform="rotate(10,95,66)" />
                <ellipse cx="103" cy="71" rx="5.5" ry="10" fill="url(#mk-body)" transform="rotate(25,103,71)" />
                {/* Peek-through eye */}
                <ellipse cx="85"  cy="76" rx="11" ry="6"   fill="url(#mk-eye-white)" />
                <circle  cx="86"  cy="77" r="4"             fill="url(#mk-eye-ball)"   />
                <circle  cx="88"  cy="75" r="1.8"           fill="rgba(255,255,255,0.9)" />
              </motion.g>
            ) : (
              <motion.g key="fingers-rest-l"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ellipse cx="22"  cy="175" rx="5" ry="10"   fill="url(#mk-body)" transform="rotate(-30,22,175)" />
                <ellipse cx="30"  cy="171" rx="5" ry="10.5" fill="url(#mk-body)" transform="rotate(-14,30,171)" />
                <ellipse cx="40"  cy="170" rx="5" ry="11"   fill="url(#mk-body)" />
                <ellipse cx="50"  cy="171" rx="5" ry="10.5" fill="url(#mk-body)" transform="rotate(14,50,171)" />
                <ellipse cx="58"  cy="175" rx="5" ry="10"   fill="url(#mk-body)" transform="rotate(28,58,175)" />
              </motion.g>
            )}
          </AnimatePresence>
        </motion.g>

        {/* ── Right arm + hand ── */}
        <motion.g style={{ y: handSpring }}>
          <motion.path
            d={showPassword
              ? "M158 148 C166 136 168 110 160 88"
              : "M158 148 C170 162 184 174 196 182"}
            stroke="url(#mk-body)" strokeWidth="18" strokeLinecap="round" fill="none"
            animate={{ d: showPassword
              ? "M158 148 C166 136 168 110 160 88"
              : "M158 148 C170 162 184 174 196 182"
            }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          />
          <motion.ellipse
            animate={showPassword
              ? { cx: 155, cy: 82,  rx: 24, ry: 20, transform: "rotate(0,155,82)"   }
              : { cx: 200, cy: 182, rx: 30, ry: 12,  transform: "rotate(12,200,182)" }
            }
            fill="url(#mk-body)"
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          />
          <motion.ellipse
            animate={showPassword
              ? { cx: 155, cy: 82,  rx: 20, ry: 16, transform: "rotate(0,155,82)"    }
              : { cx: 200, cy: 181, rx: 24, ry:  9,  transform: "rotate(12,200,181)"  }
            }
            fill="url(#mk-palm)"
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          />

          <AnimatePresence mode="wait">
            {showPassword ? (
              <motion.g key="fingers-cover-r"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ellipse cx="137" cy="71" rx="5.5" ry="10"   fill="url(#mk-body)" transform="rotate(-25,137,71)" />
                <ellipse cx="145" cy="66" rx="5.5" ry="10.5" fill="url(#mk-body)" transform="rotate(-10,145,66)" />
                <ellipse cx="154" cy="64" rx="5.5" ry="11"   fill="url(#mk-body)" />
                <ellipse cx="163" cy="66" rx="5.5" ry="10.5" fill="url(#mk-body)" transform="rotate(10,163,66)" />
                <ellipse cx="171" cy="71" rx="5.5" ry="10"   fill="url(#mk-body)" transform="rotate(25,171,71)" />
                {/* Peek-through eye */}
                <ellipse cx="154" cy="76" rx="11" ry="6"   fill="url(#mk-eye-white)" />
                <circle  cx="155" cy="77" r="4"             fill="url(#mk-eye-ball)"   />
                <circle  cx="157" cy="75" r="1.8"           fill="rgba(255,255,255,0.9)" />
              </motion.g>
            ) : (
              <motion.g key="fingers-rest-r"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ellipse cx="182" cy="175" rx="5" ry="10"   fill="url(#mk-body)" transform="rotate(-28,182,175)" />
                <ellipse cx="190" cy="171" rx="5" ry="10.5" fill="url(#mk-body)" transform="rotate(-14,190,171)" />
                <ellipse cx="200" cy="170" rx="5" ry="11"   fill="url(#mk-body)" />
                <ellipse cx="210" cy="171" rx="5" ry="10.5" fill="url(#mk-body)" transform="rotate(14,210,171)" />
                <ellipse cx="218" cy="175" rx="5" ry="10"   fill="url(#mk-body)" transform="rotate(30,218,175)" />
              </motion.g>
            )}
          </AnimatePresence>
        </motion.g>

        {/* ── HEAD top spec highlight (3D rim light) ── */}
        <ellipse
          cx="104" cy="36"
          rx="28" ry="16"
          fill="rgba(255,200,140,0.18)"
          transform="rotate(-20,104,36)"
        />

      </motion.svg>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   MonkeyBodyLayer — rendered BEHIND the login card (z-index 1)
   Shows only the body/torso that peeks below the card top.
────────────────────────────────────────────────────────── */
export function MonkeyBodyLayer() {
  return (
    <svg
      viewBox="0 0 240 80"
      width="240"
      height="80"
      overflow="visible"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="mkb-body" cx="38%" cy="20%" r="72%">
          <stop offset="0%"   stopColor="#C07840" />
          <stop offset="50%"  stopColor="#8B5530" />
          <stop offset="100%" stopColor="#4A2510" />
        </radialGradient>
        <radialGradient id="mkb-belly" cx="42%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#F2C890" />
          <stop offset="60%"  stopColor="#D4966A" />
          <stop offset="100%" stopColor="#A06840" />
        </radialGradient>
        <filter id="mkb-shadow">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#3A1800" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Body torso (top part visible just below card rim) */}
      <ellipse cx="120" cy="20" rx="58" ry="52" fill="url(#mkb-body)" filter="url(#mkb-shadow)" />
      {/* Belly */}
      <ellipse cx="120" cy="28" rx="36" ry="34" fill="url(#mkb-belly)" />
      {/* Body highlight */}
      <ellipse cx="106" cy="8" rx="22" ry="14" fill="rgba(220,150,80,0.22)" />
    </svg>
  );
}
