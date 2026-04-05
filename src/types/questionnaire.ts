export type ScaleOption = {
  value: number;
  label: string;
};

export type Question = {
  id: string;
  number: number;
  text: string;
  trait: string;
  reverse: boolean;
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

export type QuestionnaireScoring = {
  method: "sum";
  trait: string;
  directItems: number[];
  reverseItems: number[];
  minScore: number;
  maxScore: number;
  higherMeans: string;
  showAverage?: boolean;
  interpretationMode?: "bands" | "none";
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
    min: number;
    max: number;
    options: ScaleOption[];
    reverseScoring: Record<string, number>;
  };
  questions: Question[];
  scoring: QuestionnaireScoring;
  resultBands?: ResultBand[];
};