// Shared shapes for the reflection flow and stored history.

export type Verse = { reference: string; text: string; translation: string };

export type FactsResult = {
  facts: string[];
  assumptions: string[];
  note: string;
  verse: Verse;
};

export type DecisionOption = {
  name: string;
  considerations: string[];
  tradeoffs: string;
};

export type DecisionResult = {
  dilemma: string;
  options: DecisionOption[];
  questions_to_pray: string[];
  verse: Verse;
  note: string;
};

/** One complete (or in-progress) walk through the reflect steps. */
export type Reflection = {
  id: string;
  createdAt: number;
  dump: string;
  facts?: FactsResult;
  decision?: DecisionResult;
};
