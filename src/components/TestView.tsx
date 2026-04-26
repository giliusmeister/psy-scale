import type { UiCopy } from "../i18n";
import type { Question, Questionnaire } from "../types/questionnaire";
import type { AnswerOptionEntry } from "../utils/questionnaireFlow";

type TestViewProps = {
  questionnaire: Questionnaire;
  currentQuestion: Question;
  currentIndex: number;
  visibleQuestionCount: number;
  answeredCount: number;
  optionEntries: AnswerOptionEntry[];
  selectedOption: AnswerOptionEntry | null;
  selectedOptionKey: string | undefined;
  effectiveAnswer: number | undefined;
  hasDuplicateValues: boolean;
  sliderAllowed: boolean;
  buttonsAllowed: boolean;
  showAnswerLegend: boolean;
  sliderMin: number;
  sliderMax: number;
  canProceed: boolean;
  isLastQuestion: boolean;
  copy: UiCopy;
  onBackToList: () => void;
  onBack: () => void;
  onNext: () => void;
  onSelectAnswer: (value: number, optionKey?: string) => void;
};

export function TestView({
  questionnaire,
  currentQuestion,
  currentIndex,
  visibleQuestionCount,
  answeredCount,
  optionEntries,
  selectedOption,
  selectedOptionKey,
  effectiveAnswer,
  hasDuplicateValues,
  sliderAllowed,
  buttonsAllowed,
  showAnswerLegend,
  sliderMin,
  sliderMax,
  canProceed,
  isLastQuestion,
  copy,
  onBackToList,
  onBack,
  onNext,
  onSelectAnswer,
}: TestViewProps) {
  return (
    <div className="page">
      <div className="card card--test">
        <div className="test-header">
          <div className="top-bar">
            <button className="top-button" onClick={onBackToList}>
              {copy.backToList}
            </button>
            <div className="top-bar-title">{questionnaire.title}</div>
          </div>

          <div className="report-meta">
            <div>
              <strong>ID:</strong> {questionnaire.id}
            </div>
            {questionnaire.author && (
              <div>
                <strong>{copy.author}:</strong> {questionnaire.author}
              </div>
            )}
          </div>

          {questionnaire.instructions?.text && (
            <p className="instructions-text">{questionnaire.instructions.text}</p>
          )}

          {showAnswerLegend && (
            <div className="scale-box">
              <div className="scale-title">{copy.answerOptions}</div>
              {optionEntries.map((option) => (
                <div key={option.key} className="scale-item">
                  {option.value} — {option.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="test-content">
          <div className="progress-text">
            {copy.question} {currentIndex + 1} {copy.of} {visibleQuestionCount}
          </div>

          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${
                  visibleQuestionCount > 0
                    ? ((currentIndex + 1) / visibleQuestionCount) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          <div className="question-block">
            <div className="question-number">{currentQuestion.number}</div>
            <p className="question-text">{currentQuestion.text}</p>
          </div>

          {sliderAllowed && (
            <>
              <div className="answer-slider">
                <input
                  className="answer-slider-input"
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={1}
                  value={effectiveAnswer ?? sliderMin}
                  onChange={(event) => onSelectAnswer(Number(event.target.value))}
                />
                <div className="answer-slider-value">{effectiveAnswer ?? sliderMin}</div>
              </div>

              <div className="answer-slider-label">
                {selectedOption?.label ?? "\u00A0"}
              </div>
            </>
          )}

          {buttonsAllowed && (
            <div className="answers-block">
              {optionEntries.map((option) => {
                const selected = hasDuplicateValues
                  ? selectedOptionKey === option.key
                  : effectiveAnswer === option.value;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onSelectAnswer(option.value, option.key)}
                    className={`answer-button ${
                      selected ? "answer-button-selected" : ""
                    }`}
                  >
                    <div className="answer-value">{option.value}</div>
                    <div className="answer-label">{option.label}</div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="footer">
            <button
              onClick={onBack}
              disabled={currentIndex === 0}
              className="secondary-button"
            >
              {copy.back}
            </button>

            <div className="counter">
              {answeredCount}/{visibleQuestionCount}
            </div>

            <button
              onClick={onNext}
              disabled={!canProceed}
              className="primary-button"
            >
              {isLastQuestion ? copy.finish : copy.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
