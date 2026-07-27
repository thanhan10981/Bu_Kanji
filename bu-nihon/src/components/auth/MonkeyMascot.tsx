"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export interface MonkeyMascotProps {
  showPassword: boolean;
}

/* ─────────────────────────────────────
   SVG DEFS — gradients & filters
   Premium Pixar/Duolingo quality
───────────────────────────────────── */
function Defs() {
  return (
    <defs>
      {/* ── Head ── main warm brown, lit upper-left */}
      <radialGradient id="g-head" cx="34%" cy="26%" r="72%">
        <stop offset="0%"   stopColor="#E09858" />
        <stop offset="22%"  stopColor="#C07838" />
        <stop offset="55%"  stopColor="#8A5220" />
        <stop offset="82%"  stopColor="#5C3010" />
        <stop offset="100%" stopColor="#361A06" />
      </radialGradient>

      {/* Head — secondary rim colour (warm amber) */}
      <radialGradient id="g-head-rim" cx="78%" cy="72%" r="55%">
        <stop offset="0%"   stopColor="rgba(200,130,60,0.18)" />
        <stop offset="100%" stopColor="rgba(200,130,60,0)" />
      </radialGradient>

      {/* ── Face muzzle ── creamy peach */}
      <radialGradient id="g-face" cx="40%" cy="32%" r="68%">
        <stop offset="0%"   stopColor="#F8D8A8" />
        <stop offset="38%"  stopColor="#E4B478" />
        <stop offset="72%"  stopColor="#C48450" />
        <stop offset="100%" stopColor="#906030" />
      </radialGradient>

      {/* ── Ears ── */}
      <radialGradient id="g-ear-out" cx="38%" cy="28%" r="70%">
        <stop offset="0%"   stopColor="#D08840" />
        <stop offset="55%"  stopColor="#9A5E28" />
        <stop offset="100%" stopColor="#4E2808" />
      </radialGradient>
      <radialGradient id="g-ear-in" cx="42%" cy="38%" r="62%">
        <stop offset="0%"   stopColor="#F5C8A4" />
        <stop offset="55%"  stopColor="#DC9A70" />
        <stop offset="100%" stopColor="#B06844" />
      </radialGradient>

      {/* ── Eye sclera ── glossy white with blue tint */}
      <radialGradient id="g-eye-w" cx="32%" cy="24%" r="72%">
        <stop offset="0%"   stopColor="#FFFFFF" />
        <stop offset="60%"  stopColor="#F0EBE4" />
        <stop offset="100%" stopColor="#D8D0C8" />
      </radialGradient>

      {/* ── Iris ── deep warm brown */}
      <radialGradient id="g-iris" cx="26%" cy="20%" r="78%">
        <stop offset="0%"   stopColor="#4A2400" />
        <stop offset="42%"  stopColor="#2A1000" />
        <stop offset="100%" stopColor="#0A0200" />
      </radialGradient>

      {/* ── Iris light ring ── amber limbal ring */}
      <radialGradient id="g-iris-ring" cx="50%" cy="50%" r="50%">
        <stop offset="65%"  stopColor="rgba(0,0,0,0)" />
        <stop offset="82%"  stopColor="rgba(180,100,20,0.55)" />
        <stop offset="100%" stopColor="rgba(180,100,20,0)" />
      </radialGradient>

      {/* ── Nose ── */}
      <radialGradient id="g-nose" cx="36%" cy="28%" r="68%">
        <stop offset="0%"   stopColor="#DDB090" />
        <stop offset="55%"  stopColor="#A86848" />
        <stop offset="100%" stopColor="#7A3E20" />
      </radialGradient>

      {/* ── Hands / arms — fur dorsal ── */}
      <radialGradient id="g-hand" cx="36%" cy="28%" r="72%">
        <stop offset="0%"   stopColor="#D49048" />
        <stop offset="40%"  stopColor="#A06530" />
        <stop offset="100%" stopColor="#542A0C" />
      </radialGradient>

      {/* ── Finger cylinder — warm sausage gradient ── */}
      <linearGradient id="g-fing" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#6A3A18" />
        <stop offset="16%"  stopColor="#C07848" />
        <stop offset="48%"  stopColor="#E4A860" />
        <stop offset="80%"  stopColor="#B87040" />
        <stop offset="100%" stopColor="#6A3A18" />
      </linearGradient>

      {/* ── Fingertip / palm inner ── */}
      <radialGradient id="g-tip" cx="42%" cy="32%" r="68%">
        <stop offset="0%"   stopColor="#F8CCA0" />
        <stop offset="60%"  stopColor="#D09060" />
        <stop offset="100%" stopColor="#A86038" />
      </radialGradient>

      {/* ── Palm (cover hand) ── */}
      <radialGradient id="g-palm" cx="40%" cy="36%" r="66%">
        <stop offset="0%"   stopColor="#F0BC88" />
        <stop offset="55%"  stopColor="#C88050" />
        <stop offset="100%" stopColor="#804820" />
      </radialGradient>

      {/* ── Cheek flush ── */}
      <radialGradient id="g-cheek" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="rgba(255,120,100,0.7)" />
        <stop offset="60%"  stopColor="rgba(255,100,80,0.28)" />
        <stop offset="100%" stopColor="rgba(255,100,80,0)" />
      </radialGradient>

      {/* ── Drop shadow filter ── */}
      <filter id="f-drop" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="7" stdDeviation="11" floodColor="#2A1000" floodOpacity="0.38" />
      </filter>

      {/* ── Soft shadow (lighter) ── */}
      <filter id="f-shadow-sm" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#2A1000" floodOpacity="0.22" />
      </filter>

      {/* ── Fur texture overlay ── */}
      <filter id="f-fur" colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.72 0.58" numOctaves="4" seed="12" result="noise" />
        <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
        <feBlend in="SourceGraphic" in2="gray" mode="overlay" result="blend" />
        <feComposite in="blend" in2="SourceGraphic" operator="in" />
      </filter>

      {/* ── AO ── */}
      <radialGradient id="g-ao" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="rgba(0,0,0,0.32)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>

      {/* ── Eye glow rim ── */}
      <filter id="f-eye-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      {/* ── Clip paths for eyes ── */}
      <clipPath id="clip-eye-l">
        <ellipse cx="113" cy="82" rx="21" ry="23" />
      </clipPath>
      <clipPath id="clip-eye-r">
        <ellipse cx="167" cy="82" rx="21" ry="23" />
      </clipPath>
    </defs>
  );
}

