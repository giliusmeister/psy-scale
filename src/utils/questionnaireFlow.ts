import type { Question, ScaleOption } from "../types/questionnaire";

export type AnswerOptionEntry = ScaleOption & {
  index: number;
  key: string;
};

export function isQuestionVisible(
  question: Question,
  answers: Record<string, number>,
): boolean {
  if (!question.visibility) {
    return true;
  }

  if (!(question.visibility.dependsOn in answers)) {
    return false;
  }

  const actual = answers[question.visibility.dependsOn];
  const { operator, value } = question.visibility;

  switch (operator) {
    case "equals":
      return actual === value;
    case "notEquals":
      return actual !== value;
    case "in":
      return Array.isArray(value) && value.includes(actual);
    case "notIn":
      return Array.isArray(value) && !value.includes(actual);
    case "greaterThan":
      return typeof actual === "number" && typeof value === "number" && actual > value;
    case "greaterThanOrEqual":
      return typeof actual === "number" && typeof value === "number" && actual >= value;
    case "lessThan":
      return typeof actual === "number" && typeof value === "number" && actual < value;
    case "lessThanOrEqual":
      return typeof actual === "number" && typeof value === "number" && actual <= value;
    default:
      return true;
  }
}

export function pruneHiddenAnswers(
  questions: Question[],
  answers: Record<string, number>,
): Record<string, number> {
  const next = { ...answers };

  for (const question of questions) {
    if (!isQuestionVisible(question, next)) {
      delete next[question.id];
    }
  }

  return next;
}

export function pruneHiddenOptionKeys(
  questions: Question[],
  optionKeys: Record<string, string>,
  answers: Record<string, number>,
): Record<string, string> {
  const next = { ...optionKeys };

  for (const question of questions) {
    if (!isQuestionVisible(question, answers)) {
      delete next[question.id];
    }
  }

  return next;
}

export function hasDuplicateOptionValues(options: ScaleOption[]): boolean {
  const seen = new Set<number>();

  for (const option of options) {
    if (seen.has(option.value)) {
      return true;
    }

    seen.add(option.value);
  }

  return false;
}

export function buildOptionKey(questionId: string, index: number): string {
  return `${questionId}::${index}`;
}
