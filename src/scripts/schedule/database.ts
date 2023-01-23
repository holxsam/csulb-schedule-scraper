import { outputFile } from "fs-extra";
import { outputToFileRaw } from "../../utils/utils";
import { getParsedData } from "./analysis";
import { DatabaseClassSection, ParsedClassSection } from "./types";

export const getInsertKeys = (data: DatabaseClassSection) =>
  Object.keys(data)
    .map((key) => key)
    .join(",");

export const getInsertValues = (data: DatabaseClassSection) =>
  Object.values(data)
    .map((value) => {
      if (typeof value === "number") return value;
      else return `"${value}"`;
    })
    .join(",");

export const getIndividualSQLInserts = (data: DatabaseClassSection[]) => {
  const strings = data.map((i) => {
    const keys = getInsertKeys(i);
    const values = getInsertValues(i);
    return `insert into public.ClassSections (${keys}) values(${values});`;
  });

  outputToFileRaw(strings.join("\n"), "./src/sql/generated-inserts.sql");
};

export const getMultiSQLInserts = (data: DatabaseClassSection[]) => {
  if (data.length < 1) return;
  const keys = getInsertKeys(data[0]);

  const values = data
    .filter((i) => i.semester === "Fall" && i.year === 2020)
    .map((i) => `(${getInsertValues(i)})`);

  const insert = `
  insert into public.ClassSections (${keys})\n
  values \n
  ${values.join(",\n")};`;

  outputToFileRaw(insert, "./src/sql/inserts_Fall_2020.sql");
};

export const generateCSV = (data: DatabaseClassSection[]) => {
  if (data.length < 1) return;
  const header = getInsertKeys(data[0]);
  const values = data.map((i) => `${getInsertValues(i)}`);
  const csv = [header, ...values].join("\n");

  outputToFileRaw(csv, "./src/output/schedules/all/data.csv");
};

export const replaceSingleQuote = (str: string) => str.replace(/\'/g, "''");
export const removeDoubleQuote = (str: string) => str.replace(/\"/g, "");
export const removeNewLine = (str: string) => str.replace(/\n/g, "");
export const removeCarriageReturn = (str: string) => str.replace(/\r/g, "");

export const clean = (str: string) =>
  removeDoubleQuote(removeNewLine(removeCarriageReturn(str)));

export const convertParsedDataToDatabaseForm = (
  parsedData: ParsedClassSection[]
): DatabaseClassSection[] => {
  const sq = clean;
  return parsedData.map((row) => {
    return {
      uid: crypto.randomUUID(),
      semester: row.semester,
      year: row.year,

      dept_abbr: row.dept_abbr,
      dept_title: sq(row.dept_title),

      course_number: row.course_number,
      course_title: sq(row.course_title),

      units: row.units,
      group_id: row.group_id,

      section_type: row.section_type,
      section_number: row.section_number,
      class_number: row.class_number,

      instructor_fn: sq(row.instructor.first_name),
      instructor_ln: sq(row.instructor.last_name),

      days: row.days.join(","),
      time_start: row.time.start.h24.rawMinutes,
      time_end: row.time.end.h24.rawMinutes,
      location: sq(row.location),

      comment: sq(row.comment),
    };
  });
};
