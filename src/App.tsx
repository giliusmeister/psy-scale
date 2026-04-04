import { useMemo, useState } from "react";
import { questionnaires } from "./data/questionnaires";
import { calculateResult } from "./utils/scoring";
import { downloadDebugResult } from "./utils/debug";
import type { Questionnaire, ResultBand } from "./types/questionnaire";
import "./App.css";

type CalculationResult = {
  total: number;
  level?: ResultBand;
};

function App() {
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const currentQuestion = selectedQuestionnaire?.questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const isLastQuestion =
    !!selectedQuestionnaire &&
    currentIndex === selectedQuestionnaire.questions.length - 1;

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  // ===== handlers =====

  const handleSelectQuestionnaire = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
  };

  const handleSelectAnswer = (value: number) => {
    if (!currentQuestion) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (!selectedQuestionnaire || !currentQuestion || !currentAnswer) return;

    if (isLastQuestion) {
      const finalResult = calculateResult(answers, selectedQuestionnaire);
      setResult(finalResult);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
  };

  const handleBackToList = () => {
    setSelectedQuestionnaire(null);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
  };
/*
  const handleExitTest = () => {
    const confirmed = window.confirm(
      "Вы уверены, что хотите выйти из теста? Все ответы будут потеряны."
    );

    if (!confirmed) return;

    handleBackToList();
  };
*/
  const handleDownloadDebug = () => {
    if (!selectedQuestionnaire || !result) return;

    downloadDebugResult({
      questionnaire: selectedQuestionnaire,
      answers,
      total: result.total,
      level: result.level,
    });
  };

  // ===== список тестов =====

  if (!selectedQuestionnaire) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">psy-scale</h1>
          <p className="instructions-text">Выберите опросник из списка:</p>

          {questionnaires.length === 0 ? (
            <div className="empty-state">
              Не найдено ни одного валидного опросника. Проверьте JSON и консоль.
            </div>
          ) : (
            <div className="questionnaire-list">
              {questionnaires.map((q) => (
                <button
                  key={q.id}
                  className="questionnaire-card"
                  onClick={() => handleSelectQuestionnaire(q)}
                >
                  <div className="questionnaire-card-title">{q.title}</div>
                  <div className="questionnaire-card-description">
                    {q.description}
                  </div>
                  <div className="questionnaire-card-meta">
                    <span>ID: {q.id}</span>
                    {q.author && <span>Автор: {q.author}</span>}
                    <span>Вопросов: {q.questions.length}</span>
                    {q.estimatedMinutes && (
                      <span>~{q.estimatedMinutes} мин</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== экран результата =====

  if (result) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">{selectedQuestionnaire.title}</h1>
          <h2 className="subtitle">Результат</h2>

          <p className="result-text">
            Ваш результат: <strong>{result.total}</strong>
          </p>

          <p className="result-badge">
            {result.level?.label ?? "Не определено"}
          </p>

          <div className="report-meta">
            <strong>ID:</strong> {selectedQuestionnaire.id}
          </div>

          <div className="result-actions">
            <button className="secondary-button" onClick={handleDownloadDebug}>
              Скачать JSON
            </button>

            <button className="secondary-button" onClick={handleBackToList}>
              К списку
            </button>

            <button className="primary-button" onClick={handleRestart}>
              Пройти заново
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  // ===== экран теста =====

  return (
    <div className="page">
      <div className="card card--test">
        <div className="test-header">
          <div className="top-bar">
            <button className="top-button" onClick={handleBackToList}>
              К списку
            </button>

            <div className="top-bar-title">
              {selectedQuestionnaire.title}
            </div>
			{/*
            <button className="top-button top-button--danger" onClick={handleExitTest} >
            Выйти
            </button> 
			*/}
          </div>

          <div className="report-meta">
            <div>
              <strong>ID:</strong> {selectedQuestionnaire.id}
            </div>
            {selectedQuestionnaire.author && (
              <div>
                <strong>Автор:</strong> {selectedQuestionnaire.author}
              </div>
            )}
          </div>

          {selectedQuestionnaire.instructions?.text && (
            <p className="instructions-text">
              {selectedQuestionnaire.instructions.text}
            </p>
          )}

          <div className="scale-box">
            <div className="scale-title">
              {selectedQuestionnaire.instructions?.title ?? "Шкала"}
            </div>

            {selectedQuestionnaire.scale.options.map((option) => (
              <div key={option.value} className="scale-item">
                {option.value} — {option.label}
              </div>
            ))}
          </div>
        </div>

        <div className="test-content">
          <div className="progress-text">
            Вопрос {currentIndex + 1} из{" "}
            {selectedQuestionnaire.questions.length}
          </div>

          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${
                  ((currentIndex + 1) /
                    selectedQuestionnaire.questions.length) *
                  100
                }%`,
              }}
            />
          </div>

          <div className="question-block">
            <div className="question-number">{currentQuestion.number}</div>
            <p className="question-text">{currentQuestion.text}</p>
          </div>

          <div className="answers-block">
            {selectedQuestionnaire.scale.options.map((option) => {
              const selected = currentAnswer === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleSelectAnswer(option.value)}
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

          <div className="footer">
            <button
              onClick={handleBack}
              disabled={currentIndex === 0}
              className="secondary-button"
            >
              Назад
            </button>

            <div className="counter">
              {answeredCount} / {selectedQuestionnaire.questions.length}
            </div>

            <button
              onClick={handleNext}
              disabled={!currentAnswer}
              className="primary-button"
            >
              {isLastQuestion ? "Завершить" : "Далее"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;