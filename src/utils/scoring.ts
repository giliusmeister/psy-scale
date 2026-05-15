import type {
    DomainDefinition,
    FlagRule,
    Questionnaire,
    Question,
    ResultBand,
    SubscaleDerivedMetricBand,
    SubscaleDerivedMetricConfig,
    SubscaleDerivedMetricDefinition,
    SubscaleDerivedMetrics
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
    domains ?  : DomainCalculationResultItem[];
};

export type SubscaleCalculationResultItem = {
    key: string;
    label: string;
    value: number;
    percentile: number | null;
    percent: number | null;
    min: number;
    max: number;
    aggregation?: "sum" | "mean";
    derivedMetrics?: SubscaleDerivedMetricResultItem[];
    flags?: AppliedFlagItem[];
};

export type SubscaleDerivedMetricResultItem = {
    key: string;
    label: string;
    value: number;
    isPercent: boolean;
    flagged: boolean;
    bandLabel: string | null;
};

export type SubscalesCalculationResult = {
    type: "subscales";
    subscales: SubscaleCalculationResultItem[];
    domains ?  : DomainCalculationResultItem[];
};

export type DomainCalculationResultItem = {
    key: string;
    label: string;
    value: number;
    averagePercent: number;
    subscaleCount: number;
    aggregation: "sum" | "mean";
    flags?: AppliedFlagItem[];
};