/* ──────────────────────────────────────────
   GRIPPING HAND — fingers curl down over card edge
───────────────────────────────────────────*/
function GrippingHand({ cx, cy, flipX }: { cx: number; cy: number; flipX?: boolean }) {
  const sx = flipX ? -1 : 1;

  // [xOffset, length, width, rotationAngle]
  const fingers: [number, number, number, number][] = [
    [-17, 22, 13.5, -4],
    [ -5, 25, 14.5,  0],
    [  6, 23, 14.5,  1],
    [ 17, 18, 12.5,  4],
  ];

  return (
    <g transform={`translate(${cx},${cy})`} filter="url(#f-shadow-sm)">
      {/* Pillow palm */}
      <ellipse cx={0} cy={-4} rx={37} ry={15} fill="url(#g-hand)" />
      {/* Palm highlight */}
      <ellipse cx={sx * -4} cy={-8} rx={26} ry={8} fill="rgba(225,165,85,0.30)" />
      {/* Knuckle shine row */}
      <path
        d={`M${sx*-25},-3 Q${sx*-8},-10 ${sx*8},-10 Q${sx*22},-6 ${sx*27},-2`}
        stroke="rgba(240,175,85,0.7)" strokeWidth="2.5" fill="none" strokeLinecap="round"
      />
      {/* Fur texture overlay on palm */}
      <ellipse cx={0} cy={-4} rx={37} ry={15} fill="url(#g-hand)" filter="url(#f-fur)" opacity="0.12" />

      {/* Thumb */}
      <g transform={`rotate(${sx * -20}, ${sx * -28}, 4)`}>
        <path
          d={`M${sx*-26},2 Q${sx*-32},8 ${sx*-32},17 Q${sx*-32},23 ${sx*-26},24`}
          stroke="url(#g-fing)" strokeWidth="16" strokeLinecap="round" fill="none"
        />
        <ellipse cx={sx*-26} cy={25} rx={8.5} ry={8} fill="url(#g-tip)" />
        <ellipse cx={sx*-26} cy={23} rx={5} ry={4} fill="rgba(255,228,190,0.54)" />
        <path d={`M${sx*-32},13 Q${sx*-26},11 ${sx*-20},13`}
          stroke="rgba(225,155,68,0.62)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>

      {/* 4 fingers */}
      {fingers.map(([xOff, len, w, angle], i) => {
        const fx = sx * xOff;
        const midY = len * 0.44;
        return (
          <g key={i} transform={`rotate(${sx * angle}, ${fx}, 0)`}>
            <path
              d={`M${fx - w/2},1 C${fx - w*0.54},${midY*0.5} ${fx - w*0.58},${midY} ${fx - w*0.48},${len-2} Q${fx},${len + w*0.6} ${fx + w*0.48},${len-2} C${fx + w*0.58},${midY} ${fx + w*0.54},${midY*0.5} ${fx + w/2},1 Z`}
              fill="url(#g-fing)"
            />
            {/* Tip cap */}
            <ellipse cx={fx} cy={len} rx={w*0.60} ry={w*0.55} fill="url(#g-tip)" opacity="0.95" />
            <ellipse cx={fx} cy={len-2} rx={w*0.34} ry={w*0.27} fill="rgba(255,232,188,0.52)" />
            {/* Middle knuckle */}
            <path
              d={`M${fx - w*0.76},${midY-2} Q${fx},${midY-5} ${fx + w*0.76},${midY-2}`}
              stroke="rgba(235,165,68,0.68)" strokeWidth="1.8" fill="none" strokeLinecap="round"
            />
            <path
              d={`M${fx - w*0.72},${midY+2.5} Q${fx},${midY+0.5} ${fx + w*0.72},${midY+2.5}`}
              stroke="rgba(65,25,5,0.18)" strokeWidth="1.2" fill="none" strokeLinecap="round"
            />
            {/* Proximal knuckle bump */}
            <ellipse cx={fx} cy={5} rx={w*0.78} ry={4.5} fill="rgba(228,158,68,0.48)" />
          </g>
        );
      })}

      {/* Palm underside shadow */}
      <ellipse cx={0} cy={-10} rx={35} ry={7} fill="rgba(65,25,5,0.14)" />
    </g>
  );
}

