import type { Questionnaire } from "../types/questionnaire";
import { validateQuestionnaire } from "../utils/validateQuestionnaire";

type JsonModule = {
  default: unknown;
};

function extractIdFromPath(path: string): string {
  const fileName = path.split("/").pop() || "";
  return fileName.replace(".json", "");
}

const modules = import.meta.glob("../questionnaires/*.json", {
  eager: true,
});

const validQuestionnaires: Questionnaire[] = [];

for (const [path, moduleValue] of Object.entries(modules)) {
  const module = moduleValue as JsonModule;
  const data = module.default;

  const validation = validateQuestionnaire(data);

  if (!validation.valid) {
    console.error(`[psy-scale] Questionnaire skipped: ${path}`);
    validation.errors.forEach((error) => {
      console.error(`  - ${error}`);
    });
    continue;
  }

  const id = extractIdFromPath(path);

  const questionnaire: Questionnaire = {
    ...(data as Omit<Questionnaire, "id">),
    id,
  };

  validQuestionnaires.push(questionnaire);
}

export const questionnaires: Questionnaire[] = validQuestionnaires.sort((a, b) =>
  a.title.localeCompare(b.title, "ru")
);