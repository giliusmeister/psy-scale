import type { Questionnaire, ResultBand } from "../types/questionnaire";

export type SumCalculationResult = {
  type: "sum";
  total: number;
  average: number | null;
  level?: ResultBand;
};

export type SubscaleCalculationResultItem = {
  key: string;
  label: string;
  value: number;
  percentile: number | null;
};

export type SubscalesCalculationResult = {
  type: "subscales";
  subscales: SubscaleCalculationResultItem[];
};

export type CalculationResult =
  | SumCalculationResult
  | SubscalesCalculationResult;

export function calculateResult(
  answers: Record<string, number>,
  questionnaire: Questionnaire
): CalculationResult {
  const scoring = questionnaire.scoring;

  // ===== 1. Обычная сумма =====
  if (scoring.method === "sum") {
    const reverseMap = questionnaire.scale.reverseScoring ?? {};
    let total = 0;

    for (const question of questionnaire.questions) {
      const raw = answers[question.id] ?? 0;

      const scored =
        question.reverse === true
          ? Number(reverseMap[String(raw)] ?? raw)
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
        (band) => total >= band.min && total <= band.max
      );
    }

    return {
      type: "sum",
      total,
      average,
      level,
    };
  }

  // ===== 2. Подсчет по субшкалам =====
  if (scoring.method === "subscales_sum") {
    const subscales = scoring.subscales.map((subscale) => {
      let value = 0;

      for (const itemNumber of subscale.items) {
        const question = questionnaire.questions.find(
          (q) => q.number === itemNumber
        );

        if (!question) continue;

        value += answers[question.id] ?? 0;
      }

      const percentile =
        questionnaire.norms?.type === "percentiles"
          ? questionnaire.norms.subscales[subscale.key]?.[String(value)] ?? null
          : null;

      return {
        key: subscale.key,
        label: subscale.label,
        value,
        percentile,
      };
    });

    return {
      type: "subscales",
      subscales,
    };
  }

  throw new Error("Unsupported scoring method");
}