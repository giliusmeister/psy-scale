import type { Questionnaire } from "../types/questionnaire";

const QUESTIONNAIRES_LIST_URL = "/api/questionnaires";
const QUESTIONNAIRE_FILE_URL = "/api/questionnaires/";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

function getQuestionnaireId(fileName: string): string {
  return fileName.replace(/\.json$/i, "");
}

function assertQuestionnaireFiles(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error("Invalid questionnaires list response");
  }

  return value;
}

export async function loadQuestionnaires(): Promise<Questionnaire[]> {
  const files = assertQuestionnaireFiles(
    await fetchJson<unknown>(QUESTIONNAIRES_LIST_URL),
  );
  const seenIds = new Set<string>();
  const loaded = await Promise.all(
    files.map(async (fileName) => {
      const id = getQuestionnaireId(fileName);

      if (seenIds.has(id)) {
        throw new Error(`Duplicate questionnaire id: ${id}`);
      }

      seenIds.add(id);

      const data = await fetchJson<Omit<Questionnaire, "id">>(
        `${QUESTIONNAIRE_FILE_URL}${encodeURIComponent(fileName)}`,
      );

      return {
        ...data,
        id,
      };
    }),
  );

  return loaded;
}