export type AppliedFlagItem = {
    id: string;
    severity: "info" | "elevated" | "high" | "critical";
    title: string;
    message?: string;
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

function compareByOperator(left: number, operator: FlagRule["operator"], right: number): boolean {
    switch (operator) {
    case ">":
        return left > right;
    case ">=":
        return left >= right;
    case "<":
        return left < right;
    case "<=":
        return left <= right;
    case "==":
        return left === right;
    case "!=":
        return left !== right;
    default:
        return false;
    }
}

function evaluateFlags(
    flags: FlagRule[] | undefined,
    scope: "subscale" | "domain",
    metricValues: Record<string, number>): AppliedFlagItem[] | undefined {
    if (!Array.isArray(flags) || flags.length === 0)
        return undefined;

    const matched = flags
        .filter((flag) => flag.scope === scope)
        .filter((flag) => {
            const metricValue = metricValues[flag.metric];
            return Number.isFinite(metricValue) && compareByOperator(metricValue, flag.operator, flag.value);
        });

    const severityRank: Record<string, number> = {
        info: 0,
        elevated: 1,
        high: 2,
        critical: 3,
    };

    const bestByMetric = new Map<string, FlagRule>();
    for (const flag of matched) {
        const current = bestByMetric.get(flag.metric);
        if (!current) {
            bestByMetric.set(flag.metric, flag);
            continue;
        }

        const currentRank = severityRank[current.severity ?? "info"] ?? 0;
        const nextRank = severityRank[flag.severity ?? "info"] ?? 0;
        if (nextRank > currentRank) {
            bestByMetric.set(flag.metric, flag);
            continue;
        }

        if (nextRank === currentRank && flag.value > current.value) {
            bestByMetric.set(flag.metric, flag);
        }
    }

    const reduced = Array.from(bestByMetric.values()).map((flag) => ({
            id: flag.id,
            severity: flag.severity ?? "info",
            title: flag.title,
            message: flag.message,
        }));

    return reduced.length > 0 ? reduced : undefined;
}

function roundWithPrecision(value: number, precision: number | undefined): number {
    if (typeof precision !== "number" || !Number.isFinite(precision) || precision < 0)
        return value;

    return Number(value.toFixed(precision));
}

function evaluateFormula(
    formula: string | undefined,
    context: Record<string, number>): number | null {
    if (!formula || formula.trim().length === 0)
        return null;

    const tokens = formula.match(/[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[()+\-*/]/g);
    if (!tokens || tokens.length === 0)
        return null;

    const output: Array<number | string> = [];
    const operators: string[] = [];
    const precedence: Record<string, number> = {
        "u-": 3,
        "*": 2,
        "/": 2,
        "+": 1,
        "-": 1,
    };
    const rightAssociative = new Set(["u-"]);

    let prevTokenType: "start" | "value" | "operator" | "openParen" | "closeParen" = "start";

    for (const token of tokens) {
        if (/^\d/.test(token)) {
            output.push(Number(token));
            prevTokenType = "value";
            continue;
        }

        if (/^[A-Za-z_]/.test(token)) {
            output.push(Number.isFinite(context[token]) ? context[token] : 0);
            prevTokenType = "value";
            continue;
        }

        if (token === "(") {
            operators.push(token);
            prevTokenType = "openParen";
            continue;
        }

        if (token === ")") {
            while (operators.length > 0 && operators[operators.length - 1] !== "(")
                output.push(operators.pop() as string);

            if (operators.length === 0 || operators[operators.length - 1] !== "(")
                return null;

            operators.pop();
            prevTokenType = "closeParen";
            continue;
        }

        if (!["+", "-", "*", "/"].includes(token))
            return null;

        const operatorToken =
            token === "-" &&
            (prevTokenType === "start" || prevTokenType === "operator" || prevTokenType === "openParen")
                ? "u-"
                : token;

        while (operators.length > 0) {
            const top = operators[operators.length - 1];
            if (top === "(")
                break;

            const pTop = precedence[top];
            const pCur = precedence[operatorToken];
            const shouldPop = rightAssociative.has(operatorToken) ? pTop > pCur : pTop >= pCur;
            if (!shouldPop)
                break;

            output.push(operators.pop() as string);
        }

        operators.push(operatorToken);
        prevTokenType = "operator";
    }

    while (operators.length > 0) {
        const op = operators.pop() as string;
        if (op === "(" || op === ")")
            return null;
        output.push(op);
    }

    const stack: number[] = [];
    for (const item of output) {
        if (typeof item === "number") {
            stack.push(item);
            continue;
        }

        if (item === "u-") {
            const operand = stack.pop();
            if (operand === undefined)
                return null;
            stack.push(-operand);
            continue;
        }

        const right = stack.pop();
        const left = stack.pop();
        if (left === undefined || right === undefined)
            return null;

        if (item === "+")
            stack.push(left + right);
        else if (item === "-")
            stack.push(left - right);
        else if (item === "*")
            stack.push(left * right);
        else if (item === "/")
            stack.push(right === 0 ? 0 : left / right);
        else
            return null;
    }

    if (stack.length !== 1 || !Number.isFinite(stack[0]))
        return null;

    return stack[0];
}

function resolveBandLabel(
    bands: SubscaleDerivedMetricBand[] | undefined,
    value: number): string | null {
    if (!Array.isArray(bands) || bands.length === 0)
        return null;

    const matched = bands.find((band) => value >= band.min && value <= band.max);
    return matched?.label ?? null;
}

function calculateDerivedMetric(
    metric: SubscaleDerivedMetricDefinition,
    scoredSum: number,
    answeredCount: number,
    scoredAnswers: number[]): SubscaleDerivedMetricResultItem | null {
    const threshold = metric.threshold ?? 5;
    const strongAnswers = scoredAnswers.filter((answer) => answer >= threshold);

    let rawValue: number;
    let isPercent = false;

    if (metric.type === "normalized_percent") {
        const min = metric.min ?? answeredCount;
        const max = metric.max ?? answeredCount * 6;
        const denominator = max - min;
        rawValue = denominator > 0 ? ((scoredSum - min) / denominator) * 100 : 0;
        isPercent = true;
    } else if (metric.type === "strong_answer_sum") {
        rawValue = strongAnswers.reduce((sum, value) => sum + value, 0);
    } else if (metric.type === "strong_answer_share") {
        rawValue = answeredCount > 0 ? (strongAnswers.length / answeredCount) * 100 : 0;
        isPercent = true;
    } else {
        return null;
    }

    const value = roundWithPrecision(rawValue, metric.precision);
    const flagged =
        typeof metric.flagThreshold === "number" && Number.isFinite(metric.flagThreshold)
            ? value >= metric.flagThreshold
            : false;

    return {
        key: metric.key,
        label: metric.label,
        value,
        isPercent,
        flagged,
        bandLabel: resolveBandLabel(metric.bands, value),
    };
}

function metricLabelByKey(
    key: string,
    language: string): string {
    const isRu = language.toLowerCase().startsWith("ru");

    if (key === "percentIntensity")
        return isRu ? "??1 ??? ???????????????????????? ??????????" : "??1 - schema intensity";
    if (key === "highResponsesSum")
        return isRu ? "??2 ??? ?????????? ?????????????? ??????????????" : "??2 - strong response sum";
    if (key === "highResponsesPercent")
        return isRu ? "??3 ??? ???????? ?????????????? ??????????????" : "??3 - strong response share";
    return key;
}

function calculateSubscaleMetricFromConfig(
    key: string,
    config: SubscaleDerivedMetricConfig,
    questionnaireLanguage: string,
    sumValue: number,
    answeredCount: number,
    itemCount: number,
    scoredAnswers: number[],
    sumMin: number,
    sumMax: number,
    resolvedSourceValue: number | null): SubscaleDerivedMetricResultItem {
    const metricLabel = config.label ?? metricLabelByKey(key, questionnaireLanguage);
    const threshold = config.threshold ?? 5;
    const countValues = config.countValues ?? [5, 6];
    const matchingAnswers = scoredAnswers.filter((value) => countValues.includes(value));
    const type = config.type;
    const formulaValue = evaluateFormula(config.formula, {
        sum: sumValue,
        count: matchingAnswers.length,
        itemsCount: itemCount,
        answeredCount,
        min: config.min ?? sumMin,
        max: config.max ?? sumMax,
    });
    let rawValue = 0;
    let isPercent = false;

    if (formulaValue !== null) {
        rawValue = formulaValue;
        isPercent = type === "percentage";
    } else if (type === "sum") {
        rawValue = sumValue;
    } else if (type === "mean") {
        rawValue = answeredCount > 0 ? sumValue / answeredCount : 0;
    } else if (type === "count") {
        rawValue = matchingAnswers.length;
    } else if (type === "bands") {
        rawValue = resolvedSourceValue ?? 0;
    } else if (type === "percentage" && config.countValues) {
        rawValue = answeredCount > 0 ? (matchingAnswers.length / answeredCount) * 100 : 0;
        isPercent = true;
    } else if (type === "percentage") {
        const min = config.min ?? sumMin;
        const max = config.max ?? sumMax;
        rawValue = max > min ? ((sumValue - min) / (max - min)) * 100 : 0;
        isPercent = true;
    } else {
        rawValue = matchingAnswers.reduce((acc, value) => acc + value, 0);
    }

    const value = roundWithPrecision(rawValue, config.precision);
    const flagged =
        typeof config.flagThreshold === "number" && Number.isFinite(config.flagThreshold)
            ? value >= config.flagThreshold
            : false;

    return {
        key,
        label: metricLabel,
        value,
        isPercent,
        flagged,
        bandLabel: resolveBandLabel(config.bands, value),
    };
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
        let sumValue = 0;
        let answeredCount = 0;
        const scoredAnswers: number[] = [];

        const reverseMap = questionnaire.scale?.reverseScoring ?? {};

        const subscaleQuestions = subscale.items
            .map((itemNumber) =>
                questionnaire.questions.find((q) => q.number === itemNumber))
            .filter((q): q is Question => Boolean(q));

        for (const question of subscaleQuestions) {
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

            sumValue += scored;
            answeredCount += 1;
            scoredAnswers.push(scored);
        }

        const aggregation = subscale.aggregation ?? "sum";

        const value =
            aggregation === "mean"
             ? answeredCount > 0
             ? Number((sumValue / answeredCount).toFixed(2))
             : 0
             : sumValue;

        const percentile =
            questionnaire.norms?.type === "percentiles"
             ? questionnaire.norms.subscales?.[subscale.key]?.[String(value)] ?? null
             : null;

        const fallbackScaleMin = questionnaire.scale?.min ?? 1;
        const fallbackOptionCount = questionnaire.scale?.options?.length;
        const fallbackScaleMax =
            questionnaire.scale?.max ??
            (typeof fallbackOptionCount === "number" && fallbackOptionCount > 0
                 ? fallbackScaleMin + fallbackOptionCount - 1
                 : 5);

        const perQuestionRanges = subscaleQuestions.map((question) => {
            const optionValues = question.options
                ?.map((opt) => opt.value)
                .filter((v): v is number => typeof v === "number");

            if (optionValues && optionValues.length > 0) {
                return {
                    min: Math.min(...optionValues),
                    max: Math.max(...optionValues),
                };
            }

            return {
                min: fallbackScaleMin,
                max: fallbackScaleMax,
            };
        });

        const sumMin = perQuestionRanges.reduce((acc, r) => acc + r.min, 0);
        const sumMax = perQuestionRanges.reduce((acc, r) => acc + r.max, 0);

        const meanMin =
            perQuestionRanges.length > 0
             ? Number(
                (
                    perQuestionRanges.reduce((acc, r) => acc + r.min, 0) /
                    perQuestionRanges.length).toFixed(2))
             : fallbackScaleMin;

        const meanMax =
            perQuestionRanges.length > 0
             ? Number(
                (
                    perQuestionRanges.reduce((acc, r) => acc + r.max, 0) /
                    perQuestionRanges.length).toFixed(2))
             : fallbackScaleMax;

        const minValue = aggregation === "mean" ? meanMin : sumMin;
        const maxValue = aggregation === "mean" ? meanMax : sumMax;

        const percent =
            Number.isFinite(minValue) &&
            Number.isFinite(maxValue) &&
            maxValue > minValue
             ? Math.round(((value - minValue) / (maxValue - minValue)) * 100)
             : null;

        const scopedDerivedMetrics: SubscaleDerivedMetrics | undefined = subscale.derivedMetrics;

        const configuredDerivedMetrics = scopedDerivedMetrics
            ? Object.entries(scopedDerivedMetrics).reduce<SubscaleDerivedMetricResultItem[]>(
                (acc, [metricKey, metricConfig]) => {
                    const sourceValue =
                        metricConfig.source
                            ? acc.find((metric) => metric.key === metricConfig.source)?.value ?? null
                            : null;

                    const metric = calculateSubscaleMetricFromConfig(
                        metricKey,
                        metricConfig,
                        questionnaire.language,
                        sumValue,
                        answeredCount,
                        subscale.items.length,
                        scoredAnswers,
                        sumMin,
                        sumMax,
                        sourceValue);

                    acc.push(metric);
                    return acc;
                },
                [])
            : [];

        const legacyDerivedMetrics =
            questionnaire.scoring.method === "subscales_sum" ||
            questionnaire.scoring.method === "sum_with_subscales"
                ? questionnaire.scoring.subscaleDerivedMetrics
                    ?.map((metric) =>
                        calculateDerivedMetric(metric, sumValue, answeredCount, scoredAnswers))
                    .filter((metric): metric is SubscaleDerivedMetricResultItem => metric !== null)
                : undefined;

        const derivedMetrics =
            configuredDerivedMetrics.length > 0
                ? configuredDerivedMetrics
                : legacyDerivedMetrics;

        const metricValues: Record<string, number> = {
            rawSum: sumValue,
            averageScore: answeredCount > 0 ? Number((sumValue / answeredCount).toFixed(2)) : 0,
            percentIntensity: percent ?? 0,
            subscalePercent: percent ?? 0,
        };

        for (const metric of derivedMetrics ?? []) {
            metricValues[metric.key] = metric.value;
        }

        return {
            key: subscale.key,
            label: subscale.label,
            value,
            percentile,
            percent,
            min: minValue,
            max: maxValue,
            derivedMetrics,
            flags: evaluateFlags(questionnaire.flags, "subscale", metricValues),
        };
    });
}

