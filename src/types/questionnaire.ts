export type ScoreBasis = "total" | "average";
export type PercentileBasis = ScoreBasis | "none";

export type QuestionnaireUI = {
    inputMode ?  : "buttons" | "slider" | "mixed";
};

export type ScaleOption = {
    value: number;
    label: string;
};

export type Scale = {
    type: string;
    min ?  : number;
    max ?  : number;
    options: ScaleOption[];
    reverseScoring ?  : Record < string,
    number > ;
};

export type VisibilityOperator =
     | "equals"
     | "notEquals"
     | "in"
     | "notIn"
     | "greaterThan"
     | "greaterThanOrEqual"
     | "lessThan"
     | "lessThanOrEqual";

export type VisibilityRule = {
    dependsOn: string; // question.id
    operator: VisibilityOperator;
    value: number | string | Array < number | string > ;
};

export type Question = {
    id: string;
    number: number | string;
    text: string;
    trait ?  : string; // legacy / reserved for future use (not used in scoring)
    reverse ?  : boolean;
    visibility ?  : VisibilityRule;
    scorable ?  : boolean; // default true
    options ?  : ScaleOption[];
};

export type ResultBand = {
    key: string;
    min: number;
    max: number;
    label: string;
};

export type QuestionnaireInstructions = {
    title ?  : string;
    text ?  : string;
    reverseNote ?  : string;
};

export type SubscaleDefinition = {
    key: string;
    label: string;
    items: number[];
    aggregation ?  : "sum" | "mean";
    min ?  : number;
    max ?  : number;
    derivedMetrics ?  : SubscaleDerivedMetrics;
};

export type DomainDefinition = {
    key: string;
    label: string;
    subscales: string[];
    aggregation ?  : "sum" | "mean";
};

export type FlagRule = {
    id: string;
    scope: "subscale" | "domain";
    metric: string;
    operator: ">" | ">=" | "<" | "<=" | "==" | "!=";
    value: number;
    severity ?  : "info" | "elevated" | "high" | "critical";
    title: string;
    message ?  : string;
};

export type SubscaleDerivedMetricBand = {
    key: string;
    min: number;
    max: number;
    label: string;
};

export type SubscaleDerivedMetricConfig = {
    type ?  : "sum" | "mean" | "percentage" | "count" | "bands";
    source ?  : string;
    formula ?  : string;
    description ?  : string;
    countValues ?  : number[];
    label ?  : string;
    threshold ?  : number;
    min ?  : number;
    max ?  : number;
    precision ?  : number;
    flagThreshold ?  : number;
    bands ?  : SubscaleDerivedMetricBand[];
};

export type SubscaleDerivedMetrics = Record < string, SubscaleDerivedMetricConfig > ;

export type SubscaleDerivedMetricDefinition = {
    key: string;
    label: string;
    type: "normalized_percent" | "strong_answer_sum" | "strong_answer_share";
    threshold ?  : number;
    min ?  : number;
    max ?  : number;
    precision ?  : number;
    flagThreshold ?  : number;
    bands ?  : SubscaleDerivedMetricBand[];
};

export type ScoringConfig = {
    method: "sum" | "subscales_sum" | "sum_with_subscales";
    trait?: string;
    directItems?: number[];
    reverseItems?: number[];
    minScore?: number;
    maxScore?: number;
    showAverage?: boolean;
    interpretationMode?: "none" | "bands";
    percentileBasis?: PercentileBasis;
    interpretationBasis?: ScoreBasis;
    subscales?: SubscaleDefinition[];
};

export type SumScoring = {
    method: "sum";
    trait: string;
    directItems: number[];
    reverseItems?: number[];
    minScore: number;
    maxScore: number;
    higherMeans?: string;
    showAverage?: boolean;
    interpretationMode?: "bands" | "none";
    percentileBasis?: PercentileBasis;
    interpretationBasis?: ScoreBasis;
};

export type SubscalesSumScoring = {
    method: "subscales_sum";
    subscales: SubscaleDefinition[];
    subscaleDerivedMetrics ?  : SubscaleDerivedMetricDefinition[];
};

export type SumWithSubscalesScoring = {
    method: "sum_with_subscales";
    trait: string;
    directItems: number[];
    reverseItems: number[];
    minScore: number;
    maxScore: number;
    higherMeans: string;
    showAverage?: boolean;
    interpretationMode?: "bands" | "none";
    percentileBasis?: PercentileBasis;
    interpretationBasis?: ScoreBasis;
    subscales: SubscaleDefinition[];
    subscaleDerivedMetrics ?  : SubscaleDerivedMetricDefinition[];
};

export type QuestionnaireScoring =
     | SumScoring
     | SubscalesSumScoring
     | SumWithSubscalesScoring;

export type PercentileNorms = {
    type: "percentiles";
    subscales: Record < string,
    Record < string,
    number >> ;
};

export type Questionnaire = {
    id: string;
    title: string;
    description: string;
    language: string;
    author ?  : string;
    category ?  : string;
    estimatedMinutes ?  : number;
    instructions ?  : QuestionnaireInstructions;
    ui ?  : QuestionnaireUI;
    scale: Scale;
    questions: Question[];
    domains ?  : DomainDefinition[];
    flags ?  : FlagRule[];
    scoring: QuestionnaireScoring;
    resultBands ?  : ResultBand[];
    norms ?  : PercentileNorms;
    resultDescription ?  : string;
};
