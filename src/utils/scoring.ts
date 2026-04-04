import type { Questionnaire } from "../types/questionnaire";

export function calculateResult(
  answers: Record<string, number>,
  questionnaire: Questionnaire
) {
  const reverseMap = questionnaire.scale.reverseScoring;
  let total = 0;

  for (const question of questionnaire.questions) {
    const raw = answers[question.id] ?? 0;

    const scored = question.reverse
      ? reverseMap[String(raw)]
      : raw;

    total += scored;
  }

  const level = questionnaire.resultBands.find(
    (b) => total >= b.min && total <= b.max
  );

  return {
    total,
    level
  };
}
