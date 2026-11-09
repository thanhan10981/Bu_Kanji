'use client';
import { useRef, useState } from 'react';

export function ExamInk({ enabled, paths, onStroke }: { enabled: boolean; paths: string[]; onStroke: (path: string) => void }) {
  const [draft, setDraft] = useState(''); const drawing = useRef('');
  const position = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return `${Math.max(0, Math.min(1000, (event.clientX - rect.left) / rect.width * 1000)).toFixed(1)} ${Math.max(0, Math.min(1000, (event.clientY - rect.top) / rect.height * 1000)).toFixed(1)}`;
  };
  const end = () => { if (drawing.current) onStroke(drawing.current); drawing.current = ''; setDraft(''); };
  return <svg className={`exam-ink ${enabled ? 'enabled' : ''}`} viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"
    onPointerDown={event => { if (!enabled) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); drawing.current = `M${position(event)} L${position(event)}`; setDraft(drawing.current); }}
    onPointerMove={event => { if (!drawing.current || !enabled || drawing.current.length > 7900) return; drawing.current += ` L${position(event)}`; setDraft(drawing.current); }}
    onPointerUp={end} onPointerCancel={end}>
    {[...paths, ...(draft ? [draft] : [])].map((path, i) => <path key={i} d={path} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />)}
  </svg>;
}
