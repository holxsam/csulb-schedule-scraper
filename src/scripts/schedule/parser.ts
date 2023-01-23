import { nanoid } from "nanoid";
import {
  ClassDay,
  ParsedClassSection,
  ClassTime,
  SectionType,
  RawValidSection,
  RawDepartment,
  Semester,
  RawSectionPiece,
  RawGroup,
  RawCourse,
  TermSchedule,
  Instructor,
  isSectionType,
  validClassDays,
  ValidSectionKey,
} from "./types";

export const removeLetters = (str: string) => str.replace(/\D/g, "");

export const getCatalogLink = (semester: Semester, year: number) =>
  `http://web.csulb.edu/depts/enrollment/registration/class_schedule/${semester}_${year}/By_Subject/index.html`;

export const generateSemYearLinks = (
  startYear: number,
  endYear: number,
  semesters?: Semester[]
) => {
  const catalogs = generateSemYear(startYear, endYear, semesters);

  return catalogs.map(({ semester, year }) => ({
    semester,
    year,
    link: getCatalogLink(semester, year),
  }));
};

export const generateSemYear = (
  startYear: number,
  endYear: number,
  semesters?: Semester[]
) => {
  semesters = semesters ?? ["Spring", "Summer", "Fall", "Winter"];
  const links: { semester: Semester; year: number }[] = [];

  let year = startYear;
  while (year <= endYear) {
    semesters.forEach((sem) => {
      links.push({ semester: sem, year });
    });
    year++;
  }

  return links;
};

type VerifyFn = (str: string) => boolean;

type ValidKeyConditions = {
  key: ValidSectionKey;
  verify: VerifyFn;
};

export const incl = (a: string, b: string) =>
  a.toLowerCase().includes(b.toLowerCase());

export const validKeyMap: Record<ValidSectionKey, VerifyFn> = {
  section_number: (str: string) => incl(str, "sec"),
  class_number: (str: string) => incl(str, "class #"),
  section_type: (str: string) => incl(str, "type"),
  days: (str: string) => incl(str, "day"),
  time: (str: string) => incl(str, "time"),
  location: (str: string) => incl(str, "location"),
  instructor: (str: string) => incl(str, "instructor"),
  comment: (str: string) => incl(str, "comment"),
};

export const validKeys: ValidKeyConditions[] = Object.entries(validKeyMap).map(
  ([key, verify]) => ({ key: key as ValidSectionKey, verify })
);

export const parseHourMinutes = (str: string) => {
  const s = str.split(":");
  const nums = s.map((token) => parseInt(token.replace(/\D/g, "")));

  const h = nums[0];
  const m = s.length > 1 ? nums[1] : 0;

  const meridiem = str.toLowerCase().includes("pm") ? "pm" : "am";

  return { str, h, m, meridiem };
};

export const convert12To24 = (
  hour: number,
  minute: number,
  meridiem: string
) => {
  const h = hour % 12;
  const factor = meridiem === "pm" ? 12 : 0;
  const H = h + factor;

  return { hour: H, minute, rawMinutes: H * 60 + minute };
};

export const parseTime = (str: string): ClassTime => {
  const s = str.split("-");

  const startStr = s[0];
  const start = parseHourMinutes(startStr);

  const endStr = s[1];
  const end = parseHourMinutes(endStr);

  // we do not know whether the start time is "am" or "pm",
  // so we convert to both so that we can compare with the end time
  const start24am = convert12To24(start.h, start.m, "am");
  const start24pm = convert12To24(start.h, start.m, "pm");

  // we will always know the meridiem of the end time
  const end24 = convert12To24(end.h, end.m, end.meridiem);

  // the end time should always be greater than the start time:
  const am = end24.rawMinutes > start24am.rawMinutes;
  const pm = end24.rawMinutes > start24pm.rawMinutes;

  // choose the correct meridiem for the start time:
  // note: when am && pm is true, it means that hours are the same,
  // so the meridiem of the start time is the same as the end time
  if (am && pm) start.meridiem = end.meridiem;
  else if (am) start.meridiem = "am";
  else if (pm) start.meridiem = "pm";

  return {
    rawStrRange: str,
    start: {
      rawStr: startStr,
      h12: { hour: start.h, minute: start.m, meridiem: start.meridiem },
      h24: convert12To24(start.h, start.m, start.meridiem),
    },
    end: {
      rawStr: endStr,
      h12: { hour: end.h, minute: end.m, meridiem: end.meridiem },
      h24: end24,
    },
  };
};

export const parseCourseNumber = (str: string) => {
  const i = str.lastIndexOf(" ");
  return str.slice(i).trim();
};

export const parseSemesterYear = (str: string) => {
  const s = str.split(" ");
  return { semester: s[0] as Semester, year: parseInt(removeLetters(s[1])) };
};

export const parseDeptParts = (str: string) => {
  const i = str.lastIndexOf("-");

  const abbr = str.slice(i);
  const title = str.slice(0, i);

  return {
    dept_abbr: abbr.replace(/[()-]/g, "").trim(),
    dept_title: title.trim(),
  };
};