function calculateDomains(
    questionnaire: Questionnaire,
    subscales: SubscaleCalculationResultItem[]): DomainCalculationResultItem[] | undefined {
    if (
        questionnaire.scoring.method !== "subscales_sum" &&
        questionnaire.scoring.method !== "sum_with_subscales")
        return undefined;

    const domains: DomainDefinition[] | undefined = questionnaire.domains;
    if (!domains || domains.length === 0)
        return undefined;

    return domains.map((domain) => {
        const aggregation = domain.aggregation ?? "sum";
        const matched = domain.subscales
            .map((subscaleKey) => subscales.find((subscale) => subscale.key === subscaleKey))
            .filter((subscale): subscale is SubscaleCalculationResultItem => Boolean(subscale));

        const total = matched.reduce((sum, subscale) => sum + subscale.value, 0);
        const value =
            aggregation === "mean" && matched.length > 0
                ? Number((total / matched.length).toFixed(2))
                : total;

        const domainAveragePercent =
            matched.length > 0
                ? Number(
                    (
                        matched.reduce((sum, subscale) => sum + (subscale.percent ?? 0), 0) /
                        matched.length).toFixed(2))
                : 0;

        const flags = evaluateFlags(questionnaire.flags, "domain", {
            value,
            averagePercent: domainAveragePercent,
            domainPercent: domainAveragePercent,
        });

        return {
            key: domain.key,
            label: domain.label,
            value,
            averagePercent: domainAveragePercent,
            subscaleCount: matched.length,
            aggregation,
            flags,
        };
    });
}

