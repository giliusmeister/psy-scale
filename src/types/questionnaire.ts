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
    scoring: QuestionnaireScoring;
    resultBands ?  : ResultBand[];
    norms ?  : PercentileNorms;
    resultDescription ?  : string;
};
