import type { Questionnaire } from "../types/questionnaire";
import { getCategoryLabel } from "../i18n";
import type { AppLanguage, UiCopy } from "../i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

type IndexedQuestionnaire = {
  questionnaire: Questionnaire;
  index: number;
};

type QuestionnaireListProps = {
  groups: Array<[string, Questionnaire[]]>;
  selectedLanguage: AppLanguage;
  copy: UiCopy;
  onLanguageChange: (language: AppLanguage) => void;
  onSelectQuestionnaire: (questionnaire: Questionnaire) => void;
};

export function QuestionnaireList({
  groups,
  selectedLanguage,
  copy,
  onLanguageChange,
  onSelectQuestionnaire,
}: QuestionnaireListProps) {
  const indexedGroups = groups.reduce<Array<[string, IndexedQuestionnaire[]]>>(
    (acc, [category, items]) => {
      const startIndex = acc.reduce(
        (total, [, indexedItems]) => total + indexedItems.length,
        0,
      );

      return [
        ...acc,
        [
          category,
          items.map((questionnaire, itemIndex) => ({
            questionnaire,
            index: startIndex + itemIndex + 1,
          })),
        ],
      ];
    },
    [],
  );

  return (
    <div className="page">
      <div className="card card--questionnaire-list">
        <h1 className="title">Psy-Scale</h1>
        <LanguageSwitcher
          selectedLanguage={selectedLanguage}
          copy={copy}
          onLanguageChange={onLanguageChange}
        />
        <p className="instructions-text">{copy.chooseQuestionnaire}</p>

        {groups.length === 0 ? (
          <div className="empty-state">{copy.emptyState}</div>
        ) : (
          <div className="questionnaire-list">
            {indexedGroups.map(([category, items]) => (
              <div key={category} className="questionnaire-subgroup">
                <div className="questionnaire-subgroup-title">
                  {getCategoryLabel(copy, category)} ({items.length})
                </div>

                <div className="questionnaire-group-list">
                  {items.map(({ questionnaire, index }) => (
                    <button
                      key={questionnaire.id}
                      type="button"
                      className="questionnaire-card"
                      onClick={() => onSelectQuestionnaire(questionnaire)}
                    >
                      <span className="questionnaire-card-index">{index}</span>

                      <span className="questionnaire-card-body">
                        <span className="questionnaire-card-title">
                          {questionnaire.title}
                        </span>

                        <span className="questionnaire-card-description">
                          {questionnaire.description}
                        </span>

                        <span className="questionnaire-card-meta">
                          <span>ID: {questionnaire.id}</span>
                          {questionnaire.author && (
                            <span>
                              {copy.author}: {questionnaire.author}
                            </span>
                          )}
                          <span>
                            {copy.questions}: {questionnaire.questions.length}
                          </span>
                          {questionnaire.estimatedMinutes && (
                            <span>
                              ~{questionnaire.estimatedMinutes} {copy.minutesShort}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
