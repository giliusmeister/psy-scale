import type { Questionnaire } from "./types/questionnaire";

export type AppLanguage = "ru" | "en";

export const LANGUAGE_STORAGE_KEY = "psy-scale-ui-language";
export const APP_LANGUAGES: AppLanguage[] = ["ru", "en"];

export const UI_COPY = {
  ru: {
    chooseQuestionnaire: "Выберите опросник из списка:",
    emptyState: "Не найдено ни одного валидного опросника. Проверьте JSON и консоль.",
    author: "Автор",
    questions: "Вопросов",
    minutesShort: "мин",
    secondsShort: "сек",
    result: "Результат",
    startedAt: "Начало",
    finishedAt: "Завершение",
    duration: "Время прохождения",
    averageScore: "Средний балл",
    points: "баллов",
    averageInterpretation: "Интерпретация основана на среднем балле.",
    samplePosition: "Позиция в выборке",
    noFixedBands: "Интерпретация по фиксированным диапазонам для этой методики не задана.",
    subscales: "Подшкалы",
    outOf: "из",
    percentile: "перцентиль",
    downloadJson: "Скачать JSON",
    backToList: "К списку",
    restart: "Пройти заново",
    answerOptions: "Варианты ответа",
    question: "Вопрос",
    of: "из",
    back: "Назад",
    finish: "Завершить",
    next: "Далее",
    language: "Язык",
    languageNames: {
      ru: "Русский",
      en: "English",
    },
    categories: {
      anxiety: "Тревожность",
      clinical: "Клинические",
      cognitive: "Когнитивные",
      depression: "Депрессия",
      gender: "Гендерная идентичность",
      mental_health: "Психическое здоровье",
      mindfulness: "Осознанность",
      other: "Прочее",
      personality: "Личностные",
      procrastination: "Прокрастинация",
      screening: "Скрининговые",
      sensitivity: "Чувствительность",
      "psychological defense": "Психологическая защита",
    },
  },
  en: {
    chooseQuestionnaire: "Choose a questionnaire from the list:",
    emptyState: "No valid questionnaires found. Check JSON files and the console.",
    author: "Author",
    questions: "Questions",
    minutesShort: "min",
    secondsShort: "sec",
    result: "Result",
    startedAt: "Started",
    finishedAt: "Finished",
    duration: "Completion time",
    averageScore: "Average score",
    points: "points",
    averageInterpretation: "Interpretation is based on the average score.",
    samplePosition: "Sample position",
    noFixedBands: "Fixed-range interpretation is not configured for this questionnaire.",
    subscales: "Subscales",
    outOf: "of",
    percentile: "percentile",
    downloadJson: "Download JSON",
    backToList: "Back to list",
    restart: "Restart",
    answerOptions: "Answer options",
    question: "Question",
    of: "of",
    back: "Back",
    finish: "Finish",
    next: "Next",
    language: "Language",
    languageNames: {
      ru: "Русский",
      en: "English",
    },
    categories: {
      anxiety: "Anxiety",
      clinical: "Clinical",
      cognitive: "Cognitive",
      depression: "Depression",
      gender: "Gender identity",
      mental_health: "Mental health",
      mindfulness: "Mindfulness",
      other: "Other",
      personality: "Personality",
      procrastination: "Procrastination",
      screening: "Screening",
      sensitivity: "Sensitivity",
      "psychological defense": "Psychological defense",
    },
  },
} as const;

export type UiCopy = (typeof UI_COPY)[AppLanguage];

export function isAppLanguage(language: string): language is AppLanguage {
  return APP_LANGUAGES.includes(language as AppLanguage);
}

export function getInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (savedLanguage && isAppLanguage(savedLanguage)) {
    return savedLanguage;
  }

  return window.navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function getQuestionnaireLanguage(questionnaire: Questionnaire): AppLanguage | null {
  const language = questionnaire.language.toLowerCase();
  if (isAppLanguage(language)) {
    return language;
  }

  const idLanguage = questionnaire.id.split("_").pop();
  return idLanguage && isAppLanguage(idLanguage) ? idLanguage : null;
}

export function getCategoryLabel(copy: UiCopy, category: string): string {
  const categoryKey = category.trim().toLowerCase() as keyof UiCopy["categories"];
  return copy.categories[categoryKey] ?? category;
}
