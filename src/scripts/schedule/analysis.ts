import path from "path";
import fs from "fs-extra";
import {
  DatabaseClassSection,
  ParsedClassSection,
  TermSchedule,
} from "./types";
import { outputToFile } from "../../utils/utils";
import { validKeyMap } from "./parser";
import { convertParsedDataToDatabaseForm } from "./database";

const dataSrcURL = "./src/output/schedules/analysis";

const getJsonFilenames = (directory: string) => {
  const url = path.resolve(directory);
  return fs
    .readdirSync(url)
    .filter((file) => path.extname(file) === ".json")
    .map((file) => path.resolve(path.join(directory, file)));
};

export const getParsedData = (): ParsedClassSection[] => {
  const parsedDataFilepaths = getJsonFilenames("./src/output/schedules/parsed");

  return parsedDataFilepaths.flatMap((filename) => {
    const fileBuffer = fs.readFileSync(filename);
    const fileData = JSON.parse(fileBuffer.toString()) as ParsedClassSection[];
    return fileData;
  });
};

export const getRawData = (): TermSchedule[] => {
  const rawDataFilepaths = getJsonFilenames("./src/output/schedules/raw");

  return rawDataFilepaths.map((filename) => {
    const fileBuffer = fs.readFileSync(filename);
    const fileData = JSON.parse(fileBuffer.toString()) as TermSchedule;
    return fileData;
  });
};

export const analyzeRawData = () => {
  const data = getRawData();

  const isTypeKey = validKeyMap["section_type"];
  const types = data.flatMap(({ departments }) =>
    departments.flatMap(({ courses }) =>
      courses.flatMap(({ groups }) =>
        groups.flatMap(({ sections }) =>
          sections.flatMap((section) => {
            const sp = section.find(({ raw_key }) => isTypeKey(raw_key));
            return sp ? sp.value : "None";
          })
        )
      )
    )
  );

  const uniqueTypes = [...new Set(types)];

  console.log(uniqueTypes);
};

export const analyzeDatabaseLengths = (data: DatabaseClassSection[]) => {
  const lengths: { [key: string]: number[] } = {
    semester: [],
    dept_abbr: [],
    dept_title: [],
    course_number: [],
    course_title: [],
    units: [],
    group_id: [],
    section_type: [],
    section_number: [],
    class_number: [],
    instructor_fn: [],
    instructor_ln: [],
    days: [],
    location: [],
    comment: [],
  };

  data.forEach((i) => {
    lengths.semester.push(i.semester.length);
    lengths.dept_abbr.push(i.dept_abbr.length);
    lengths.dept_title.push(i.dept_title.length);
    lengths.course_number.push(i.course_number.length);
    lengths.course_title.push(i.course_title.length);
    lengths.units.push(i.units.length);
    lengths.group_id.push(i.group_id.length);
    lengths.section_type.push(i.section_type.length);
    lengths.section_number.push(i.section_number.length);
    lengths.class_number.push(i.class_number.length);
    lengths.instructor_fn.push(i.instructor_fn.length);
    lengths.instructor_ln.push(i.instructor_ln.length);
    lengths.days.push(i.days.length);
    lengths.location.push(i.location.length);
    lengths.comment.push(i.comment.length);
  });

  return Object.entries(lengths).map(([key, len_arr]) => {
    const uniques = [...new Set(len_arr)];
    return { key, min: Math.min(...uniques), max: Math.max(...uniques) };
  });
};

export const analyzeParsedData = () => {
  const data = getParsedData();

  const dbData = convertParsedDataToDatabaseForm(data);

  // const sectionTypes = data.map(({ section_type }) => section_type);
  // const uniqueSectionTypes = [...new Set(sectionTypes)];
  // outputToFile(
  //   uniqueSectionTypes,
  //   path.join(dataSrcURL, "unique-section_types.json")
  // );

  // const emptySectionTypes = data.filter(
  //   ({ section_type }) => section_type === ""
  // );
  // outputToFile(
  //   emptySectionTypes,
  //   path.join(dataSrcURL, "empty_section_type.json")
  // );

  // const comments = emptySectionTypes.map((v) => v.comment);
  // const uniqueComments = [...new Set(comments)];
  // outputToFile(uniqueComments, path.join(dataSrcURL, "unique-comments.json"));

  // const commentLengths = data.map((v) => v.comment.length);
  // const uniqueComments = [...new Set(commentLengths)];
  // const maxCommentLength = Math.max(...uniqueComments);
  // console.log(maxCommentLength);

  // const uniqueComments = [...new Set(dept_abbr_lengths)];
  // const maxCommentLength = Math.max(...uniqueComments);
  // console.log(maxCommentLength);

  // const d = data.filter((v) => v.comment.length > 600);
  // console.log(d);

  // console.log(analyzeDatabaseLengths(dbData));

  // console.log(data.length); // 250411

  // console.log(
  //   data.filter((i) => i.comment.includes("CNSM permission required"))
  // );
  const days = data.flatMap((v) => {
    return v.days.map((d) => d);
  });
  const uniqueDays = [...new Set(days)];
  // const maxCommentLength = Math.max(...uniqueDays);
  console.log(uniqueDays);

  // outputToFile(()=>)
};
