export type FeedbackCategory = "bug" | "improvement";

export type FeedbackInput = {
  idempotencyKey: string;
  category: FeedbackCategory;
  description: string;
  reproduction: string | null;
  expected: string | null;
  replyEmail: string | null;
  pathname: string | null;
  clientCommit: string | null;
};

export type RatingInput = { stars: number; token: string; revision: number };
export type RatingDistribution = Record<"1" | "2" | "3" | "4" | "5", number>;
export type RatingSummary = {
  average: number | null;
  ratingCount: number;
  distribution: RatingDistribution;
  asOf: string;
};
