import type { Questionnaire, ResultBand } from "../types/questionnaire";

export type CalculationResult =
  | {
      type: "sum";
      total: number;
      average: number | null;
      level?: ResultBand;
    }
  | {
      type: "subscales";
      subscales: {
        key: string;
        label: string;
        value: number;
      }[];
    };

export function calculateResult(
  answers: Record<string, number>,
  questionnaire: Questionnaire
): CalculationResult {
  const scoring = questionnaire.scoring;

  // ===== SUM (старые тесты) =====
  if (scoring.method === "sum") {
    const reverseMap = questionnaire.scale.reverseScoring || {};
    let total = 0;

    for (const question of questionnaire.questions) {
      const raw = answers[question.id] ?? 0;

      const scored = question.reverse
        ? reverseMap[String(raw)]
        : raw;

      total += scored;
    }

    const average = scoring.showAverage
      ? Number((total / questionnaire.questions.length).toFixed(2))
      : null;

    let level: ResultBand | undefined = undefined;

    if (
      scoring.interpretationMode === "bands" &&
      questionnaire.resultBands?.length
    ) {
      level = questionnaire.resultBands.find(
        (b) => total >= b.min && total <= b.max
      );
    }

    return {
      type: "sum",
      total,
      average,
      level,
    };
  }

  // ===== SUBSCALES (Плутчик) =====
  if (scoring.method === "subscales_sum") {
    const subscales = scoring.subscales.map((sub) => {
      let sum = 0;

      for (const num of sub.items) {
        const q = questionnaire.questions.find(
          (qq) => qq.number === num
        );

        if (!q) continue;

        const value = answers[q.id] ?? 0;
        sum += value;
      }

      return {
        key: sub.key,
        label: sub.label,
        value: sum,
      };
    });

    return {
      type: "subscales",
      subscales,
    };
  }

  throw new Error("Unknown scoring method");
}