import path from "path";
import fs from "fs";
import { ClassSection } from "./schedule/types";
import { outputToFile } from "../utils/utils";

const resolveToScheduleUrl = (filename: string) =>
  path.resolve(__dirname, path.join("../schedules", filename));

const getScheduleFilenames = () => {
  const url = path.resolve(__dirname, "../schedules");
  return fs.readdirSync(url).filter((file) => path.extname(file) === ".json");
};

const start = () => {
  const filenames = getScheduleFilenames();

  const data = filenames.flatMap((filename) => {
    const fileBuffer = fs.readFileSync(resolveToScheduleUrl(filename));

    const fileData = JSON.parse(fileBuffer.toString()) as ClassSection[];

    console.log(filename, fileData.length);

    return fileData;
  });

  console.log(data.length);

  // const reduce = data.map(
  //   (course) =>
  //     `${course.subject_abbr.padEnd(10, " ")} | ${course.subject_title}`
  // );
  // const set = new Set(reduce);
  // const output = [...set].sort((a, b) => a.localeCompare(b));
  // outputToFile(output, "../output/list-of-deparments.json");

  // console.log(data.find((c) => c.subject_abbr === "Mathematics Educ"));

  // // ---------------------------------------------------------------
  // const reduce = data.map((c) => {
  //   const abbr = c.subject_abbr.padEnd(6, " ");
  //   const course_num = c.course_number.padEnd(6, " ");
  //   const course_title = c.course_title.padEnd(30, " ");
  //   const units = c.units.padEnd(6, " ");

  //   return `${abbr} | ${course_num} | ${course_title} | ${units}`;
  // });
  // const set = new Set(reduce);
  // const output = [...set].sort((a, b) => a.localeCompare(b));
  // outputToFile(output, "../output/courses.json");
  // ---------------------------------------------------------------
  const reduce = data.map((c) => {
    const fullname = `${c.instructor.last_name} ${c.instructor.first_name}`;
    const instructor = fullname.padEnd(25, " ");
    const abbr = c.subject_abbr.padEnd(6, " ");

    return `${instructor} | ${abbr} `;
  });
  const set = new Set(reduce);
  const output = [...set].sort((a, b) => a.localeCompare(b));
  outputToFile(output, "../output/instructors.json");
};

start();
