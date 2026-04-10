import type {
    Questionnaire,
    Question,
    ResultBand
}
from "../types/questionnaire";

export type SumCalculationResult = {
    type: "sum";
    total: number;
    average: number | null;
    level ?  : ResultBand;
    percentile ?  : number | null;
    percentileText ?  : string | null;
    subscales ?  : SubscaleCalculationResultItem[];
};

export type SubscaleCalculationResultItem = {
    key: string;
    label: string;
    value: number;
    percentile: number | null;
    percent: number | null;
    min: number;
    max: number;
};

export type SubscalesCalculationResult = {
    type: "subscales";
    subscales: SubscaleCalculationResultItem[];
};

export type CalculationResult =
     | SumCalculationResult
     | SubscalesCalculationResult;

function getPercentileText(percentile: number | null): string | null {
    if (percentile === null)
        return null;

    return `Ваш результат находится на ${percentile}-м перцентиле — выше, чем у ${percentile}% людей в нормативной выборке.`;
}

function parseNormTable(
    table: Record < string, number >  | undefined): Array < {
    score: number;
    percentile: number
}
 > {
    if (!table)
        return [];

    return Object.entries(table)
    .map(([score, percentile]) => ({
            score: Number(score),
            percentile,
        }))
    .filter((item) => Number.isFinite(item.score) && Number.isFinite(item.percentile))
    .sort((a, b) => a.score - b.score);
}

function interpolatePercentile(
    value: number,
    table: Record < string, number >  | undefined): number | null {
    const points = parseNormTable(table);
    if (points.length === 0)
        return null;

    const exact = points.find((p) => p.score === value);
    if (exact)
        return exact.percentile;

    if (value <= points[0].score)
        return points[0].percentile;
    if (value >= points[points.length - 1].score)
        return points[points.length - 1].percentile;

    for (let i = 0; i < points.length - 1; i += 1) {
        const left = points[i];
        const right = points[i + 1];

        if (value > left.score && value < right.score) {
            const ratio = (value - left.score) / (right.score - left.score);
            const interpolated =
                left.percentile + ratio * (right.percentile - left.percentile);

            return Math.round(interpolated);
        }
    }

    return null;
}

function isVisible(
    question: Question,
    answers: Record < string, number > ): boolean {
    if (!question.visibility)
        return true;

    const actual = answers[question.visibility.dependsOn];
    const {
        operator,
        value
    } = question.visibility;

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

function isScorable(question: Question): boolean {
    return question.scorable !== false;
}

function calculateSubscales(
    questionnaire: Questionnaire,
    answers: Record < string, number > ): SubscaleCalculationResultItem[]{
    if (
        questionnaire.scoring.method !== "subscales_sum" &&
        questionnaire.scoring.method !== "sum_with_subscales") {
        return [];
    }

    return questionnaire.scoring.subscales.map((subscale) => {
        let value = 0;

        for (const itemNumber of subscale.items) {
            const question = questionnaire.questions.find(
                    (q) => q.number === itemNumber);

            if (!question)
                continue;
            if (!isVisible(question, answers))
                continue;
            if (!isScorable(question))
                continue;

            const raw = answers[question.id];
            if (typeof raw !== "number")
                continue;

            const reverseMap = questionnaire.scale.reverseScoring ?? {};
            const scored =
                question.reverse === true
                 ? Number(reverseMap[String(raw)] ?? raw)
                 : raw;

            value += scored;
        }

        const percentile =
            questionnaire.norms?.type === "percentiles"
             ? questionnaire.norms.subscales[subscale.key]?.[String(value)] ?? null
             : null;

        const itemCount = subscale.items.length;
        const scaleMin = questionnaire.scale.min ?? 1;
        const scaleMax = questionnaire.scale.max ?? questionnaire.scale.options.length;

        const minValue = itemCount * scaleMin;
        const maxValue = itemCount * scaleMax;

        const percent =
            maxValue > minValue
             ? Math.round(((value - minValue) / (maxValue - minValue)) * 100)
             : null;
        /*
        console.log("subscale result", {
        key: subscale.key,
        value,
        percentile,
        percent,
        });
         */
        return {
            key: subscale.key,
            label: subscale.label,
            value,
            percentile,
            percent,
            min: minValue,
            max: maxValue,
        };
    });
}

export function calculateResult(
    answers: Record < string, number > ,
    questionnaire: Questionnaire): CalculationResult {
    const scoring = questionnaire.scoring;

    if (scoring.method === "sum" || scoring.method === "sum_with_subscales") {
        const reverseMap = questionnaire.scale.reverseScoring ?? {};
        let total = 0;
        let answeredCount = 0;

        for (const question of questionnaire.questions) {
            if (!isVisible(question, answers))
                continue;
            if (!isScorable(question))
                continue;

            const raw = answers[question.id];
            if (typeof raw !== "number")
                continue;

            const scored =
                question.reverse === true
                 ? Number(reverseMap[String(raw)] ?? raw)
                 : raw;

            total += scored;
            answeredCount += 1;
        }

        const average =
            scoring.showAverage && answeredCount > 0
             ? Number((total / answeredCount).toFixed(2))
             : null;

        const percentileValue =
            scoring.percentileBasis === "average"
             ? average
             : total;

        const percentile =
            questionnaire.norms?.type === "percentiles" && percentileValue !== null
             ? interpolatePercentile(
                percentileValue,
                questionnaire.norms.subscales?.["total"])
             : null;

        const percentileText = getPercentileText(percentile);

        let level: ResultBand | undefined = undefined;

        if (
            scoring.interpretationMode === "bands" &&
            questionnaire.resultBands?.length) {
            level = questionnaire.resultBands.find(
                    (band) => total >= band.min && total <= band.max);
        }

        const subscales =
            scoring.method === "sum_with_subscales"
             ? calculateSubscales(questionnaire, answers)
             : undefined;

        console.log("sum result debug", {
            questionnaireId: questionnaire.id,
            method: scoring.method,
            interpretationMode: scoring.interpretationMode,
            total,
            resultBands: questionnaire.resultBands,
            level,
        });

        return {
            type: "sum",
            total,
            average,
            level,
            percentile,
            percentileText,
            subscales,
        };
    }

    if (scoring.method === "subscales_sum") {
        return {
            type: "subscales",
            subscales: calculateSubscales(questionnaire, answers),
        };
    }

    throw new Error(`Unsupported scoring method: ${String((scoring as {
                method ?  : unknown
            }).method)}`);
}
