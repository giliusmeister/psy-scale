import { useEffect, useMemo, useState } from "react";
import { QuestionnaireList } from "./components/QuestionnaireList";
import { ResultView } from "./components/ResultView";
import { TestView } from "./components/TestView";
import { questionnaires } from "./data/questionnaires";
import {
  getInitialLanguage,
  getQuestionnaireLanguage,
  LANGUAGE_STORAGE_KEY,
  UI_COPY,
} from "./i18n";
import type { AppLanguage } from "./i18n";
import type { Questionnaire } from "./types/questionnaire";
import { downloadDebugResult } from "./utils/debug";
import {
  buildOptionKey,
  hasDuplicateOptionValues,
  isQuestionVisible,
  pruneHiddenAnswers,
  pruneHiddenOptionKeys,
} from "./utils/questionnaireFlow";
import { calculateResult } from "./utils/scoring";
import type { CalculationResult } from "./utils/scoring";
import "./App.css";

function App() {
  const [selectedLanguage, setSelectedLanguage] =
    useState<AppLanguage>(getInitialLanguage);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<Questionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedOptionKeys, setSelectedOptionKeys] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const copy = UI_COPY[selectedLanguage];

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
  }, [selectedLanguage]);

  const questionnaireGroups = useMemo(() => {
    const groups = questionnaires.reduce<Record<string, Questionnaire[]>>(
      (acc, questionnaire) => {
        const language = getQuestionnaireLanguage(questionnaire);

        if (language !== selectedLanguage) {
          return acc;
        }

        const category = questionnaire.category || "other";
        acc[category] ??= [];
        acc[category].push(questionnaire);

        return acc;
      },
      {},
    );

    return Object.entries(groups);
  }, [selectedLanguage]);

  const visibleQuestions = useMemo(() => {
    if (!selectedQuestionnaire) {
      return [];
    }

    return selectedQuestionnaire.questions.filter((question) =>
      isQuestionVisible(question, answers),
    );
  }, [selectedQuestionnaire, answers]);

  useEffect(() => {
    if (!selectedQuestionnaire) {
      return;
    }

    setSelectedOptionKeys((prev) =>
      pruneHiddenOptionKeys(selectedQuestionnaire.questions, prev, answers),
    );
  }, [selectedQuestionnaire, answers]);

  const currentQuestion = visibleQuestions[currentIndex];
  const inputMode = selectedQuestionnaire?.ui?.inputMode ?? "buttons";
  const showSliderByMode = inputMode === "slider" || inputMode === "mixed";
  const showButtonsByMode = inputMode === "buttons" || inputMode === "mixed";
  const answerOptions = currentQuestion?.options ?? selectedQuestionnaire?.scale.options ?? [];

  const optionEntries = answerOptions.map((option, index) => ({
    ...option,
    index,
    key: currentQuestion ? buildOptionKey(currentQuestion.id, index) : String(index),
  }));

  const hasDuplicateValues = hasDuplicateOptionValues(answerOptions);
  const sliderAllowed = showSliderByMode && !hasDuplicateValues;
  const buttonsAllowed = showButtonsByMode || hasDuplicateValues;
  const showAnswerLegend = buttonsAllowed && !sliderAllowed;

  const sliderMin =
    answerOptions.length > 0
      ? Math.min(...answerOptions.map((option) => option.value))
      : selectedQuestionnaire?.scale.min ?? 0;

  const sliderMax =
    answerOptions.length > 0
      ? Math.max(...answerOptions.map((option) => option.value))
      : selectedQuestionnaire?.scale.max ?? 0;

  const rawAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const effectiveAnswer =
    rawAnswer !== undefined ? rawAnswer : sliderAllowed ? sliderMin : undefined;

  const selectedOptionKey = currentQuestion
    ? selectedOptionKeys[currentQuestion.id]
    : undefined;

  const selectedOption =
    selectedOptionKey !== undefined
      ? optionEntries.find((option) => option.key === selectedOptionKey) ?? null
      : optionEntries.find((option) => option.value === effectiveAnswer) ?? null;

  const answeredCount = useMemo(() => {
    return visibleQuestions.filter((question) => {
      if (answers[question.id] !== undefined) {
        return true;
      }

      return (
        question.id === currentQuestion?.id &&
        !hasDuplicateValues &&
        effectiveAnswer !== undefined
      );
    }).length;
  }, [visibleQuestions, answers, currentQuestion, hasDuplicateValues, effectiveAnswer]);

  const isLastQuestion =
    visibleQuestions.length > 0 && currentIndex === visibleQuestions.length - 1;

  const canProceed = hasDuplicateValues
    ? selectedOptionKey !== undefined
    : effectiveAnswer !== undefined;

  function resetSession(questionnaire: Questionnaire | null = selectedQuestionnaire) {
    setSelectedQuestionnaire(questionnaire);
    setAnswers({});
    setSelectedOptionKeys({});
    setCurrentIndex(0);
    setResult(null);
    setStartedAt(questionnaire ? Date.now() : null);
    setFinishedAt(null);
  }

  function handleSelectQuestionnaire(questionnaire: Questionnaire) {
    resetSession(questionnaire);
  }

  function handleSelectAnswer(value: number, optionKey?: string) {
    if (!currentQuestion || !selectedQuestionnaire) {
      return;
    }

    const updatedAnswers = pruneHiddenAnswers(selectedQuestionnaire.questions, {
      ...answers,
      [currentQuestion.id]: value,
    });

    setAnswers(updatedAnswers);

    if (optionKey) {
      setSelectedOptionKeys(
        pruneHiddenOptionKeys(
          selectedQuestionnaire.questions,
          {
            ...selectedOptionKeys,
            [currentQuestion.id]: optionKey,
          },
          updatedAnswers,
        ),
      );
      return;
    }

    const nextOptionKeys = { ...selectedOptionKeys };
    delete nextOptionKeys[currentQuestion.id];
    setSelectedOptionKeys(
      pruneHiddenOptionKeys(selectedQuestionnaire.questions, nextOptionKeys, updatedAnswers),
    );
  }

  function handleNext() {
    if (!selectedQuestionnaire || !currentQuestion) {
      return;
    }

    if (hasDuplicateValues && !selectedOptionKeys[currentQuestion.id]) {
      return;
    }

    if (!hasDuplicateValues && effectiveAnswer === undefined) {
      return;
    }

    const answerToSave =
      answers[currentQuestion.id] !== undefined ? answers[currentQuestion.id] : effectiveAnswer;

    if (answerToSave === undefined) {
      return;
    }

    const nextAnswers =
      answers[currentQuestion.id] !== undefined
        ? answers
        : pruneHiddenAnswers(selectedQuestionnaire.questions, {
            ...answers,
            [currentQuestion.id]: answerToSave,
          });

    if (isLastQuestion) {
      setAnswers(nextAnswers);
      setFinishedAt(Date.now());
      setResult(calculateResult(nextAnswers, selectedQuestionnaire));
      return;
    }

    if (nextAnswers !== answers) {
      setAnswers(nextAnswers);
    }

    setCurrentIndex((prev) => prev + 1);
  }

  function handleBack() {
    if (currentIndex === 0) {
      return;
    }

    setCurrentIndex((prev) => prev - 1);
  }

  function handleBackToList() {
    resetSession(null);
  }

  function handleDownloadDebug() {
    if (!selectedQuestionnaire || !result) {
      return;
    }

    downloadDebugResult(selectedQuestionnaire, answers, result, startedAt, finishedAt);
  }

  if (!selectedQuestionnaire) {
    return (
      <QuestionnaireList
        groups={questionnaireGroups}
        selectedLanguage={selectedLanguage}
        copy={copy}
        onLanguageChange={setSelectedLanguage}
        onSelectQuestionnaire={handleSelectQuestionnaire}
      />
    );
  }

  if (result) {
    return (
      <ResultView
        questionnaire={selectedQuestionnaire}
        result={result}
        startedAt={startedAt}
        finishedAt={finishedAt}
        language={selectedLanguage}
        copy={copy}
        onDownloadDebug={handleDownloadDebug}
        onBackToList={handleBackToList}
        onRestart={() => resetSession()}
      />
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <TestView
      questionnaire={selectedQuestionnaire}
      currentQuestion={currentQuestion}
      currentIndex={currentIndex}
      visibleQuestionCount={visibleQuestions.length}
      answeredCount={answeredCount}
      optionEntries={optionEntries}
      selectedOption={selectedOption}
      selectedOptionKey={selectedOptionKey}
      effectiveAnswer={effectiveAnswer}
      hasDuplicateValues={hasDuplicateValues}
      sliderAllowed={sliderAllowed}
      buttonsAllowed={buttonsAllowed}
      showAnswerLegend={showAnswerLegend}
      sliderMin={sliderMin}
      sliderMax={sliderMax}
      canProceed={canProceed}
      isLastQuestion={isLastQuestion}
      copy={copy}
      onBackToList={handleBackToList}
      onBack={handleBack}
      onNext={handleNext}
      onSelectAnswer={handleSelectAnswer}
    />
  );
}

export default App;
