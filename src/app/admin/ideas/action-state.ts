export type TradingIdeaActionState = {
  fieldErrors?: Record<string, string>;
  message?: string;
  status: "idle" | "error";
};

export const initialTradingIdeaActionState: TradingIdeaActionState = {
  status: "idle",
};
