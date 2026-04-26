import type { Questionnaire } from "../types/questionnaire";

// автоматически подгружаем все JSON из папки questionnaires
type QuestionnaireModule = { default?: Questionnaire } & Partial<Questionnaire>;

const modules = import.meta.glob("../questionnaires/*.json", {
  eager: true,
}) as Record<string, QuestionnaireModule>;

const loaded: Questionnaire[] = [];

const seenIds = new Set<string>();

for (const path in modules) {
  const mod = modules[path];

  const data = (mod.default ?? mod) as Questionnaire;

  // id = имя файла
  const id = path.split("/").pop()?.replace(".json", "") ?? "unknown";

  if (seenIds.has(id)) {
    console.error(`[psy-scale] Duplicate questionnaire id: ${id}`);
    continue;
  }

  seenIds.add(id);

  loaded.push({
    ...data,
    id,
  });
}

export const questionnaires: Questionnaire[] = loaded;
