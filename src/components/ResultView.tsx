import type { AppLanguage, UiCopy } from "../i18n";
import type { Questionnaire } from "../types/questionnaire";
import type { CalculationResult, SubscaleCalculationResultItem } from "../utils/scoring";

type ResultViewProps = {
  questionnaire: Questionnaire;
  result: CalculationResult;
  startedAt: number | null;
  finishedAt: number | null;
  language: AppLanguage;
  copy: UiCopy;
  onDownloadDebug: () => void;
  onBackToList: () => void;
  onRestart: () => void;
};

function formatDateTime(timestamp: number | null, language: AppLanguage) {
  if (!timestamp) {
    return "-";
  }

  return new Date(timestamp).toLocaleString(language);
}

function formatDuration(
  start: number | null,
  end: number | null,
  copy: UiCopy,
) {
  if (!start || !end) {
    return "-";
  }

  const seconds = Math.floor((end - start) / 1000);
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;

  return `${min} ${copy.minutesShort} ${sec} ${copy.secondsShort}`;
}

function SubscaleResults({
  subscales,
  copy,
  showTitle = false,
}: {
  subscales: SubscaleCalculationResultItem[];
  copy: UiCopy;
  showTitle?: boolean;
}) {
  return (
    <div className="result-subscales">
      {showTitle && <div className="subscales-title">{copy.subscales}:</div>}
      {subscales.map((subscale) => (
        <div key={subscale.key} className="subscale-row">
          <div className="subscale-head">
            <span className="subscale-label">{subscale.label}</span>
            <span className="subscale-percent">
              {subscale.percent !== null && subscale.percent !== undefined
                ? `${subscale.percent}%`
                : "—"}
            </span>
          </div>

          <div className="subscale-raw">
            {subscale.value}
            {subscale.max !== null && subscale.max !== undefined
              ? ` ${copy.outOf} ${subscale.max}`
              : ""}
            {subscale.percentile !== null
              ? ` • ${subscale.percentile} ${copy.percentile}`
              : ""}
          </div>

          {subscale.percent !== null && subscale.percent !== undefined && (
            <div className="subscale-bar">
              <div
                className="subscale-bar-fill"
                style={{ width: `${subscale.percent}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ResultView({
  questionnaire,
  result,
  startedAt,
  finishedAt,
  language,
  copy,
  onDownloadDebug,
  onBackToList,
  onRestart,
}: ResultViewProps) {
  const interpretationBasis =
    result.type === "sum" && "interpretationBasis" in questionnaire.scoring
      ? questionnaire.scoring.interpretationBasis ?? "total"
      : "total";

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">{questionnaire.title}</h1>
        <h2 className="subtitle">{copy.result}</h2>

        <div className="result-info">
          <div>
            <strong>ID:</strong> {questionnaire.id}
          </div>
          {questionnaire.author && (
            <div>
              <strong>{copy.author}:</strong> {questionnaire.author}
            </div>
          )}
          <div>
            <strong>{copy.questions}:</strong> {questionnaire.questions.length}
          </div>
          {startedAt && finishedAt && (
            <>
              <div>
                <strong>{copy.startedAt}:</strong> {formatDateTime(startedAt, language)}
              </div>
              <div>
                <strong>{copy.finishedAt}:</strong> {formatDateTime(finishedAt, language)}
              </div>
              <div>
                <strong>{copy.duration}:</strong>{" "}
                {formatDuration(startedAt, finishedAt, copy)}
              </div>
            </>
          )}
        </div>

        {result.type === "sum" && (
          <div className="result-main">
            <div className="result-score">
              {interpretationBasis === "average" && result.average !== null
                ? `${copy.averageScore}: ${result.average.toFixed(2)}`
                : `${result.total} ${copy.points}`}
            </div>

            {result.average !== null && interpretationBasis !== "average" && (
              <div className="result-average">
                {copy.averageScore}: {result.average.toFixed(2)}
              </div>
            )}

            {result.level && <div className="result-level">{result.level.label}</div>}

            {interpretationBasis === "average" && (
              <div className="result-note">{copy.averageInterpretation}</div>
            )}

            {result.percentile !== null && result.percentile !== undefined && (
              <div className="percentile-block">
                <div className="percentile-scale-title">
                  {copy.samplePosition}: {result.percentile}
                </div>

                <div className="percentile-scale">
                  <div className="percentile-scale-track">
                    <div
                      className="percentile-scale-fill"
                      style={{ width: `${result.percentile}%` }}
                    />
                  </div>

                  <div className="percentile-scale-labels">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            )}

            {!result.level &&
              (result.percentile === null || result.percentile === undefined) && (
                <div className="result-note">
                  {questionnaire.resultDescription ?? copy.noFixedBands}
                </div>
              )}

            {result.subscales && result.subscales.length > 0 && (
              <SubscaleResults subscales={result.subscales} copy={copy} showTitle />
            )}
          </div>
        )}

        {result.type === "subscales" && (
          <SubscaleResults subscales={result.subscales} copy={copy} />
        )}

        {result.type !== "sum" && questionnaire.resultDescription && (
          <div className="result-description">{questionnaire.resultDescription}</div>
        )}

        <div className="result-actions">
          <button className="secondary-button" onClick={onDownloadDebug}>
            {copy.downloadJson}
          </button>
          <button className="secondary-button" onClick={onBackToList}>
            {copy.backToList}
          </button>
          <button className="primary-button" onClick={onRestart}>
            {copy.restart}
          </button>
        </div>
      </div>
    </div>
  );
}
