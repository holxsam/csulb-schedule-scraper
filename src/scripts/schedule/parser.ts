import {
  ClassDays,
  ClassSection,
  ClassTime,
  ClassType,
  RawValidSection,
  RawDepartment,
  Semester,
  RawSectionPiece,
  RawGroup,
  RawCourse,
  TermSchedule,
  Instructor,
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

const verify_section_number = (str: string) => str.includes("sec"); //
const verify_class_number = (str: string) => str.includes("class #"); //
const verify_type = (str: string) => str.includes("type"); //
const verify_days = (str: string) => str.includes("day"); //
const verify_time = (str: string) => str.includes("time"); //
const verify_location = (str: string) => str.includes("location"); //
const verify_instructor = (str: string) => str.includes("instructor"); //
const verify_comment = (str: string) => str.includes("comment"); //

export const validKeys = [
  { key: "section_number", verify: verify_section_number },
  { key: "class_number", verify: verify_class_number },
  { key: "type", verify: verify_type },
  { key: "days", verify: verify_days },
  { key: "time", verify: verify_time },
  { key: "location", verify: verify_location },
  { key: "instructor", verify: verify_instructor },
  { key: "comment", verify: verify_comment },
];

export const extractHourMinutes = (str: string) => {
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

export const extractTime = (str: string): ClassTime => {
  const s = str.split("-");

  const startStr = s[0];
  const start = extractHourMinutes(startStr);

  const endStr = s[1];
  const end = extractHourMinutes(endStr);

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

export const extractCourseNumber = (str: string) => {
  const i = str.lastIndexOf(" ");
  return str.slice(i).trim();
};

export const extractSemesterYear = (str: string) => {
  const s = str.split(" ");
  return { semester: s[0] as Semester, year: parseInt(removeLetters(s[1])) };
};

export const extractSubjectParts = (str: string) => {
  const i = str.lastIndexOf("-");

  const abbr = str.slice(i);
  const title = str.slice(0, i);

  return {
    // regex: replace "(" or ")" with ""
    subject_abbr: abbr
      .replace(/(\(|\))/g, "")
      .replace("-", "")
      .trim(),
    subject_title: title.trim(),
  };
};

// keeps only digits and hyphens(-):
export const extractUnits = (str: string) => str.replace(/[^\d-]/g, "");

export const extractDays = (str: string): ClassDays[] => {
  const days: ClassDays[] = [];
  const s = str.toLowerCase();

  if (s.includes("m")) days.push("M");
  if (s.includes("tu")) days.push("Tu");
  if (s.includes("w")) days.push("W");
  if (s.includes("th")) days.push("Th");
  if (s.includes("f")) days.push("F");
  if (s.includes("sa")) days.push("Sa");

  return days;
};

export const safeExtractTime = (raw_time: string) => {
  let time: ClassTime;

  try {
    time = extractTime(raw_time);
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

export const extractInstructor = (str: string): Instructor => {
  const strArr = str.split(" ").map((v) => v.trim());

  if (strArr.length < 1) return { first_name: "", last_name: "", email: "" };

  const lastIndex = strArr.length - 1;
  const firstInitial = strArr[lastIndex]; // the last element will be the last initial;
  const last_name = strArr.slice(0, lastIndex).join(" ");

  return { first_name: firstInitial, last_name, email: "" };
};

export const resolveSectionPieces = (
  sectionPieces: RawSectionPiece[]
): RawValidSection => {
  // 1. Resolves the raw_key with the actual valid key name:
  //    for example:
  //    raw_key might be "SEC." but we know that key should be "section_number"
  // 2. This also filters out data we do not want:
  //    for example:
  //    raw_key might be "NO MATERIAL COST" but since there is no verify function
  //    defined in validKeys[], that key,value pair never gets added to the final results
  const resolvedKeyAndValues: { [key: string]: string } = {};
  sectionPieces.forEach(({ raw_key, value }) => {
    const validKey = validKeys.find(({ verify }) =>
      verify(raw_key.toLowerCase())
    );
    if (validKey) resolvedKeyAndValues[validKey.key] = value;
  });

  const raw: RawValidSection = {
    // this ensures that each of these keys atleast exist:
    type: "",
    section_number: "",
    class_number: "",

    instructor: "",

    days: "",
    time: "",
    location: "",

    comment: "",

    // this spread injects all the missing values
    ...resolvedKeyAndValues,
  };

  return raw;
};

// export const formatAndFlattenData = (data: RawDepartment): ClassSection[] => {
export const formatAndFlattenData = (data: TermSchedule): ClassSection[] => {
  const { semester, year, departments } = data;

  const list: ClassSection[] = [];
  departments.forEach((department) => {
    const { courses, subject } = department;
    const { subject_abbr, subject_title } = extractSubjectParts(subject);

    courses.forEach((course) => {
      const { groups, course_number: cn, course_title, units: un } = course;
      const course_number = extractCourseNumber(cn);
      const units = extractUnits(un);

      groups.forEach((group) => {
        const { sections, group_number } = group;

        sections.forEach((section) => {
          const raw = resolveSectionPieces(section);

          // extract out the data into the correct structure:
          const type = raw.type as ClassType;
          const section_number = raw.section_number;
          const class_number = raw.class_number;
          // const instructor = raw.instructor;
          const location = raw.location;
          const comment = raw.comment;

          const instructor = extractInstructor(raw.instructor);
          const days = extractDays(raw.days);
          const time = safeExtractTime(raw.time);

          list.push({
            semester,
            year,
            subject_abbr,
            subject_title,
            course_number,
            course_title,
            units,
            group_number,
            type,
            section_number,
            class_number,
            instructor,
            days,
            time,
            location,
            comment,
          });
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
