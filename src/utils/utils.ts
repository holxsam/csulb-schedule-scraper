import path from "path";
import fs from "fs";
// import { MatchUps } from "./types";

export const outputToFile = (data: any, filename: string) => {
  // // Create / overwrite empty json file for results.
  // fs.closeSync(fs.openSync("./scripts/schedule.json", "w"));
  try {
    const stringifiedData = JSON.stringify(data);
    const url = path.resolve(__dirname, filename);

    fs.writeFileSync(url, stringifiedData);
    // fs.appendFileSync(path.resolve(__dirname, filename), stringifiedData);

    return url;
  } catch (err) {
    console.error("Error writing into Json.");
    // return "";
  }
};