export function calculateResult(
    answers: Record < string, number > ,
    questionnaire: Questionnaire): CalculationResult {
    const scoring = questionnaire.scoring;

    if (scoring.method === "sum" || scoring.method === "sum_with_subscales") {
        const reverseMap = questionnaire.scale?.reverseScoring ?? {};
        let total = 0;
        let answeredCount = 0;

        const scoredQuestions = questionnaire.questions.filter(
                (question) => isVisible(question, answers) && isScorable(question));

        for (const question of scoredQuestions) {
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

        const interpretationValue =
            scoring.interpretationBasis === "average" && average !== null
             ? average
             : total;

        let level: ResultBand | undefined = undefined;

        if (
            scoring.interpretationMode === "bands" &&
            questionnaire.resultBands?.length) {
            level = questionnaire.resultBands.find(
                    (band) =>
                    interpretationValue >= band.min &&
                    interpretationValue <= band.max);
        }

        const subscales =
            scoring.method === "sum_with_subscales"
             ? calculateSubscales(questionnaire, answers)
             : undefined;
        const domains = subscales ? calculateDomains(questionnaire, subscales) : undefined;

        console.log("sum result debug", {
            questionnaireId: questionnaire.id,
            method: scoring.method,
            interpretationMode: scoring.interpretationMode,
            interpretationBasis: scoring.interpretationBasis ?? "total",
            total,
            average,
            interpretationValue,
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
            domains,
        };
    }

    if (scoring.method === "subscales_sum") {
        const subscales = calculateSubscales(questionnaire, answers);
        const domains = calculateDomains(questionnaire, subscales);
        return {
            type: "subscales",
            subscales,
            domains,
        };
    }

    throw new Error(
`Unsupported scoring method: ${String(
            (scoring as {
                method ?  : unknown
            }).method)}`);
}
