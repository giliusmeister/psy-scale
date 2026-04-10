import type {
    Questionnaire
}
from "../types/questionnaire";
import type {
    CalculationResult
}
from "./scoring";

export function buildDebugResult(
    questionnaire: Questionnaire,
    answers: Record < string, number > ,
    result: CalculationResult,
    startedAt: number | null,
    finishedAt: number | null) {
    const timestamp = new Date().toISOString();

    const base = {
        questionnaireId: questionnaire.id,
        title: questionnaire.title,
        timestamp,
        startedAt,
        finishedAt,
        durationMs:
        startedAt && finishedAt ? finishedAt - startedAt : null,
        answers
    };

    // ===== SUM (Лэй, Такман) =====
    if (result.type === "sum") {
        return {
            ...base,
            result: {
                type: "sum",
                total: result.total,
                average: result.average,
                percentile:
                result.percentile !== undefined ? result.percentile : null,
                percentileText:
                result.percentileText !== undefined ? result.percentileText : null,
                level: result.level
                 ? {
                    label: result.level.label,
                    min: result.level.min,
                    max: result.level.max,
                }
                 : null,
                subscales:
                result.subscales?.map((s) => ({
                        key: s.key,
                        label: s.label,
                        value: s.value,
                        percent: s.percent ?? null,
                        percentile: s.percentile ?? null,
                        min: s.min ?? null,
                        max: s.max ?? null,
                    })) ?? [],
            },
        };
    }

    // ===== SUBSCALES (Плутчик) =====
    if (result.type === "subscales") {
        return {
            ...base,
            result: {
                type: "subscales",
                subscales: result.subscales.map((s) => ({
                        key: s.key,
                        label: s.label,
                        value: s.value,
                        percent: s.percent ?? null,
                        percentile: s.percentile ?? null,
                        min: s.min ?? null,
                        max: s.max ?? null,
                    })),
            },
        };
    }

    // ===== FALLBACK =====
    return {
        ...base,
        result: {
            type: "unknown",
        },
    };
}

// ===== Утилита для скачивания =====

export function downloadDebugJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}

export function downloadDebugResult(
    questionnaire: Questionnaire,
    answers: Record < string, number > ,
    result: CalculationResult,
    startedAt: number | null,
    finishedAt: number | null) {
    const debugData = buildDebugResult(
            questionnaire,
            answers,
            result,
            startedAt,
            finishedAt);

    const filename = `${questionnaire.id}_${Date.now()}.json`;

    const blob = new Blob([JSON.stringify(debugData, null, 2)], {
        type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}
