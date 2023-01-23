import { getRawData } from "./scripts/schedule/analysis";
import { formatAndFlattenData } from "./scripts/schedule/parser";
import { outputToFile } from "./utils/utils";

export const startParse = () => {
  const label = "Total Parse Time";
  console.time(label);

  const rawData = getRawData();

  rawData.forEach((term) => {
    const { year, semester } = term;
    const parsedData = formatAndFlattenData(term);
    const parsedPath = `./src/output/schedules/parsed/PARSED_${year}_${semester}.json`;
    outputToFile(parsedData, parsedPath);
  });

  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  console.timeEnd(label);
  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
};

startParse();
