import type { Questionnaire } from "../types/questionnaire";

type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function validateQuestionnaire(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isObject(data)) {
    return {
      valid: false,
      errors: ["Корневой объект должен быть объектом."],
    };
  }

  if (!isNonEmptyString(data.title)) {
    errors.push("Поле title обязательно и должно быть непустой строкой.");
  }

  if (!isNonEmptyString(data.description)) {
    errors.push("Поле description обязательно и должно быть непустой строкой.");
  }

  if (data.author !== undefined && !isNonEmptyString(data.author)) {
    errors.push("Поле author должно быть непустой строкой, если указано.");
  }

  if (data.category !== undefined && !isNonEmptyString(data.category)) {
    errors.push("Поле category должно быть непустой строкой, если указано.");
  }

  if (
    data.estimatedMinutes !== undefined &&
    (!isNumber(data.estimatedMinutes) || data.estimatedMinutes <= 0)
  ) {
    errors.push("Поле estimatedMinutes должно быть положительным числом, если указано.");
  }

  if (data.instructions !== undefined) {
    if (!isObject(data.instructions)) {
      errors.push("Поле instructions должно быть объектом.");
    } else {
      if (
        data.instructions.title !== undefined &&
        !isNonEmptyString(data.instructions.title)
      ) {
        errors.push("Поле instructions.title должно быть непустой строкой.");
      }

      if (
        data.instructions.text !== undefined &&
        !isNonEmptyString(data.instructions.text)
      ) {
        errors.push("Поле instructions.text должно быть непустой строкой.");
      }

      if (
        data.instructions.reverseNote !== undefined &&
        !isNonEmptyString(data.instructions.reverseNote)
      ) {
        errors.push("Поле instructions.reverseNote должно быть непустой строкой.");
      }
    }
  }

  if (!isObject(data.scale)) {
    errors.push("Поле scale обязательно и должно быть объектом.");
  } else {
    if (!isNonEmptyString(data.scale.type)) {
      errors.push("Поле scale.type обязательно и должно быть непустой строкой.");
    }

    if (data.scale.min !== undefined && !isNumber(data.scale.min)) {
      errors.push("Поле scale.min должно быть числом, если указано.");
    }

    if (data.scale.max !== undefined && !isNumber(data.scale.max)) {
      errors.push("Поле scale.max должно быть числом, если указано.");
    }

    if (!Array.isArray(data.scale.options) || data.scale.options.length === 0) {
      errors.push("Поле scale.options обязательно и должно быть непустым массивом.");
    } else {
      data.scale.options.forEach((option, index) => {
        if (!isObject(option)) {
          errors.push(`scale.options[${index}] должен быть объектом.`);
          return;
        }

        if (!isNumber(option.value)) {
          errors.push(`scale.options[${index}].value должен быть числом.`);
        }

        if (!isNonEmptyString(option.label)) {
          errors.push(`scale.options[${index}].label должен быть непустой строкой.`);
        }
      });
    }

    if (data.scale.reverseScoring !== undefined) {
      if (!isObject(data.scale.reverseScoring)) {
        errors.push("Поле scale.reverseScoring должно быть объектом, если указано.");
      } else {
        const reverseValues = Object.values(data.scale.reverseScoring);
        if (reverseValues.some((value) => !isNumber(value))) {
          errors.push("Все значения scale.reverseScoring должны быть числами.");
        }
      }
    }
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push("Поле questions обязательно и должно быть непустым массивом.");
  } else {
    const seenIds = new Set<string>();
    const seenNumbers = new Set<number>();

    data.questions.forEach((question, index) => {
      if (!isObject(question)) {
        errors.push(`questions[${index}] должен быть объектом.`);
        return;
      }

      if (!isNonEmptyString(question.id)) {
        errors.push(`questions[${index}].id должен быть непустой строкой.`);
      } else if (seenIds.has(question.id)) {
        errors.push(`questions[${index}].id "${question.id}" дублируется.`);
      } else {
        seenIds.add(question.id);
      }

      if (!isNumber(question.number)) {
        errors.push(`questions[${index}].number должен быть числом.`);
      } else if (seenNumbers.has(question.number)) {
        errors.push(`questions[${index}].number "${question.number}" дублируется.`);
      } else {
        seenNumbers.add(question.number);
      }

      if (!isNonEmptyString(question.text)) {
        errors.push(`questions[${index}].text должен быть непустой строкой.`);
      }

      if (
        question.trait !== undefined &&
        !isNonEmptyString(question.trait)
      ) {
        errors.push(`questions[${index}].trait должен быть непустой строкой, если указан.`);
      }

      if (
        question.reverse !== undefined &&
        !isBoolean(question.reverse)
      ) {
        errors.push(`questions[${index}].reverse должен быть boolean, если указан.`);
      }
    });
  }

  if (!isObject(data.scoring)) {
    errors.push("Поле scoring обязательно и должно быть объектом.");
  } else {
    const scoring = data.scoring as Record<string, unknown>;

    if (!isNonEmptyString(scoring.method)) {
      errors.push("Поле scoring.method обязательно и должно быть непустой строкой.");
    } else if (scoring.method !== "sum" && scoring.method !== "subscales_sum") {
      errors.push('Поле scoring.method должно быть "sum" или "subscales_sum".');
    }

    if (scoring.method === "sum") {
      if (!isNonEmptyString(scoring.trait)) {
        errors.push("Поле scoring.trait обязательно для method=sum.");
      }

      if (!Array.isArray(scoring.directItems)) {
        errors.push("Поле scoring.directItems обязательно и должно быть массивом для method=sum.");
      } else if (scoring.directItems.some((n) => !isNumber(n))) {
        errors.push("Все элементы scoring.directItems должны быть числами.");
      }

      if (!Array.isArray(scoring.reverseItems)) {
        errors.push("Поле scoring.reverseItems обязательно и должно быть массивом для method=sum.");
      } else if (scoring.reverseItems.some((n) => !isNumber(n))) {
        errors.push("Все элементы scoring.reverseItems должны быть числами.");
      }

      if (!isNumber(scoring.minScore)) {
        errors.push("Поле scoring.minScore обязательно и должно быть числом для method=sum.");
      }

      if (!isNumber(scoring.maxScore)) {
        errors.push("Поле scoring.maxScore обязательно и должно быть числом для method=sum.");
      }

      if (!isNonEmptyString(scoring.higherMeans)) {
        errors.push("Поле scoring.higherMeans обязательно и должно быть непустой строкой для method=sum.");
      }

      if (
        scoring.showAverage !== undefined &&
        !isBoolean(scoring.showAverage)
      ) {
        errors.push("Поле scoring.showAverage должно быть boolean, если указано.");
      }

      if (
        scoring.interpretationMode !== undefined &&
        scoring.interpretationMode !== "bands" &&
        scoring.interpretationMode !== "none"
      ) {
        errors.push('Поле scoring.interpretationMode должно быть "bands" или "none".');
      }

      const directItems = Array.isArray(scoring.directItems)
        ? scoring.directItems.filter(isNumber)
        : [];
      const reverseItems = Array.isArray(scoring.reverseItems)
        ? scoring.reverseItems.filter(isNumber)
        : [];

      const overlap = directItems.filter((n) => reverseItems.includes(n));
      if (overlap.length > 0) {
        errors.push(
          `Пункты не могут одновременно быть в directItems и reverseItems: ${overlap.join(", ")}.`
        );
      }
    }

    if (scoring.method === "subscales_sum") {
      if (!Array.isArray(scoring.subscales) || scoring.subscales.length === 0) {
        errors.push("Поле scoring.subscales обязательно и должно быть непустым массивом для method=subscales_sum.");
      } else {
        const subscaleKeys = new Set<string>();

        scoring.subscales.forEach((subscale, index) => {
          if (!isObject(subscale)) {
            errors.push(`scoring.subscales[${index}] должен быть объектом.`);
            return;
          }

          if (!isNonEmptyString(subscale.key)) {
            errors.push(`scoring.subscales[${index}].key должен быть непустой строкой.`);
          } else if (subscaleKeys.has(subscale.key)) {
            errors.push(`scoring.subscales[${index}].key "${subscale.key}" дублируется.`);
          } else {
            subscaleKeys.add(subscale.key);
          }

          if (!isNonEmptyString(subscale.label)) {
            errors.push(`scoring.subscales[${index}].label должен быть непустой строкой.`);
          }

          if (!Array.isArray(subscale.items) || subscale.items.length === 0) {
            errors.push(`scoring.subscales[${index}].items должен быть непустым массивом.`);
          } else if (subscale.items.some((n) => !isNumber(n))) {
            errors.push(`Все элементы scoring.subscales[${index}].items должны быть числами.`);
          }
        });
      }
    }
  }

  if (data.resultBands !== undefined) {
    if (!Array.isArray(data.resultBands) || data.resultBands.length === 0) {
      errors.push("Поле resultBands должно быть непустым массивом, если указано.");
    } else {
      data.resultBands.forEach((band, index) => {
        if (!isObject(band)) {
          errors.push(`resultBands[${index}] должен быть объектом.`);
          return;
        }

        if (!isNonEmptyString(band.key)) {
          errors.push(`resultBands[${index}].key должен быть непустой строкой.`);
        }

        if (!isNumber(band.min)) {
          errors.push(`resultBands[${index}].min должен быть числом.`);
        }

        if (!isNumber(band.max)) {
          errors.push(`resultBands[${index}].max должен быть числом.`);
        }

        if (!isNonEmptyString(band.label)) {
          errors.push(`resultBands[${index}].label должен быть непустой строкой.`);
        }
      });
    }
  }

  if (data.norms !== undefined) {
    if (!isObject(data.norms)) {
      errors.push("Поле norms должно быть объектом, если указано.");
    } else {
      if (!isNonEmptyString(data.norms.type)) {
        errors.push("Поле norms.type должно быть непустой строкой.");
      } else if (data.norms.type !== "percentiles") {
        errors.push('Поле norms.type должно быть "percentiles".');
      }

      if (!isObject(data.norms.subscales)) {
        errors.push("Поле norms.subscales должно быть объектом.");
      } else {
        for (const [subscaleKey, subscaleNorms] of Object.entries(
          data.norms.subscales
        )) {
          if (!isObject(subscaleNorms)) {
            errors.push(`norms.subscales.${subscaleKey} должен быть объектом.`);
            continue;
          }

          for (const [rawScore, percentile] of Object.entries(subscaleNorms)) {
            if (Number.isNaN(Number(rawScore))) {
              errors.push(
                `Ключ "${rawScore}" в norms.subscales.${subscaleKey} должен быть числом в строковом виде.`
              );
            }

            if (!isNumber(percentile)) {
              errors.push(
                `Значение norms.subscales.${subscaleKey}.${rawScore} должно быть числом.`
              );
            }
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

export function isQuestionnaire(data: unknown): data is Questionnaire {
  return validateQuestionnaire(data).valid;
}