/* ──────────────────────────────────────────
   COVER HAND — palm toward viewer (shy eye-cover)
───────────────────────────────────────────*/
function CoverHand({ cx, cy, flipX }: { cx: number; cy: number; flipX?: boolean }) {
  const sx = flipX ? -1 : 1;

  return (
    <g transform={`translate(${cx},${cy})`} filter="url(#f-drop)">

      {/* Palm shape */}
      <path
        d={`
          M${sx*-24},16
          C${sx*-26}, 2 ${sx*-22},-13 ${sx*-13},-19
          C${sx* -6},-23 ${sx*  6},-23 ${sx* 13},-19
          C${sx* 22},-13 ${sx* 26},  2 ${sx* 24}, 16
          C${sx* 22}, 30 ${sx* 13}, 39 ${sx*  0}, 41
          C${sx*-13}, 39 ${sx*-22}, 30 ${sx*-24}, 16
          Z
        `}
        fill="url(#g-hand)"
      />
      {/* Palm top highlight */}
      <ellipse cx={sx*-3} cy={9} rx={17} ry={23} fill="rgba(230,170,90,0.22)" transform={`rotate(${sx*5})`} />
      {/* Fur overlay */}
      <path
        d={`M${sx*-24},16 C${sx*-26},2 ${sx*-22},-13 ${sx*-13},-19 C${sx*-6},-23 ${sx*6},-23 ${sx*13},-19 C${sx*22},-13 ${sx*26},2 ${sx*24},16 C${sx*22},30 ${sx*13},39 ${sx*0},41 C${sx*-13},39 ${sx*-22},30 ${sx*-24},16 Z`}
        fill="url(#g-hand)" filter="url(#f-fur)" opacity="0.10"
      />
      {/* Palm rim light */}
      <ellipse cx={sx*19} cy={13} rx={8} ry={17} fill="rgba(225,160,74,0.14)" />

      {/* Knuckle bumps */}
      <path
        d={`M${sx*-20},-18 Q${sx*-10},-24 ${sx*0},-26 Q${sx*10},-24 ${sx*20},-18`}
        stroke="rgba(235,170,80,0.72)" strokeWidth="3" fill="none" strokeLinecap="round"
      />
      <path
        d={`M${sx*-18},-15 Q${sx*-9},-19 ${sx*0},-21 Q${sx*9},-19 ${sx*18},-15`}
        stroke="rgba(75,32,5,0.16)" strokeWidth="1.4" fill="none" strokeLinecap="round"
      />

      {/* Pinky */}
      <g>
        <path d={`M${sx*20},-16 Q${sx*21},-25 ${sx*20},-35`}
          stroke="url(#g-fing)" strokeWidth="14" strokeLinecap="round" fill="none" />
        <ellipse cx={sx*20} cy={-36} rx={7.5} ry={7.2} fill="url(#g-tip)" />
        <ellipse cx={sx*20} cy={-38} rx={4.5} ry={3.5} fill="rgba(255,230,188,0.54)" />
        <path d={`M${sx*14},-26 Q${sx*20},-28 ${sx*26},-26`}
          stroke="rgba(235,162,68,0.62)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>

      {/* Ring */}
      <g>
        <path d={`M${sx*8},-22 Q${sx*8},-32 ${sx*7},-43`}
          stroke="url(#g-fing)" strokeWidth="16" strokeLinecap="round" fill="none" />
        <ellipse cx={sx*7} cy={-44} rx={8.5} ry={8.2} fill="url(#g-tip)" />
        <ellipse cx={sx*7} cy={-46} rx={5} ry={4} fill="rgba(255,230,188,0.54)" />
        <path d={`M${sx*1},-33 Q${sx*7.5},-35 ${sx*14},-33`}
          stroke="rgba(235,162,68,0.62)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>

      {/* Middle */}
      <g>
        <path d={`M${sx*-4},-24 Q${sx*-4},-34 ${sx*-4},-47`}
          stroke="url(#g-fing)" strokeWidth="17" strokeLinecap="round" fill="none" />
        <ellipse cx={sx*-4} cy={-48} rx={9} ry={8.8} fill="url(#g-tip)" />
        <ellipse cx={sx*-4} cy={-50} rx={5.5} ry={4.5} fill="rgba(255,230,188,0.54)" />
        <path d={`M${sx*-11},-36 Q${sx*-4},-38 ${sx*3},-36`}
          stroke="rgba(235,162,68,0.62)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>

      {/* Index */}
      <g>
        <path d={`M${sx*-16},-21 Q${sx*-15},-31 ${sx*-14},-43`}
          stroke="url(#g-fing)" strokeWidth="15" strokeLinecap="round" fill="none" />
        <ellipse cx={sx*-14} cy={-44} rx={8} ry={7.8} fill="url(#g-tip)" />
        <ellipse cx={sx*-14} cy={-46} rx={5} ry={4} fill="rgba(255,230,188,0.54)" />
        <path d={`M${sx*-21},-33 Q${sx*-14},-35 ${sx*-7},-33`}
          stroke="rgba(235,162,68,0.62)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>

      {/* Thumb */}
      <path
        d={`M${sx*-26},13 C${sx*-37},7 ${sx*-39},-2 ${sx*-35},-10 C${sx*-31},-17 ${sx*-21},-15 ${sx*-18},-8 C${sx*-15},0 ${sx*-18},8 ${sx*-26},13 Z`}
        fill="url(#g-fing)"
      />
      <ellipse cx={sx*-29} cy={2} rx={6} ry={9} fill="rgba(235,168,78,0.28)" />

      {/* Palm base shadow */}
      <ellipse cx={0} cy={35} rx={22} ry={6} fill="rgba(65,25,5,0.10)" />
    </g>
  );
}

