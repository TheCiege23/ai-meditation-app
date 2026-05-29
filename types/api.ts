export type ApiErrorResponse = {
  error: string;
  message?: string;
};

export type RateLimitResponseBody = {
  error: "Too many requests";
  message: string;
  limit: number;
  remaining: number;
  reset: number;
};

export type UsageLimitResponseBody = {
  error: "Usage limit reached";
  message: string;
  tier: "free" | "premium";
};

export type DailyHoroscopePayload = {
  sign: string;
  date: string;
  overview: string;
  energy?: string;
  love?: string;
  focus?: string;
  rest?: string;
  mood?: string;
  luckyColor?: string;
  luckyNumber?: string;
  source: "freeastroapi" | "mock";
  /** Label for the time range, e.g. "Today", "This week" */
  rangeLabel?: string;
  /** Requested range: day | week | month | 3m | 6m | 12m */
  range?: string;
};