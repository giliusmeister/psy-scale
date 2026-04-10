export type ScaleOption = {
  value: number;
  label: string;
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
  value: number | string | Array<number | string>;
};

export type Question = {
  id: string;
  number: number | string;
  text: string;
  trait?: string;
  reverse?: boolean;

  // Новое:
  visibility?: VisibilityRule;
  scorable?: boolean; // по умолчанию true
};

export type ResultBand = {
  key: string;
  min: number;
  max: number;
  label: string;
};

export type QuestionnaireInstructions = {
  title?: string;
  text?: string;
  reverseNote?: string;
};

export type SumScoring = {
  method: "sum";
  trait: string;
  directItems: number[];
  reverseItems: number[];
  minScore: number;
  maxScore: number;
  higherMeans: string;
  showAverage?: boolean;
  interpretationMode?: "bands" | "none";
  percentileBasis?: "total" | "average";
};

export type SubscaleDefinition = {
  key: string;
  label: string;
  items: number[];
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
  percentileBasis?: "total" | "average";
  subscales: SubscaleDefinition[];
};

export type QuestionnaireScoring =
  | SumScoring
  | SubscalesSumScoring
  | SumWithSubscalesScoring;

export type SubscaleDefinition = {
  key: string;
  label: string;
  items: number[];
};

export type SubscalesSumScoring = {
  method: "subscales_sum";
  subscales: SubscaleDefinition[];
};

export type QuestionnaireScoring = SumScoring | SubscalesSumScoring;

export type PercentileNorms = {
  type: "percentiles";
  subscales: Record<string, Record<string, number>>;
};

export type Questionnaire = {
  id: string;
  title: string;
  description: string;
  author?: string;
  category?: string;
  estimatedMinutes?: number;
  instructions?: QuestionnaireInstructions;
  scale: {
    type: string;
    min?: number;
    max?: number;
    options: ScaleOption[];
    reverseScoring?: Record<string, number>;
  };
  questions: Question[];
  scoring: QuestionnaireScoring;
  resultBands?: ResultBand[];
  norms?: PercentileNorms;
};