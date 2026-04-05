import type { Questionnaire, ResultBand } from "../types/questionnaire";

export type CalculationResult = {
  total: number;
  average: number | null;
  level?: ResultBand;
};

export function calculateResult(
  answers: Record<string, number>,
  questionnaire: Questionnaire
): CalculationResult {
  const reverseMap = questionnaire.scale.reverseScoring;
  let total = 0;

  for (const question of questionnaire.questions) {
    const raw = answers[question.id] ?? 0;

    const scored = question.reverse
      ? reverseMap[String(raw)]
      : raw;

    total += scored;
  }

  const average =
    questionnaire.scoring.showAverage
      ? Number((total / questionnaire.questions.length).toFixed(2))
      : null;

  let level: ResultBand | undefined = undefined;

  if (
    questionnaire.scoring.interpretationMode === "bands" &&
    questionnaire.resultBands?.length
  ) {
    level = questionnaire.resultBands.find(
      (b) => total >= b.min && total <= b.max
    );
  }

  return {
    total,
    average,
    level,
  };
}