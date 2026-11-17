import React, { useState } from 'react';
import { Check, Play, Plus, RotateCcw, Save, Trash2, X, Edit3 } from 'lucide-react';
import { DEFAULT_PYTHON_QUESTIONS } from '../data/defaultQuestions';
import { ChoiceIndex, Question } from '../types/game';

interface QuestionManagerModalProps {
  initialQuestions: Question[];
  onSaveQuestions: (questions: Question[]) => void;
  onSaveAndPlay: (questions: Question[]) => void;
  onClose: () => void;
}

export const QuestionManagerModal: React.FC<QuestionManagerModalProps> = ({
  initialQuestions,
  onSaveQuestions,
  onSaveAndPlay,
  onClose,
}) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [editingIndex, setEditingIndex] = useState<number | null>(
    initialQuestions.length < 5 ? -1 : null
  );

  // Form state (-1 means adding new question, 0..4 means editing existing)
  const [text, setText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [choice0, setChoice0] = useState('');
  const [choice1, setChoice1] = useState('');
  const [choice2, setChoice2] = useState('');
  const [correctIndex, setCorrectIndex] = useState<ChoiceIndex>(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const openAddForm = () => {
    setEditingIndex(-1);
    setText('');
    setCodeSnippet('');
    setChoice0('');
    setChoice1('');
    setChoice2('');
    setCorrectIndex(0);
    setFormError(null);
  };

  const openEditForm = (idx: number) => {
    const q = questions[idx];
    if (!q) return;
    setEditingIndex(idx);
    setText(q.text);
    setCodeSnippet(q.codeSnippet ?? '');
    setChoice0(q.choices[0]);
    setChoice1(q.choices[1]);
    setChoice2(q.choices[2]);
    setCorrectIndex(q.correctIndex);
    setFormError(null);
  };

  const handleDelete = (idx: number) => {
    const next = questions.filter((_, i) => i !== idx);
    setQuestions(next);
    onSaveQuestions(next);
    if (editingIndex === idx) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > idx) {
      setEditingIndex(editingIndex - 1);
    }
    setSaveNotice('تم حذف السؤال وحفظ التغييرات محليًا.');
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = text.trim();
    const c0 = choice0.trim();
    const c1 = choice1.trim();
    const c2 = choice2.trim();

    if (!trimmedText) {
      setFormError('الرجاء كتابة نص السؤال.');
      return;
    }
    if (!c0 || !c1 || !c2) {
      setFormError('الرجاء كتابة جميع الاختيارات الثلاثة.');
      return;
    }

    const newQuestion: Question = {
      id:
        editingIndex !== null && editingIndex >= 0
          ? questions[editingIndex].id
          : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: trimmedText,
      codeSnippet: codeSnippet.trim() ? codeSnippet.trim() : undefined,
      choices: [c0, c1, c2],
      correctIndex,
    };

    let next: Question[];
    if (editingIndex !== null && editingIndex >= 0) {
      next = questions.map((item, i) => (i === editingIndex ? newQuestion : item));
    } else {
      if (questions.length >= 5) {
        setFormError('الحد الأقصى هو 5 أسئلة في المغامرة.');
        return;
      }
      next = [...questions, newQuestion];
    }

    setQuestions(next);
    onSaveQuestions(next);
    setSaveNotice('تم حفظ السؤال محليًا في المتصفح.');
    setFormError(null);

    if (next.length < 5 && editingIndex === -1) {
      // Clear form quickly so teacher can add the next question seamlessly
      setText('');
      setCodeSnippet('');
      setChoice0('');
      setChoice1('');
      setChoice2('');
      setCorrectIndex(0);
    } else {
      setEditingIndex(null);
    }
  };

  const handleLoadTemplate = () => {
    const cloned = DEFAULT_PYTHON_QUESTIONS.map((q, i) => ({
      ...q,
      id: `custom-tpl-${Date.now()}-${i}`,
      choices: [...q.choices] as [string, string, string],
    }));
    setQuestions(cloned);
    onSaveQuestions(cloned);
    setEditingIndex(null);
    setSaveNotice('تم نسخ 5 أسئلة جاهزة لتتمكني من تعديلها بحرية.');
  };

  const isCompleteSet = questions.length === 5;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 text-slate-100 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              إدارة أسئلة المغامرة (5 أسئلة)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              تُحفظ أسئلتك تلقائيًا في هذا المتصفح ويمكنك تعديلها أو حذفها في أي وقت.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status / Quick Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3 text-sm font-bold">
              <span className="tabular-nums text-amber-300">
                الأسئلة المكتملة: {questions.length} من 5
              </span>
              {saveNotice && (
                <span className="text-emerald-400 text-xs sm:text-sm font-semibold">
                  · {saveNotice}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>تعبئة نموذج جاهز للتعديل</span>
              </button>
              {questions.length < 5 && editingIndex === null && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة سؤال ({questions.length + 1}/5)</span>
                </button>
              )}
            </div>
          </div>

          {/* Add / Edit Question Form */}
          {editingIndex !== null && (
            <form
              onSubmit={handleSaveForm}
              className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-amber-300">
                  {editingIndex === -1
                    ? `إضافة السؤال رقم ${questions.length + 1}`
                    : `تعديل السؤال رقم ${editingIndex + 1}`}
                </h3>
                {questions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                  >
                    إلغاء
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-200 mb-1.5">
                  نص السؤال
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="مثال: ما عاصمة المملكة العربية السعودية؟ أو ما ناتج 5 × 6؟"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">
                  مقطع كود أو معادلة (اختياري)
                </label>
                <textarea
                  rows={2}
                  dir="ltr"
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="مثال اختياري: print(2 + 3)"
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 text-sm font-mono-code"
                />
              </div>

              <div className="space-y-2.5">
                <label className="block text-sm font-bold text-slate-200">
                  الاختيارات الثلاثة (حددي الإجابة الصحيحة)
                </label>
                {[0, 1, 2].map((idx) => {
                  const val = idx === 0 ? choice0 : idx === 1 ? choice1 : choice2;
                  const setter = idx === 0 ? setChoice0 : idx === 1 ? setChoice1 : setChoice2;
                  const isCorrect = correctIndex === idx;
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setCorrectIndex(idx as ChoiceIndex)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>{isCorrect ? 'صحيحة' : `اختيار ${idx + 1}`}</span>
                      </button>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setter(e.target.value)}
                        placeholder={`اكتبي الاختيار ${idx + 1}...`}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-sm"
                      />
                    </div>
                  );
                })}
              </div>

              {formError && (
                <p className="text-sm font-bold text-rose-400">{formError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingIndex === -1 ? 'إضافة وحفظ السؤال' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Questions List */}
          {questions.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <p className="text-base font-bold">لا توجد أسئلة مضافة بعد.</p>
              <p className="text-sm mt-1">
                أضيفي 5 أسئلة من النموذج أعلاه أو اضغطي على «تعبئة نموذج جاهز للتعديل».
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-extrabold text-amber-400 tabular-nums shrink-0">
                        صندوق {idx + 1} ·
                      </span>
                      <p className="text-base font-bold text-white break-words">
                        {q.text}
                      </p>
                    </div>
                    {q.codeSnippet && (
                      <pre
                        dir="ltr"
                        className="text-xs font-mono-code bg-slate-950 text-emerald-300 px-3 py-2 rounded-lg overflow-x-auto"
                      >
                        {q.codeSnippet}
                      </pre>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm">
                      {q.choices.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          className={
                            q.correctIndex === cIdx
                              ? 'text-emerald-400 font-extrabold'
                              : 'text-slate-400'
                          }
                        >
                          {cIdx + 1}) {c} {q.correctIndex === cIdx ? '✓' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditForm(idx)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 text-xs font-bold border border-rose-800/70 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs sm:text-sm font-semibold text-slate-400">
            {isCompleteSet
              ? 'الأسئلة الخمسة جاهزة! يمكنك بدء المغامرة الآن.'
              : `تبقّى ${5 - questions.length} أسئلة لإكمال مجموعة المغامرة (5 أسئلة مطلوبة).`}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              إغلاق
            </button>
            <button
              type="button"
              disabled={!isCompleteSet}
              onClick={() => onSaveAndPlay(questions)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-sm transition-colors ${
                isCompleteSet
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>حفظ والبدء باللعب</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
