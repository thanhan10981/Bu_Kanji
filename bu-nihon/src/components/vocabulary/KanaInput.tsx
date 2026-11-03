"use client";
import { useRef, useState } from 'react';
import { editKana, type KanaState } from '@/lib/vocabulary/kana';

export function KanaInput({ value, onChange, onCheck, disabled, readOnly }: {
  value: string; onChange: (value: string) => void; onCheck: () => void; disabled?: boolean; readOnly?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const state = useRef<KanaState>({ value, caret: value.length });
  const composing = useRef(false);
  const compositionEnter = useRef(false);
  const [compositionValue, setCompositionValue] = useState<string | null>(null);
  return <input ref={input} className="input-base vocab-answer" aria-label="Cách đọc hiragana hoặc chữ Nhật" autoFocus
    value={compositionValue ?? value} disabled={disabled} readOnly={readOnly} autoComplete="off" autoCorrect="off"
    autoCapitalize="off" spellCheck={false} placeholder="Gõ romaji, ví dụ taberu"
    onCompositionStart={() => { composing.current = true; state.current = { value, caret: input.current?.selectionStart ?? value.length }; }}
    onCompositionEnd={event => {
      composing.current = false;
      const next = event.currentTarget.value;
      state.current = { value: next, caret: event.currentTarget.selectionStart ?? next.length };
      setCompositionValue(null); onChange(next);
    }}
    onChange={event => {
      const element = event.currentTarget;
      if (composing.current || (event.nativeEvent as InputEvent).isComposing) { setCompositionValue(element.value); return; }
      const type = (event.nativeEvent as InputEvent).inputType ?? 'insertText';
      const previous = state.current.value === value ? state.current : { value, caret: element.selectionStart ?? value.length };
      const next = editKana(previous, element.value, element.selectionStart ?? element.value.length, type);
      state.current = next; onChange(next.value);
      // Also set the DOM value when conversion yields the same controlled value (e.g. replacement).
      element.value = next.value;
      element.setSelectionRange(next.caret, next.caret);
    }}
    onSelect={event => {
      const el = event.currentTarget;
      if (el.selectionStart !== state.current.caret || el.selectionStart !== el.selectionEnd)
        state.current = { value: el.value, caret: el.selectionStart ?? el.value.length };
    }}
    onPaste={() => { state.current = { value, caret: input.current?.selectionStart ?? value.length }; }}
    onKeyDown={event => {
      if (event.key !== 'Enter') return;
      if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) {
        compositionEnter.current = true; return;
      }
      if (compositionEnter.current) { event.preventDefault(); return; }
      event.preventDefault(); onCheck();
    }}
    onKeyUp={event => { if (event.key === 'Enter') compositionEnter.current = false; }}
  />;
}
