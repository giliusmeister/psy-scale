import type { Questionnaire } from "../types/questionnaire";
import type { ResultBand } from "../types/questionnaire";

type DebugRow = {
  questionNumber: number;
  questionId: string;
  questionText: string;
  reverse: boolean;
  rawAnswer: number;
  scoredAnswer: number;
};

type BuildDebugResultParams = {
  questionnaire: Questionnaire;
  answers: Record<string, number>;
  total: number;
  level?: ResultBand;
};

function formatDateParts(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");

  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());

  return {
    isoDate: `${yyyy}-${mm}-${dd}`,
    isoDateTime: `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`,
  };
}

function sanitizeFilePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-zа-я0-9_-]/gi, "");
}

export function buildDebugResult({
  questionnaire,
  answers,
  total,
  level,
}: BuildDebugResultParams) {
  const reverseMap = questionnaire.scale.reverseScoring;

  const rows: DebugRow[] = questionnaire.questions.map((question) => {
    const rawAnswer = Number(answers[question.id] ?? 0);
    const scoredAnswer = question.reverse
      ? Number(reverseMap[String(rawAnswer)])
      : rawAnswer;

    return {
      questionNumber: question.number,
      questionId: question.id,
      questionText: question.text,
      reverse: question.reverse,
      rawAnswer,
      scoredAnswer,
    };
  });

  const directRows = rows.filter((row) => !row.reverse);
  const reverseRows = rows.filter((row) => row.reverse);

  const directSum = directRows.reduce((sum, row) => sum + row.scoredAnswer, 0);
  const reverseSum = reverseRows.reduce((sum, row) => sum + row.scoredAnswer, 0);

  const now = new Date();
  const { isoDate, isoDateTime } = formatDateParts(now);

  return {
    meta: {
      questionnaireId: questionnaire.id,
      questionnaireTitle: questionnaire.title,
      anonymous: true,
      calculatedAt: now.toISOString(),
      calculatedAtLocal: isoDateTime,
    },
    summary: {
      questionsCount: questionnaire.questions.length,
      directSum,
      reverseSum,
      total,
      level: level?.label ?? null,
    },
    rows,
    answers,
    exportedOn: isoDate,
  };
}

export function downloadDebugResult(params: BuildDebugResultParams) {
  const debugData = buildDebugResult(params);

  const now = new Date();
  const { isoDateTime } = formatDateParts(now);

  const questionnaireName = sanitizeFilePart(params.questionnaire.id);
  const fileName = `${questionnaireName}_anonymous_${isoDateTime}.json`;

  const blob = new Blob([JSON.stringify(debugData, null, 2)], {
    type: "application/json;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}