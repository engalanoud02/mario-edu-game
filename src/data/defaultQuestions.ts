import { Question } from '../types/game';

export const DEFAULT_PYTHON_QUESTIONS: Question[] = [
  {
    id: 'py-1',
    text: 'ما وظيفة الدالة print() في لغة بايثون (Python)؟',
    codeSnippet: 'print("أهلاً بكم في المغامرة!")',
    choices: [
      'طباعة النصوص أو القيم على الشاشة',
      'حذف متغير من الذاكرة',
      'إغلاق البرنامج فورًا',
    ],
    correctIndex: 0,
  },
  {
    id: 'py-2',
    text: 'ما ناتج تنفيذ الكود التالي في بايثون؟',
    codeSnippet: 'x = 5\ny = 3\nprint(x + y)',
    choices: ['53', '8', '2'],
    correctIndex: 1,
  },
  {
    id: 'py-3',
    text: 'ما نوع البيانات للقيمة "Python" عند كتابتها بين علامتي تنصيص؟',
    codeSnippet: 'name = "Python"',
    choices: [
      'عدد صحيح (int)',
      'قيمة منطقية (bool)',
      'نص (str)',
    ],
    correctIndex: 2,
  },
  {
    id: 'py-4',
    text: 'ما الناتج الذي ستطبعه دالة len() للقائمة التالية؟',
    codeSnippet: 'scores = [10, 20, 30, 40]\nprint(len(scores))',
    choices: ['4', '100', '40'],
    correctIndex: 0,
  },
  {
    id: 'py-5',
    text: 'أي عبارة شرطية مكتوبة بالصيغة الصحيحة في لغة بايثون؟',
    choices: [
      'if x > 10 then:',
      'if x > 10:',
      'if (x > 10) {',
    ],
    correctIndex: 1,
  },
];

const CUSTOM_QUESTIONS_KEY = 'hero_edu_custom_questions_v1';
const QUESTION_MODE_KEY = 'hero_edu_question_mode_v1';

export function loadCustomQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Question =>
          item &&
          typeof item.id === 'string' &&
          typeof item.text === 'string' &&
          Array.isArray(item.choices) &&
          item.choices.length === 3 &&
          (item.correctIndex === 0 || item.correctIndex === 1 || item.correctIndex === 2)
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}

export function saveCustomQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions.slice(0, 5)));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadSavedMode(): 'python' | 'custom' {
  try {
    const raw = localStorage.getItem(QUESTION_MODE_KEY);
    return raw === 'custom' ? 'custom' : 'python';
  } catch {
    return 'python';
  }
}

export function saveQuestionMode(mode: 'python' | 'custom'): void {
  try {
    localStorage.setItem(QUESTION_MODE_KEY, mode);
  } catch {
    // Ignore
  }
}
