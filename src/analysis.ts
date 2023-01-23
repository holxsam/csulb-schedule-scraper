import { analyzeRawData, analyzeParsedData } from "./scripts/schedule/analysis";

export const startAnalysis = () => {
  analyzeParsedData();
};

startAnalysis();