export const parseSectionType = (str: string): SectionType => {
  const s = str.trim().toLowerCase();
  return isSectionType(s) ? s : "add";
};

// remove char that is not digit or is not a hyphen (-):
export const parseUnits = (str: string) => str.replace(/[^\d-]/g, "");

export const parseDays = (str: string): ClassDay[] => {
  const daysStr = str.toLowerCase(); // ex: "mw" "tuth" "f" "sa" etc
  return validClassDays.filter((day) => daysStr.includes(day));
};

export const safeParseTime = (raw_time: string) => {
  let time: ClassTime;

  try {
    time = parseTime(raw_time);
  } catch (e) {
    time = {
      rawStrRange: raw_time,
      start: {
        rawStr: "error",
        h12: { hour: 0, minute: 0, meridiem: "am" },
        h24: { hour: 0, minute: 0, rawMinutes: 0 },
      },
      end: {
        rawStr: "error",
        h12: { hour: 0, minute: 0, meridiem: "am" },
        h24: { hour: 0, minute: 0, rawMinutes: 0 },
      },
    };
  }
  return time;
};

export const parseComment = (str: string): string =>
  str.replace(/\n/g, "").trim();

export const parseInstructor = (str: string): Instructor => {
  const strArr = str.split(" ").map((v) => v.trim());

  if (strArr.length < 1) return { first_name: "", last_name: "", email: "" };

  const lastIndex = strArr.length - 1;
  const firstInitial = strArr[lastIndex]; // the last element will be the last initial;
  const last_name = strArr.slice(0, lastIndex).join(" ");

  return { first_name: firstInitial, last_name, email: "" };
};

export const parseSectionData = (
  sectionPieces: RawSectionPiece[]
): RawValidSection => {
  // 1. Resolves the raw_key with the actual valid key name:
  //    for example:
  //    raw_key might be "SEC." but we know that key should be "section_number"
  // 2. This also filters out data we do not want:
  //    for example:
  //    raw_key might be "NO MATERIAL COST" but since there is no verify function
  //    defined in validKeys[], that key,value pair never gets added to the final results
  const validatedKeys: { [key: string]: string } = {};
  sectionPieces.forEach(({ raw_key, value }) => {
    const validKey = validKeys.find(({ verify }) => verify(raw_key));
    if (validKey) validatedKeys[validKey.key] = value;
  });

  return {
    // this ensures that each of these keys atleast exist:
    section_type: "",
    section_number: "",
    class_number: "",

    instructor: "",

    days: "",
    time: "",
    location: "",

    comment: "",

    // this spread injects all the missing values
    ...validatedKeys,
  };
};

export const formatAndFlattenData = (
  data: TermSchedule
): ParsedClassSection[] => {
  const { semester, year, departments } = data;

  const list: ParsedClassSection[] = [];
  departments.forEach((department) => {
    const { courses, dept } = department;
    const { dept_abbr, dept_title } = parseDeptParts(dept);

    courses.forEach((course) => {
      const { groups, course_number: cn, course_title, units: un } = course;
      const course_number = parseCourseNumber(cn);
      const units = parseUnits(un);

      groups.forEach((group) => {
        const uniqueKeys: string[] = [];
        const { sections, group_number } = group; // not using group_number anymore
        // const group_id = nanoid(); // using group_id to represent if a section is part of a group across all rows
        const group_id = crypto.randomUUID();

        sections.forEach((section) => {
          const raw = parseSectionData(section);

          // extract out the data into the correct structure:
          const section_number = raw.section_number.trim();
          const class_number = raw.class_number.trim();
          const location = raw.location.trim();
          const comment = raw.comment.trim();
          // const comment = parseComment(raw.comment);

          const section_type = parseSectionType(raw.section_type);
          const instructor = parseInstructor(raw.instructor);
          const days = parseDays(raw.days);
          const time = safeParseTime(raw.time);

          // the combination of these two variables INSIDE this group guarantees uniqueness:
          const uniqueKey = [section_number, class_number].join("|");

          const isDuplicate = uniqueKeys.includes(uniqueKey);

          if (!isDuplicate) {
            uniqueKeys.push(uniqueKey);

            list.push({
              semester,
              year,
              dept_abbr,
              dept_title,
              course_number,
              course_title,
              units,
              group_id,
              section_type,
              section_number,
              class_number,
              instructor,
              days,
              time,
              location,
              comment,
            });
          }
        });
      });
    });
  });

  return list;
};

export const getTotalSectionFromGroup = (data: RawGroup) =>
  data.sections.length;

export const getTotalSectionFromCourse = (data: RawCourse) =>
  data.groups.reduce((total_sections, group) => {
    return total_sections + getTotalSectionFromGroup(group);
  }, 0);

export const getTotalSectionsFromDepartment = (data: RawDepartment) =>
  data.courses.reduce((total_sections, course) => {
    return total_sections + getTotalSectionFromCourse(course);
  }, 0);

export const getTotalSectionsFromTerm = (data: RawDepartment[]) =>
  data.reduce((total_sections, course) => {
    return total_sections + getTotalSectionsFromDepartment(course);
  }, 0);
