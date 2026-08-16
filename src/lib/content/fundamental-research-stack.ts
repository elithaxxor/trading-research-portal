import "server-only";

export type FundamentalResearchStackFile = {
  description: string;
  downloadName: string;
  fileName: string;
  id: string;
  title: string;
};

export const fundamentalResearchStackFiles = [
  {
    description:
      "A complete prompt library for company fundamentals, filings, earnings quality, valuation, catalysts, risks, and peer comparison.",
    downloadName: "Fundamental_Analysis_Prompt_Suite.txt",
    fileName: "fundamental-analysis-prompt-suite.txt",
    id: "prompt-suite",
    title: "Fundamental Analysis Prompt Suite",
  },
  {
    description:
      "The expanded suite with P/E, EPS, PEG, and sector peer-position grading integrated into the core research workflow.",
    downloadName:
      "Fundamental_Analysis_Prompt_Suite_v2_PE_EPS_PEG_Peer_Grade.txt",
    fileName: "fundamental-analysis-prompt-suite-v2-pe-eps-peg-peer-grade.txt",
    id: "prompt-suite-v2",
    title: "Fundamental Analysis Prompt Suite v2",
  },
  {
    description:
      "A focused add-on for valuation overlays, earnings trends, growth-adjusted valuation, and relative positioning against sector peers.",
    downloadName: "Research_Stack_PE_EPS_PEG_Peer_Grade_Addon.txt",
    fileName: "research-stack-pe-eps-peg-peer-grade-addon.txt",
    id: "valuation-addon",
    title: "P/E, EPS, PEG + Peer Grade Add-On",
  },
] as const satisfies readonly FundamentalResearchStackFile[];

export function getFundamentalResearchStackFile(id: string) {
  return fundamentalResearchStackFiles.find((file) => file.id === id) ?? null;
}
