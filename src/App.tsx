import {
    questionnaires
}
from "./data/questionnaires";
import type {
    CalculationResult
}
from "./utils/scoring";
import {
    calculateResult
}
from "./utils/scoring";
import {
    downloadDebugResult
}
from "./utils/debug";
import type {
    Questionnaire,
    Question
}
from "./types/questionnaire";
import "./App.css";
import {
    useEffect,
    useMemo,
    useState
}
from "react";

const DEBUG = false;

function debugLog(...args: unknown[]) {
    if (DEBUG) {
        console.log(...args);
    }
}

function isQuestionVisible(question: Question, answers: Record < string, number > ): boolean {
    if (!question.visibility)
        return true;

    if (!(question.visibility.dependsOn in answers)) {
        debugLog("hidden: no dependsOn answer", question.id, question.visibility);
        return false;
    }
    const actual = answers[question.visibility.dependsOn];
    const {
        operator,
        value
    } = question.visibility;
    switch (operator) {
    case "equals":
        return actual === value;
    case "notEquals":
        return actual !== value;
    case "in":
        return Array.isArray(value) && value.includes(actual);
    case "notIn":
        return Array.isArray(value) && !value.includes(actual);
    case "greaterThan":
        return typeof actual === "number" && typeof value === "number" && actual > value;
    case "greaterThanOrEqual":
        return typeof actual === "number" && typeof value === "number" && actual >= value;
    case "lessThan":
        return typeof actual === "number" && typeof value === "number" && actual < value;
    case "lessThanOrEqual":
        return typeof actual === "number" && typeof value === "number" && actual <= value;
    default:
        return true;
    }
}

function pruneHiddenAnswers(questions: Question[], answers: Record < string, number > ): Record < string, number > {
    const next = {
        ...answers
    };
    for (const q of questions) {
        if (!isQuestionVisible(q, next)) {
            delete next[q.id];
        }
    }
    return next;
}

