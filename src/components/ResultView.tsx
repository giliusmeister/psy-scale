import { useRef } from "react";
import type { AppLanguage, UiCopy } from "../i18n";
import type { Questionnaire } from "../types/questionnaire";
import type {
  CalculationResult,
  DomainCalculationResultItem,
  SubscaleCalculationResultItem,
} from "../utils/scoring";

type ResultViewProps = {
  questionnaire: Questionnaire;
  result: CalculationResult;
  startedAt: number | null;
  finishedAt: number | null;
  language: AppLanguage;
  copy: UiCopy;
  onDownloadDebug: () => void;
  onImportAnswersJson: (file: File) => void;
  onBackToList: () => void;
  onRestart: () => void;
};

function formatDateTime(timestamp: number | null, language: AppLanguage) {
  if (!timestamp) {
    return "-";
  }

  return new Date(timestamp).toLocaleString(language);
}

function DomainResults({
  domains,
  copy,
}: {
  domains: DomainCalculationResultItem[];
  copy: UiCopy;
}) {
  const getFlagClassName = (severity: string) =>
    `flag-badge flag-badge--${severity}`;

  return (
    <div className="result-subscales">
      <div className="subscales-title">{copy.domains}:</div>
      {domains.map((domain) => (
        <div key={domain.key} className="subscale-row">
          <div className="subscale-head">
            <span className="subscale-label">{domain.label}</span>
            <span className="subscale-percent">
              {formatPercentValue(domain.averagePercent)}% •{" "}
              {getSeverityLabel(domain.averagePercent, copy)}
            </span>
          </div>
          <div className="subscale-raw">
            {copy.averageIntensity}: {formatPercentValue(domain.averagePercent)}%
          </div>
          <div className="subscale-raw">
            {domain.subscaleCount} {copy.subscalesCount}
          </div>
          {domain.flags && domain.flags.length > 0 && (
            <div className="flag-list">
              {domain.flags.map((flag) => (
                <span key={flag.id} className={getFlagClassName(flag.severity)}>
                  {flag.title}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
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

function formatMetricValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return Number(value.toFixed(2)).toString();
}

function formatPercentValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Number(value.toFixed(1)).toString();
}

function getSeverityLabel(percent: number, copy: UiCopy): string {
  if (percent >= 75) return copy.severityVeryHigh;
  if (percent >= 60) return copy.severityHigh;
  if (percent >= 40) return copy.severityModerate;
  return copy.severityLow;
}

function TopSchemas({
  domains,
  copy,
}: {
  domains: DomainCalculationResultItem[];
  copy: UiCopy;
}) {
  const top = [...domains]
    .map((domain) => ({
      ...domain,
      resolvedPercent:
        typeof domain.averagePercent === "number" && Number.isFinite(domain.averagePercent)
          ? domain.averagePercent
          : domain.value,
      displayPercent:
        typeof domain.averagePercent === "number" && Number.isFinite(domain.averagePercent)
          ? Number(domain.averagePercent.toFixed(2))
          : Number(domain.value.toFixed(2)),
      severityLabel: getSeverityLabel(
        typeof domain.averagePercent === "number" && Number.isFinite(domain.averagePercent)
          ? domain.averagePercent
          : domain.value,
        copy,
      ),
    }))
    .sort((a, b) => b.displayPercent - a.displayPercent)
    .slice(0, 3);

  return (
    <div className="top-schemas">
      <div className="subscales-title">{copy.topSchemas}:</div>
      {top.map((domain) => (
        <div key={domain.key} className="top-schema-row">
          <span className="top-schema-label">{domain.label}</span>
          <span className="top-schema-value">{formatPercentValue(domain.displayPercent)}%</span>
        </div>
      ))}
    </div>
  );
}

function TopSubscales({
  subscales,
  copy,
}: {
  subscales: SubscaleCalculationResultItem[];
  copy: UiCopy;
}) {
  const top = [...subscales]
    .filter((subscale) => subscale.percent !== null && subscale.percent !== undefined)
    .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))
    .slice(0, 3);

  if (top.length === 0) {
    return null;
  }

  return (
    <div className="top-schemas">
      <div className="subscales-title">{copy.topSubscales}:</div>
      {top.map((subscale) => (
        <div key={subscale.key} className="top-schema-row">
          <span className="top-schema-label">{subscale.label}</span>
          <span className="top-schema-value">{formatPercentValue(subscale.percent ?? 0)}%</span>
        </div>
      ))}
    </div>
  );
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
  const getFlagClassName = (severity: string) =>
    `flag-badge flag-badge--${severity}`;

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

          {subscale.derivedMetrics && subscale.derivedMetrics.length > 0 && (
            <div className="subscale-derived-metrics">
              {subscale.derivedMetrics.map((metric) => (
                <div key={metric.key} className="subscale-derived-row">
                  <span className="subscale-derived-label">{metric.label}</span>
                  <span className="subscale-derived-value">
                    {metric.bandLabel ? (
                      <>
                        {metric.bandLabel}
                        <br />
                        {copy.rawScore}: {formatMetricValue(metric.value)}
                        {subscale.max !== null && subscale.max !== undefined
                          ? `/${formatMetricValue(subscale.max)}`
                          : ""}
                      </>
                    ) : (
                      <>
                        {formatMetricValue(metric.value)}
                        {metric.isPercent ? "%" : ""}
                      </>
                    )}
                    {metric.flagged ? ` ? ${copy.thresholdReached}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
          {subscale.flags && subscale.flags.length > 0 && (
            <div className="flag-list">
              {subscale.flags.map((flag) => (
                <span key={flag.id} className={getFlagClassName(flag.severity)}>
                  {flag.title}
                </span>
              ))}
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
  onImportAnswersJson,
  onBackToList,
  onRestart,
}: ResultViewProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  function handleImportClick() {
    importInputRef.current?.click();
  }

  function handleImportFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    onImportAnswersJson(file);
    event.target.value = "";
  }

  const interpretationBasis =
    result.type === "sum" && "interpretationBasis" in questionnaire.scoring
      ? questionnaire.scoring.interpretationBasis ?? "total"
      : "total";

  return (
    <div className="page">
      <div className="card card--result">
        <h1 className="title">{questionnaire.title}</h1>
        <h2 className="subtitle">{copy.result}</h2>

        <div className="result-scroll">
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

              {result.domains && result.domains.length > 0 && (
                <TopSchemas domains={result.domains} copy={copy} />
              )}
              {result.subscales && result.subscales.length > 0 && (
                <TopSubscales subscales={result.subscales} copy={copy} />
              )}
              {result.subscales && result.subscales.length > 0 && (
                <SubscaleResults subscales={result.subscales} copy={copy} showTitle />
              )}
              {result.domains && result.domains.length > 0 && (
                <DomainResults domains={result.domains} copy={copy} />
              )}
            </div>
          )}

          {result.type === "subscales" && (
            <>
              {result.domains && result.domains.length > 0 && (
                <TopSchemas domains={result.domains} copy={copy} />
              )}
              {result.subscales && result.subscales.length > 0 && (
                <TopSubscales subscales={result.subscales} copy={copy} />
              )}
              <SubscaleResults subscales={result.subscales} copy={copy} />
              {result.domains && result.domains.length > 0 && (
                <DomainResults domains={result.domains} copy={copy} />
              )}
            </>
          )}

          {result.type !== "sum" && questionnaire.resultDescription && (
            <div className="result-description">{questionnaire.resultDescription}</div>
          )}
        </div>

        <div className="result-actions">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={handleImportFileChange}
          />
          <button className="secondary-button" onClick={handleImportClick}>
            {copy.importAnswersJson}
          </button>
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

