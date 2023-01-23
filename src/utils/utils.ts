import path from "path";
import fs from "fs-extra";

export const outputToFileRaw = (data: any, filename: string) => {
  try {
    const url = path.resolve(filename);
    fs.outputFileSync(url, data);

    return url;
  } catch (err) {
    console.error("Error with outputToFile()");
  }
};

export const outputToFile = (data: any, filename: string) => {
  try {
    const stringifiedData = JSON.stringify(data);
    outputToFileRaw(stringifiedData, filename);
  } catch (e) {
    console.error("Error stringifying data");
    console.log(e);
  }
};
