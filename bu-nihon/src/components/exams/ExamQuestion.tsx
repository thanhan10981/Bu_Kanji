'use client';
import Image from 'next/image';
import { useState } from 'react';
import { BookOpen, Check, CheckCircle2, X } from 'lucide-react';
import type { PublicQuestion } from '@/lib/exams/model';
import type { ExamReport, ExamText } from '@/lib/exams/schema';
import { ExamScriptReview, ExamSourcePages } from './ExamSourcePages';

export function RichExamText({ tokens }: { tokens: ExamText }) {
  return <>{tokens.map((token, index) => {
    const text = token.reading ? <ruby>{token.text}<rp>(</rp><rt>{token.reading}</rt><rp>)</rp></ruby> : token.text;
    return <span key={index} className={token.underline ? 'exam-underlined' : undefined}>{text}</span>;
  })}</>;
}

function NativeFigure({ image }: { image: { src: string; width: number; height: number; alt: string } }) {
  const [failed, setFailed] = useState(false); const [loaded, setLoaded] = useState(false); const [retry, setRetry] = useState(0);
  return <figure className="exam-native-figure">
    {!loaded && !failed && <p className="exam-small-note" role="status">Đang tải hình…</p>}
    <Image key={retry} unoptimized src={image.src} alt={image.alt} width={image.width} height={image.height}
      onLoad={() => { setLoaded(true); setFailed(false); }} onError={() => { setFailed(true); setLoaded(false); }} />
    {failed && <p className="exam-notice" role="alert">Chưa tải được hình. <button className="exam-text-button" onClick={() => { setFailed(false); setRetry(value => value + 1); }}>Tải lại hình</button></p>}
  </figure>;
}

export function ExamQuestion({ question, selected, onChange, locked = false, result, showPassage = true }: {
  question: PublicQuestion; selected: string[]; onChange?: (choices: string[]) => void; locked?: boolean;
  result?: ExamReport['questions'][number]; showPassage?: boolean;
}) {
  const [sourceOpen, setSourceOpen] = useState(false);
  return <>
    {showPassage && Boolean(question.content?.passage.length) && <div className="exam-native-passage" lang="ja"><RichExamText tokens={question.content!.passage} /></div>}
    {question.materials.map(material => <section className="exam-reading" key={material.materialId}><p lang="ja">{material.text}</p></section>)}
    <h3 className="exam-question-stem" id={`stem-${question.questionId}`} lang="ja">{question.content ? <RichExamText tokens={question.content.stem} /> : question.stem}</h3>
    {question.content?.images.map(image => <NativeFigure key={image.src} image={image} />)}
    <fieldset className="exam-choices" aria-labelledby={`stem-${question.questionId}`} disabled={locked || Boolean(result)}>
      <legend className="exam-sr">Chọn {question.type === 'multiple_choice' ? 'các đáp án' : 'một đáp án'}</legend>
      {question.choices.map(choice => {
        const checked = selected.includes(choice.choiceId); const correct = result?.correctChoiceIds.includes(choice.choiceId); const wrong = result && checked && !correct;
        return <label className={`exam-choice ${checked ? 'selected' : ''} ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`} key={choice.choiceId}>
          <input type={question.type === 'multiple_choice' ? 'checkbox' : 'radio'} name={question.questionId} value={choice.choiceId} checked={checked} onChange={() => onChange?.(question.type === 'single_choice' ? [choice.choiceId] : checked ? selected.filter(id => id !== choice.choiceId) : [...selected, choice.choiceId])} />
          <span className="exam-choice-index">{choice.choiceId}</span><span lang="ja">{question.content ? <RichExamText tokens={question.content.choices[choice.choiceId]} /> : choice.text}</span>{correct ? <CheckCircle2 size={20} /> : wrong ? <X size={20} /> : checked ? <Check size={20} /> : null}
        </label>;
      })}
    </fieldset>
    {result && <><p className={`exam-answer-explanation ${result.isCorrect ? 'positive' : ''}`}>{result.isCorrect ? <CheckCircle2 size={18} /> : <BookOpen size={18} />}{result.isCorrect ? 'Bạn đã chọn đúng.' : !selected.length ? 'Bạn đã bỏ trống câu này.' : 'Câu này cần ôn lại.'} <strong>Đáp án: {result.correctChoiceIds.join(', ')}</strong></p>
      {result.reviewPages?.length ? <ExamScriptReview pages={result.reviewPages} /> : null}</>}
    <details className="exam-source" onToggle={event => setSourceOpen(event.currentTarget.open)}><summary>Đối chiếu đề gốc{result ? ' và nguồn đáp án' : ''}</summary>
      {result && <><p>Đề: {result.questionSource}</p><p>Đáp án: {result.answerSource}</p></>}
      {sourceOpen && question.sourcePages?.length ? <ExamSourcePages pages={question.sourcePages} initialPage={question.initialPage} pdfUrl={question.sourcePdf} /> : null}
    </details>
  </>;
}
