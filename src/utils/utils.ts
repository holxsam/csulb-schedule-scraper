import path from "path";
import fs from "fs-extra";

export const outputToFile = (data: any, filename: string) => {
  try {
    const stringifiedData = JSON.stringify(data);
    const url = path.resolve(filename);

    fs.outputFileSync(url, stringifiedData);

    return url;
  } catch (err) {
    console.error("Error with outputToFile()");
  }
};