/* ─────────────────────────────────────────────
   MonkeyMascot — main export
───────────────────────────────────────────── */
export function MonkeyMascot({ showPassword }: MonkeyMascotProps) {
  const springCfg = { stiffness: 300, damping: 30, mass: 0.55 };
  const rawX = useSpring(0, springCfg);
  const rawY = useSpring(0, springCfg);
  const pupilX = useTransform(rawX, v => Math.max(-5,   Math.min(5,   v)));
  const pupilY = useTransform(rawY, v => Math.max(-4.5, Math.min(4.5, v)));

  const [blinking, setBlinking] = useState(false);
  const blinkRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile     = useRef(false);

  useEffect(() => { isMobile.current = window.matchMedia("(pointer:coarse)").matches; }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (isMobile.current || showPassword) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const eyeX = rect.left + rect.width  * 0.50;
    const eyeY = rect.top  + rect.height * 0.40;
    const dx = e.clientX - eyeX;
    const dy = e.clientY - eyeY;
    const dist = Math.hypot(dx, dy) || 1;
    const t = Math.min(1, dist / 280);
    rawX.set((dx / dist) * 5   * t);
    rawY.set((dy / dist) * 4.5 * t);
  }, [showPassword, rawX, rawY]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [onMouseMove]);

  useEffect(() => { if (showPassword) { rawX.set(0); rawY.set(0); } }, [showPassword, rawX, rawY]);

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

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: 280, height: 230, pointerEvents: "none", userSelect: "none" }}
    >
      <motion.svg
        viewBox="0 0 280 230"
        width="280" height="230"
        overflow="visible"
        style={{ display: "block", position: "absolute", top: 0, left: 0 }}
        /* Gentle idle sway */
        animate={{ rotate: [0, -2.2, 2.2, -1.6, 1.6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
      >
        <Defs />

        {/* ── AO shadow beneath head ── */}
        <ellipse cx="140" cy="150" rx="90" ry="13" fill="url(#g-ao)" />

        {/* ══════════════════════════════════════
            GRIPPING HANDS — normal state
        ══════════════════════════════════════ */}
        <motion.g
          animate={{ opacity: showPassword ? 0 : 1, y: showPassword ? 12 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <GrippingHand cx={63}  cy={148} flipX={false} />
          <GrippingHand cx={217} cy={148} flipX={true}  />
        </motion.g>

        {/* ══════════════════════════════════════
            HEAD + FACE + EYES (always on top)
        ══════════════════════════════════════ */}

        {/* Ears */}
        <ellipse cx="68"  cy="84" rx="28" ry="25" fill="url(#g-ear-out)" filter="url(#f-shadow-sm)" />
        <ellipse cx="68"  cy="85" rx="17" ry="16" fill="url(#g-ear-in)"  />
        <ellipse cx="212" cy="84" rx="28" ry="25" fill="url(#g-ear-out)" filter="url(#f-shadow-sm)" />
        <ellipse cx="212" cy="85" rx="17" ry="16" fill="url(#g-ear-in)"  />

        {/* Head sphere */}
        <ellipse cx="140" cy="86" rx="75" ry="71" fill="url(#g-head)" filter="url(#f-drop)" />
        {/* Fur texture */}
        <ellipse cx="140" cy="86" rx="75" ry="71" fill="url(#g-head)" filter="url(#f-fur)" opacity="0.15" />
        {/* Rim light from right-back */}
        <ellipse cx="140" cy="86" rx="75" ry="71" fill="url(#g-head-rim)" />
        {/* Top specular highlight */}
        <ellipse cx="118" cy="38" rx="34" ry="19" fill="rgba(255,210,155,0.18)" transform="rotate(-22,118,38)" />
        {/* Secondary specular */}
        <ellipse cx="152" cy="42" rx="14" ry="8"  fill="rgba(255,215,165,0.10)" transform="rotate(-15,152,42)" />

        {/* Face muzzle */}
        <ellipse cx="140" cy="101" rx="51" ry="45" fill="url(#g-face)" />
        {/* Muzzle top highlight */}
        <ellipse cx="126" cy="88"  rx="25" ry="17" fill="rgba(255,234,196,0.22)" />

        {/* ── Eye whites ── */}
        <ellipse cx="113" cy="82" rx="22" ry="24" fill="url(#g-eye-w)" />
        <ellipse cx="167" cy="82" rx="22" ry="24" fill="url(#g-eye-w)" />
        {/* Eye rim shadow */}
        <ellipse cx="113" cy="82" rx="22" ry="24" fill="none" stroke="rgba(80,38,8,0.16)" strokeWidth="2.2" />
        <ellipse cx="167" cy="82" rx="22" ry="24" fill="none" stroke="rgba(80,38,8,0.16)" strokeWidth="2.2" />

        {/* ── Pupils — mouse-tracking ── */}
        {!showPassword && (
          <>
            {/* LEFT EYE */}
            <motion.g style={{ x: pupilX, y: pupilY }}>
              <g clipPath="url(#clip-eye-l)">
                {blinking ? (
                  /* Blink lid */
                  <rect x="92" y="79" width="42" height="7" rx="3.5" fill="url(#g-head)" />
                ) : (
                  <>
                    {/* Iris */}
                    <circle cx="113" cy="82" r="15" fill="url(#g-iris)" />
                    {/* Limbal ring */}
                    <circle cx="113" cy="82" r="15" fill="url(#g-iris-ring)" />
                    {/* Pupil */}
                    <circle cx="113" cy="82" r="9"  fill="#060200" />
                    {/* Primary catchlight */}
                    <circle cx="117" cy="77" r="5.2" fill="rgba(255,255,255,0.96)" />
                    {/* Secondary catchlight */}
                    <circle cx="110" cy="87" r="2.4" fill="rgba(255,255,255,0.40)" />
                    {/* Micro specular */}
                    <ellipse cx="119" cy="75" rx="2.4" ry="1.4" fill="white" opacity="0.58" transform="rotate(-32,119,75)" />
                    {/* Ambient iris glow */}
                    <circle cx="113" cy="82" r="9" fill="rgba(120,60,0,0.08)" />
                  </>
                )}
              </g>
            </motion.g>

            {/* RIGHT EYE */}
            <motion.g style={{ x: pupilX, y: pupilY }}>
              <g clipPath="url(#clip-eye-r)">
                {blinking ? (
                  <rect x="147" y="79" width="42" height="7" rx="3.5" fill="url(#g-head)" />
                ) : (
                  <>
                    <circle cx="167" cy="82" r="15" fill="url(#g-iris)" />
                    <circle cx="167" cy="82" r="15" fill="url(#g-iris-ring)" />
                    <circle cx="167" cy="82" r="9"  fill="#060200" />
                    <circle cx="171" cy="77" r="5.2" fill="rgba(255,255,255,0.96)" />
                    <circle cx="164" cy="87" r="2.4" fill="rgba(255,255,255,0.40)" />
                    <ellipse cx="173" cy="75" rx="2.4" ry="1.4" fill="white" opacity="0.58" transform="rotate(-32,173,75)" />
                    <circle cx="167" cy="82" r="9" fill="rgba(120,60,0,0.08)" />
                  </>
                )}
              </g>
            </motion.g>
          </>
        )}

        {/* ── Closed eyes (password visible) ── */}
        {showPassword && (
          <>
            <path d="M93 83 Q113 93 133 83" stroke="rgba(75,38,8,0.40)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M147 83 Q167 93 187 83" stroke="rgba(75,38,8,0.40)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* closed-eye lash shadow */}
            <path d="M93 80 Q113 86 133 80" stroke="rgba(75,38,8,0.12)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M147 80 Q167 86 187 80" stroke="rgba(75,38,8,0.12)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* ── Eyebrows ── */}
        <motion.path
          d="M97 61 Q113 55 129 62"
          stroke="#3A2008" strokeWidth="4.5" fill="none" strokeLinecap="round"
          animate={{ d: showPassword ? "M97 59 Q113 53 129 59" : "M97 61 Q113 55 129 62" }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
        />
        <motion.path
          d="M151 62 Q167 55 183 61"
          stroke="#3A2008" strokeWidth="4.5" fill="none" strokeLinecap="round"
          animate={{ d: showPassword ? "M151 59 Q167 53 183 59" : "M151 62 Q167 55 183 61" }}
          transition={{ type: "spring", stiffness: 220, damping: 22 }}
        />

        {/* ── Nose ── */}
        <ellipse cx="140" cy="109" rx="12.5" ry="9.5" fill="url(#g-nose)" />
        <ellipse cx="134" cy="109" rx="4.5" ry="3.8" fill="rgba(75,28,8,0.58)" />
        <ellipse cx="146" cy="109" rx="4.5" ry="3.8" fill="rgba(75,28,8,0.58)" />
        <ellipse cx="138" cy="105" rx="4.2" ry="2.8" fill="rgba(255,205,162,0.48)" />

        {/* ── Mouth ── */}
        <motion.path
          d="M124 120 Q140 135 156 120"
          stroke="#7A3312" strokeWidth="3.5" fill="none" strokeLinecap="round"
          animate={{ d: showPassword ? "M126 122 Q140 118 154 122" : "M124 120 Q140 135 156 120" }}
          transition={{ type: "spring", stiffness: 190, damping: 20 }}
        />
        {/* Mouth corners */}
        {!showPassword && (
          <>
            <circle cx="124" cy="120" r="2.5" fill="#B25030" opacity="0.55" />
            <circle cx="156" cy="120" r="2.5" fill="#B25030" opacity="0.55" />
          </>
        )}

        {/* ── Cheek blush ── */}
        <motion.ellipse
          cx="92" cy="112" rx="16" ry="11"
          fill="url(#g-cheek)"
          animate={{ opacity: showPassword ? 0.9 : 0.55 }}
          transition={{ duration: 0.35 }}
        />
        <motion.ellipse
          cx="188" cy="112" rx="16" ry="11"
          fill="url(#g-cheek)"
          animate={{ opacity: showPassword ? 0.9 : 0.55 }}
          transition={{ duration: 0.35 }}
        />

        {/* ══════════════════════════════════════
            COVER HANDS — password visible
        ══════════════════════════════════════ */}
        <motion.g
          animate={showPassword
            ? { opacity: 1, y: 0   }
            : { opacity: 0, y: 38  }
          }
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
        >
          <CoverHand cx={106} cy={94} flipX={false} />
          <CoverHand cx={174} cy={94} flipX={true}  />
        </motion.g>

      </motion.svg>
    </div>
  );
}

export function MonkeyBodyLayer() { return null; }
