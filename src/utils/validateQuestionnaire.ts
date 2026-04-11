import type { Questionnaire } from "../types/questionnaire";

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

export function validateQuestionnaire(data: unknown): string[] {
  const errors: string[] = [];

  if (!isObject(data)) {
    return ["Корневой объект опросника должен быть объектом."];
  }

  if (!isNonEmptyString(data.id)) {
    errors.push("Поле id обязательно и должно быть непустой строкой.");
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

  if (data.estimatedMinutes !== undefined && !isNumber(data.estimatedMinutes)) {
    errors.push("Поле estimatedMinutes должно быть числом, если указано.");
  }

  if (data.resultDescription !== undefined && !isNonEmptyString(data.resultDescription)) {
    errors.push("Поле resultDescription должно быть непустой строкой, если указано.");
  }

  if (data.ui !== undefined) {
    if (!isObject(data.ui)) {
      errors.push("Поле ui должно быть объектом, если указано.");
    } else if (
      data.ui.inputMode !== undefined &&
      data.ui.inputMode !== "buttons" &&
      data.ui.inputMode !== "slider" &&
      data.ui.inputMode !== "mixed"
    ) {
      errors.push('Поле ui.inputMode должно быть "buttons", "slider" или "mixed".');
    }
  }

  if (data.instructions !== undefined) {
    if (!isObject(data.instructions)) {
      errors.push("Поле instructions должно быть объектом, если указано.");
    } else {
      if (
        data.instructions.title !== undefined &&
        !isNonEmptyString(data.instructions.title)
      ) {
        errors.push("Поле instructions.title должно быть непустой строкой, если указано.");
      }

      if (
        data.instructions.text !== undefined &&
        !isNonEmptyString(data.instructions.text)
      ) {
        errors.push("Поле instructions.text должно быть непустой строкой, если указано.");
      }

      if (
        data.instructions.reverseNote !== undefined &&
        !isNonEmptyString(data.instructions.reverseNote)
      ) {
        errors.push("Поле instructions.reverseNote должно быть непустой строкой, если указано.");
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

    if (
      isNumber(data.scale.min) &&
      isNumber(data.scale.max) &&
      data.scale.min >= data.scale.max
    ) {
      errors.push("Поле scale.max должно быть больше scale.min.");
    }

    if (!Array.isArray(data.scale.options)) {
      errors.push("Поле scale.options обязательно и должно быть массивом.");
    } else {
      data.scale.options.forEach((option, index) => {
        if (!isObject(option)) {
          errors.push(`scale.options[${index}] должен быть объектом.`);
          return;
        }

        if (!isNumber(option.value)) {
          errors.push(`scale.options[${index}].value должен быть числом.`);
        }

        if (!isNonEmptyString(option.label) && option.label !== "") {
          errors.push(`scale.options[${index}].label должен быть строкой.`);
        }
      });
    }

    if (data.scale.reverseScoring !== undefined) {
      if (!isObject(data.scale.reverseScoring)) {
        errors.push("Поле scale.reverseScoring должно быть объектом, если указано.");
      } else {
        Object.entries(data.scale.reverseScoring).forEach(([key, value]) => {
          if (!isNonEmptyString(key)) {
            errors.push("Ключи scale.reverseScoring должны быть непустыми строками.");
          }
          if (!isNumber(value)) {
            errors.push(`scale.reverseScoring["${key}"] должен быть числом.`);
          }
        });
      }
    }
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push("Поле questions обязательно и должно быть непустым массивом.");
  } else {
    const questionIds = new Set<string>();

    data.questions.forEach((question, index) => {
      if (!isObject(question)) {
        errors.push(`questions[${index}] должен быть объектом.`);
        return;
      }

      if (!isNonEmptyString(question.id)) {
        errors.push(`questions[${index}].id должен быть непустой строкой.`);
      } else if (questionIds.has(question.id)) {
        errors.push(`questions[${index}].id "${question.id}" дублируется.`);
      } else {
        questionIds.add(question.id);
      }

      const numberOk =
        isNumber(question.number) ||
        isNonEmptyString(question.number);

      if (!numberOk) {
        errors.push(`questions[${index}].number должен быть числом или непустой строкой.`);
      }

      if (!isNonEmptyString(question.text)) {
        errors.push(`questions[${index}].text должен быть непустой строкой.`);
      }

      if (question.trait !== undefined && !isNonEmptyString(question.trait)) {
        errors.push(`questions[${index}].trait должен быть непустой строкой, если указан.`);
      }

      if (question.reverse !== undefined && !isBoolean(question.reverse)) {
        errors.push(`questions[${index}].reverse должен быть boolean, если указан.`);
      }

      if (question.scorable !== undefined && !isBoolean(question.scorable)) {
        errors.push(`questions[${index}].scorable должен быть boolean, если указан.`);
      }

      if (question.options !== undefined) {
        if (!Array.isArray(question.options) || question.options.length === 0) {
          errors.push(`questions[${index}].options должен быть непустым массивом, если указан.`);
        } else {
          question.options.forEach((option, optionIndex) => {
            if (!isObject(option)) {
              errors.push(`questions[${index}].options[${optionIndex}] должен быть объектом.`);
              return;
            }

            if (!isNumber(option.value)) {
              errors.push(`questions[${index}].options[${optionIndex}].value должен быть числом.`);
            }

            if (!isNonEmptyString(option.label) && option.label !== "") {
              errors.push(
                `questions[${index}].options[${optionIndex}].label должен быть строкой.`
              );
            }
          });
        }
      }

      if (question.visibility !== undefined) {
        if (!isObject(question.visibility)) {
          errors.push(`questions[${index}].visibility должен быть объектом, если указан.`);
        } else {
          if (!isNonEmptyString(question.visibility.dependsOn)) {
            errors.push(`questions[${index}].visibility.dependsOn должен быть непустой строкой.`);
          }

          const validOperators = new Set([
            "equals",
            "notEquals",
            "in",
            "notIn",
            "greaterThan",
            "greaterThanOrEqual",
            "lessThan",
            "lessThanOrEqual",
          ]);

          if (
            !isNonEmptyString(question.visibility.operator) ||
            !validOperators.has(question.visibility.operator)
          ) {
            errors.push(`questions[${index}].visibility.operator имеет недопустимое значение.`);
          }

          if (question.visibility.value === undefined) {
            errors.push(`questions[${index}].visibility.value обязателен.`);
          }
        }
      }
    });
  }

  if (!isObject(data.scoring)) {
    errors.push("Поле scoring обязательно и должно быть объектом.");
  } else {
    const scoring = data.scoring;

    if (!isNonEmptyString(scoring.method)) {
      errors.push("Поле scoring.method обязательно.");
    } else if (
      scoring.method !== "sum" &&
      scoring.method !== "subscales_sum" &&
      scoring.method !== "sum_with_subscales"
    ) {
      errors.push(
        'Поле scoring.method должно быть "sum", "subscales_sum" или "sum_with_subscales".'
      );
    }

    if (scoring.method === "sum" || scoring.method === "sum_with_subscales") {
      if (!isNonEmptyString(scoring.trait)) {
        errors.push("Поле scoring.trait обязательно и должно быть непустой строкой.");
      }

      if (!Array.isArray(scoring.directItems)) {
        errors.push("Поле scoring.directItems обязательно и должно быть массивом.");
      } else if (scoring.directItems.some((n) => !isNumber(n))) {
        errors.push("Все элементы scoring.directItems должны быть числами.");
      }

      if (!Array.isArray(scoring.reverseItems)) {
        errors.push("Поле scoring.reverseItems обязательно и должно быть массивом.");
      } else if (scoring.reverseItems.some((n) => !isNumber(n))) {
        errors.push("Все элементы scoring.reverseItems должны быть числами.");
      }

      if (!isNumber(scoring.minScore)) {
        errors.push("Поле scoring.minScore обязательно и должно быть числом.");
      }

      if (!isNumber(scoring.maxScore)) {
        errors.push("Поле scoring.maxScore обязательно и должно быть числом.");
      }

      if (
        isNumber(scoring.minScore) &&
        isNumber(scoring.maxScore) &&
        scoring.minScore > scoring.maxScore
      ) {
        errors.push("Поле scoring.maxScore должно быть больше или равно scoring.minScore.");
      }

      if (!isNonEmptyString(scoring.higherMeans)) {
        errors.push("Поле scoring.higherMeans обязательно и должно быть непустой строкой.");
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

      if (
        scoring.percentileBasis !== undefined &&
        scoring.percentileBasis !== "total" &&
        scoring.percentileBasis !== "average"
      ) {
        errors.push('Поле scoring.percentileBasis должно быть "total" или "average".');
      }

      if (Array.isArray(scoring.directItems) && Array.isArray(scoring.reverseItems)) {
        const overlap = scoring.directItems.filter((n) => scoring.reverseItems.includes(n));
        if (overlap.length > 0) {
          errors.push(
            `Элементы scoring.directItems и scoring.reverseItems пересекаются: ${overlap.join(", ")}.`
          );
        }
      }

      if (scoring.method === "sum_with_subscales") {
        if (!Array.isArray(scoring.subscales) || scoring.subscales.length === 0) {
          errors.push(
            "Поле scoring.subscales обязательно и должно быть непустым массивом для method=sum_with_subscales."
          );
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

            if (
              subscale.aggregation !== undefined &&
              subscale.aggregation !== "sum" &&
              subscale.aggregation !== "mean"
            ) {
              errors.push(
                `scoring.subscales[${index}].aggregation должно быть "sum" или "mean".`
              );
            }
          });
        }
      }
    }

    if (scoring.method === "subscales_sum") {
      if (!Array.isArray(scoring.subscales) || scoring.subscales.length === 0) {
        errors.push("Поле scoring.subscales обязательно и должно быть непустым массивом.");
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

          if (
            subscale.aggregation !== undefined &&
            subscale.aggregation !== "sum" &&
            subscale.aggregation !== "mean"
          ) {
            errors.push(
              `scoring.subscales[${index}].aggregation должно быть "sum" или "mean".`
            );
          }
        });
      }
    }
  }

  if (data.resultBands !== undefined) {
    if (!Array.isArray(data.resultBands)) {
      errors.push("Поле resultBands должно быть массивом, если указано.");
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

        if (isNumber(band.min) && isNumber(band.max) && band.min > band.max) {
          errors.push(`resultBands[${index}].max должен быть больше или равен min.`);
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
      if (data.norms.type !== "percentiles") {
        errors.push('Поле norms.type должно быть "percentiles".');
      }

      if (!isObject(data.norms.subscales)) {
        errors.push("Поле norms.subscales обязательно и должно быть объектом.");
      } else {
        Object.entries(data.norms.subscales).forEach(([subscaleKey, table]) => {
          if (!isObject(table)) {
            errors.push(`norms.subscales["${subscaleKey}"] должен быть объектом.`);
            return;
          }

          Object.entries(table).forEach(([score, percentile]) => {
            if (!isNonEmptyString(score)) {
              errors.push(`Ключ norms.subscales["${subscaleKey}"] должен быть непустой строкой.`);
            }
            if (!isNumber(percentile)) {
              errors.push(
                `norms.subscales["${subscaleKey}"]["${score}"] должен быть числом.`
              );
            }
          });
        });
      }
    }
  }

  if (data.ui?.inputMode === "slider") {
    const scale = data.scale;

    if (!isObject(scale)) {
      errors.push('Для ui.inputMode="slider" требуется корректный объект scale.');
    } else {
      if (!isNumber(scale.min) || !isNumber(scale.max) || scale.min >= scale.max) {
        errors.push(
          'Для ui.inputMode="slider" должны быть заданы корректные scale.min и scale.max.'
        );
      }

      if (!Array.isArray(scale.options) || scale.options.length === 0) {
        errors.push('Для ui.inputMode="slider" scale.options должен быть непустым массивом.');
      } else if (isNumber(scale.min)) {
        const values = scale.options
          .map((option) => (isObject(option) ? option.value : NaN))
          .sort((a, b) => a - b);

        for (let i = 0; i < values.length; i += 1) {
          if (!isNumber(values[i]) || values[i] !== scale.min + i) {
            errors.push(
              'Для ui.inputMode="slider" значения scale.options должны образовывать непрерывный числовой диапазон.'
            );
            break;
          }
        }
      }
    }
  }

  return errors;
}

export function isQuestionnaireValid(data: unknown): data is Questionnaire {
  return validateQuestionnaire(data).length === 0;
}