function App() {
    const [startedAt, setStartedAt] = useState < number | null > (null);
    const [finishedAt, setFinishedAt] = useState < number | null > (null);
    const [selectedQuestionnaire, setSelectedQuestionnaire] = useState < Questionnaire | null > (null);
    const [answers, setAnswers] = useState < Record < string,
    number >> ({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [result, setResult] = useState < CalculationResult | null > (null);
    const visibleQuestions = useMemo(() => {
        if (!selectedQuestionnaire)
            return [];

        const visible = selectedQuestionnaire.questions.filter((q) =>
                isQuestionVisible(q, answers));

        debugLog("answers", answers);
        debugLog(
            "visibleQuestions",
            visible.map((q) => ({
                    id: q.id,
                    number: q.number,
                    text: q.text,
                    dependsOn: q.visibility?.dependsOn,
                    operator: q.visibility?.operator,
                    value: q.visibility?.value,
                })));

        return visible;
    }, [selectedQuestionnaire, answers]);
    const currentQuestion = visibleQuestions[currentIndex];
    const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
    const isLastQuestion = visibleQuestions.length > 0 && currentIndex === visibleQuestions.length - 1;
    const answeredCount = useMemo(() => {
        return visibleQuestions.filter((q) => answers[q.id] !== undefined).length;
    }, [visibleQuestions, answers]);
    const handleSelectQuestionnaire = (questionnaire: Questionnaire) => {
        setSelectedQuestionnaire(questionnaire);
        setAnswers({});
        setCurrentIndex(0);
        setResult(null);
        setStartedAt(Date.now());
        setFinishedAt(null);
    };
    const handleSelectAnswer = (value: number) => {
        if (!currentQuestion || !selectedQuestionnaire)
            return;
        setAnswers((prev) => {
            const updated = {
                ...prev,
                [currentQuestion.id]: value,
            };
            return pruneHiddenAnswers(selectedQuestionnaire.questions, updated);
        });
    };
    const handleNext = () => {
        if (!selectedQuestionnaire || !currentQuestion || currentAnswer === undefined)
            return;
        debugLog("method", selectedQuestionnaire.scoring.method);
        debugLog("questionnaire id", selectedQuestionnaire.id);
        debugLog("scoring", selectedQuestionnaire.scoring);
        if (isLastQuestion) {
            const finalResult = calculateResult(answers, selectedQuestionnaire);
            setFinishedAt(Date.now());
            debugLog("finalResult", finalResult);
            debugLog("resultBands", selectedQuestionnaire.resultBands);
            debugLog("interpretationMode", selectedQuestionnaire.scoring.interpretationMode);
            setResult(finalResult);
            return;
        }
        setCurrentIndex((prev) => prev + 1);
    };
    const handleBack = () => {
        if (currentIndex === 0)
            return;
        setCurrentIndex((prev) => prev - 1);
    };
    const handleRestart = () => {
        setAnswers({});
        setCurrentIndex(0);
        setResult(null);
        setStartedAt(Date.now());
        setFinishedAt(null);
    };
    const handleBackToList = () => {
        setSelectedQuestionnaire(null);
        setAnswers({});
        setCurrentIndex(0);
        setResult(null);
    };
    const handleDownloadDebug = () => {
        if (!selectedQuestionnaire || !result)
            return;
        downloadDebugResult(selectedQuestionnaire, answers, result, startedAt, finishedAt);
    };
    const formatDateTime = (timestamp: number | null) => {
        if (!timestamp)
            return "-";
        return new Date(timestamp).toLocaleString();
    };
    const formatDuration = (start: number | null, end: number | null) => {
        if (!start || !end)
            return "-";
        const seconds = Math.floor((end - start) / 1000);
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min} мин ${sec} сек`;
    };
    if (!selectedQuestionnaire) {
        return ( < div className = "page" >  < div className = "card" >  < h1 className = "title" > psy - scale <  / h1 >  < p className = "instructions-text" > Выберите опросник из списка:  <  / p > {
                questionnaires.length === 0 ? ( < div className = "empty-state" > Не найдено ни одного валидного опросника.Проверьте JSON и консоль. <  / div > ) : ( < div className = "questionnaire-list" > {
                        questionnaires.map((q) => ( < button
                                key = {
                                    q.id
                                }
                                className = "questionnaire-card"
                                    onClick = {
                                    () => handleSelectQuestionnaire(q)
                                }
                                 >  < div className = "questionnaire-card-title" > {
                                    q.title
                                }
                                 <  / div >  < div className = "questionnaire-card-description" > {
                                    q.description
                                }
                                 <  / div >  < div className = "questionnaire-card-meta" >  < span > ID: {
                                    q.id
                                }
                                 <  / span > {
                                q.author &&  < span > Автор: {
                                    q.author
                                }
                                 <  / span >
                            }
                                 < span > Вопросов: {
                                q.questions.length
                            }
                                 <  / span > {
                                q.estimatedMinutes && ( < span > ~{
                                    q.estimatedMinutes
                                }
                                    мин <  / span > )
                            }
                                 <  / div >  <  / button > ))
                    }
                     <  / div > )
            }
             <  / div >  <  / div > );
    }
    if (result) {
        debugLog("render result", result);
        return ( < div className = "page" >  < div className = "card" >  < h1 className = "title" > {
                selectedQuestionnaire.title
            }
             <  / h1 >  < h2 className = "subtitle" > Результат <  / h2 >  < div className = "result-info" >  < div >  < strong > ID:  <  / strong > {
                selectedQuestionnaire.id
            }
             <  / div > {
            selectedQuestionnaire.author && ( < div >  < strong > Автор:  <  / strong > {
                selectedQuestionnaire.author
            }
                 <  / div > )
        }
             < div >  < strong > Вопросов:  <  / strong > {
            selectedQuestionnaire.questions.length
        }
             <  / div > {
            startedAt && finishedAt && ( <  >  < div >  < strong > Начало:  <  / strong > {
                formatDateTime(startedAt)
            }
                 <  / div >  < div >  < strong > Завершение:  <  / strong > {
                formatDateTime(finishedAt)
            }
                 <  / div >  < div >  < strong > Время прохождения:  <  / strong > {
                " "
            } {
                formatDuration(startedAt, finishedAt)
            }
                 <  / div >  <  /  > )
        }
             <  / div > {
            result.type === "sum" && (
                 < div className = "result-main" >
                     < div className = "result-score" > {
                    result.total
                } {
                '\u00A0'
            }
                баллов
                 <  / div > {
                result.average !== null && (
                     < div className = "result-average" >
                        Средний балл: {
                        result.average
                    }
                     <  / div > )
            } {
                result.level && (
                     < div className = "result-level" > {
                        result.level.label
                    }
                     <  / div > )
            } {
                result.percentile !== null && result.percentile !== undefined && (
                     < div className = "percentile-block" >
                         < div className = "percentile-scale-title" >
                        Позиция в выборке: {
                        result.percentile
                    }
                     <  / div >

                     < div className = "percentile-scale" >
                         < div className = "percentile-scale-track" >
                         < div
                        className = "percentile-scale-fill"
                        style = { {
                            width: `${result.percentile}%`
                        }
                    }
                    />
                                              </div >

                     < div className = "percentile-scale-labels" >
                         < span > 0 <  / span >
                         < span > 25 <  / span >
                         < span > 50 <  / span >
                         < span > 75 <  / span >
                         < span > 100 <  / span >
                         <  / div >
                         <  / div >
                         <  / div > )
            } {
                !result.level &&
                (result.percentile === null || result.percentile === undefined) && (
                     < div className = "result-note" >
                        Интерпретация по фиксированным диапазонам для этой методики не задана.
                         <  / div > )
            } { /* ПОДШКАЛЫ */
            }
            {
                result.subscales && result.subscales.length > 0 && (
                     < div className = "result-subscales" >
                         < div className = "subscales-title" > Подшкалы:  <  / div > {
                        result.subscales.map((subscale) => (
                                 < div key = {
                                    subscale.key
                                }
                                className = "subscale-row" >
                                     < div className = "subscale-head" >
                                     < span className = "subscale-label" > {
                                    subscale.label
                                }
                                 <  / span >
                                 < span className = "subscale-percent" > {
                                    subscale.percent !== null && subscale.percent !== undefined
                                     ? `${subscale.percent}%`
                                     : "—"
                                }
                                 <  / span >
                                 <  / div >

                                 < div className = "subscale-raw" > {
                                    subscale.value
                                } {
                                subscale.max !== null && subscale.max !== undefined
                                 ? ` из ${subscale.max}`
                                 : ""
                            } {
                                subscale.percentile !== null
                                 ? ` • ${subscale.percentile} перцентиль`
                                 : ""
                            }
                                 <  / div > {
                                subscale.percent !== null && subscale.percent !== undefined && (
                                     < div className = "subscale-bar" >
                                         < div
                                        className = "subscale-bar-fill"
                                        style = { {
                                            width: `${subscale.percent}%`
                                        }
                                    }
                                    />
                                                                                                                                                                                                                                                                </div > )
                            }
                                 <  / div > ))
                    }
                     <  / div > )
            }
                 <  / div > )
        } {
            result.type === "subscales" && (
                 < div className = "result-subscales" > {
                    result.subscales.map((subscale) => (
                             < div key = {
                                subscale.key
                            }
                            className = "subscale-row" >
                                 < div className = "subscale-head" >
                                 < span className = "subscale-label" > {
                                subscale.label
                            }
                             <  / span >
                             < span className = "subscale-percent" > {
                                subscale.percent !== null && subscale.percent !== undefined
                                 ? `${subscale.percent}%`
                                 : "—"
                            }
                             <  / span >
                             <  / div >

                             < div className = "subscale-raw" > {
                                subscale.value
                            } {
                            subscale.max !== null && subscale.max !== undefined
                             ? ` из ${subscale.max}`
                             : ""
                        } {
                            subscale.percentile !== null
                             ? ` • ${subscale.percentile} перцентиль`
                             : ""
                        }
                             <  / div > {
                            subscale.percent !== null && subscale.percent !== undefined && (
                                 < div className = "subscale-bar" >
                                     < div
                                    className = "subscale-bar-fill"
                                    style = { {
                                        width: `${subscale.percent}%`
                                    }
                                }
                                />
                                                                                                                                                                                                    </div > )
                        }
                             <  / div > ))
                }
                 <  / div > )
        }
             < div className = "result-actions" >  < button className = "secondary-button" onClick = {
                handleDownloadDebug
            }
             > Скачать JSON <  / button >  < button className = "secondary-button" onClick = {
                handleBackToList
            }
             > К списку <  / button >  < button className = "primary-button" onClick = {
                handleRestart
            }
             > Пройти заново <  / button >  <  / div >  <  / div >  <  / div > );
    }
    if (!currentQuestion)
        return null;
    return ( < div className = "page" >  < div className = "card card--test" >  < div className = "test-header" >  < div className = "top-bar" >  < button className = "top-button" onClick = {
            handleBackToList
        }
         > К списку <  / button >  < div className = "top-bar-title" > {
            selectedQuestionnaire.title
        }
         <  / div > {}
         <  / div >  < div className = "report-meta" >  < div >  < strong > ID:  <  / strong > {
            selectedQuestionnaire.id
        }
         <  / div > {
        selectedQuestionnaire.author && ( < div >  < strong > Автор:  <  / strong > {
            selectedQuestionnaire.author
        }
             <  / div > )
    }
         <  / div > {
        selectedQuestionnaire.instructions?.text && ( < p className = "instructions-text" > {
                selectedQuestionnaire.instructions.text
            }
             <  / p > )
    }
         < div className = "scale-box" >  < div className = "scale-title" > {
            selectedQuestionnaire.instructions?.title ?? "Шкала"
        }
         <  / div > {
        selectedQuestionnaire.scale.options.map((option) => ( < div key = {
                    option.value
                }
                className = "scale-item" > {
                    option.value
                }
                — {
                option.label
            }
                 <  / div > ))
    }
         <  / div >  <  / div >  < div className = "test-content" >  < div className = "progress-text" >
            Вопрос {
            currentIndex + 1
        } {
        '\u00A0'
    }
        из {
        '\u00A0'
    } {
        visibleQuestions.length
    }
         <  / div >  < div className = "progress-bar-track" >  < div
            className = "progress-bar-fill"
            style = { {
                width: `${
                visibleQuestions.length > 0
                 ? ((currentIndex + 1) / visibleQuestions.length) * 100
                 : 0
}%`,
            }
        }
        />

                                                                                                                                                                                                                                 </div >  < div className = "question-block" >  < div className = "question-number" > {
            currentQuestion.number
        }
         <  / div >  < p className = "question-text" > {
            currentQuestion.text
        }
         <  / p >  <  / div >  < div className = "answers-block" > {
            selectedQuestionnaire.scale.options.map((option) => {
                const selected = currentAnswer === option.value;
                return ( < button
                    key = {
                        option.value
                    }
                    onClick = {
                        () => handleSelectAnswer(option.value)
                    }
                    className = {
`answer-button ${

                        selected ? "answer-button-selected" : ""

}`
                    }
                     >  < div className = "answer-value" > {
                        option.value
                    }
                     <  / div >  < div className = "answer-label" > {
                        option.label
                    }
                     <  / div >  <  / button > );
            })
        }
         <  / div >  < div className = "footer" >  < button
            onClick = {
            handleBack
        }
        disabled = {
            currentIndex === 0
        }
        className = "secondary-button" > Назад <  / button >  < div className = "counter" > {
            answeredCount
        }
        / {visibleQuestions.length}
                                                                                                                                                                                                                                                </div >  < button
        onClick = {
            handleNext
        }
        disabled = {
            currentAnswer === undefined
        }
        className = "primary-button" > {
            isLastQuestion ? "Завершить" : "Далее"
        }
         <  / button >  <  / div >  <  / div >  <  / div >  <  / div > );
}
export default App;
