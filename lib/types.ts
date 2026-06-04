export type Verse = { reference: string; text: string; translation: string };

export type FactsResult = {
  title: string;
  facts: string[];
  assumptions: string[];
  note: string;
  verse?: Verse;
};

export type DecisionOption = {
  name: string;
  considerations: string[];
  tradeoffs: string;
};

export type DecisionRecommendation = {
  choice: string;
  reason: string;
};

export type DecisionResult = {
  dilemma: string;
  options: DecisionOption[];
  recommendation: DecisionRecommendation;
  questions_to_pray: string[];
  verse?: Verse;
  note: string;
};

export type Complexity = "simple" | "moderate" | "complex";

export type StepKey = "collect" | "sort" | "decide";

export type StepProgress = { active: StepKey; done: Record<StepKey, boolean> };

export type Reflection = {
  id: string;
  createdAt: number;
  dump: string;
  complexity?: Complexity;
  facts?: FactsResult;
  decision?: DecisionResult;
};
