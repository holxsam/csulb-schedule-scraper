export const validSemesters = ["Fall", "Spring", "Winter", "Summer"] as const;
export const validSectionTypes = [
  "lab",
  "lec",
  "sem",
  "sup",
  "act",
  "add",
  // "add" means "additional"
  // this value does not exist in the raw data
  // however, the values "" and " " ARE found
  // and they represent an additional section LINKED to another section
  // hence the "add".
] as const;
export const validClassDays = ["m", "tu", "w", "th", "f", "sa"] as const;
export const validSectionKeys = [
  "section_number",
  "class_number",
  "section_type",
  "days",
  "time",
  "location",
  "instructor",
  "comment",
] as const;

export type Semester = typeof validSemesters[number];
export type SectionType = typeof validSectionTypes[number];
export type ClassDay = typeof validClassDays[number];
export type ValidSectionKey = typeof validSectionKeys[number];

export const isSemester = (str: string): str is Semester =>
  validSemesters.some((sem) => sem === str);

export const isSectionType = (str: string): str is SectionType =>
  validSectionTypes.some((classType) => classType === str);

export const isClassDays = (str: string): str is ClassDay =>
  validClassDays.some((day) => day === str);

export const isValidSectionKey = (str: string): str is ValidSectionKey =>
  validSectionKeys.some((key) => key === str);

export type TimeInfo = {
  rawStr: string;
  h12: {
    hour: number;
    minute: number;
    meridiem: string;
  };
  h24: {
    hour: number;
    minute: number;
    rawMinutes: number; // use this to compare
  };
};

export type ClassTime = {
  rawStrRange: string;
  start: TimeInfo; // number of minutes since 0:00 (the beginning of the day)
  end: TimeInfo; // number of minutes since 0:00 (the beginning of the day)
};

export type Instructor = {
  first_name: string;
  last_name: string;
  email: string;
};

// ----------------------------------------------------------------------
// RAW DATA TYPES:
export type RawValidSection = Record<ValidSectionKey, string>;

export type RawSectionPiece = {
  raw_key: string;
  value: string;
};

export type RawHeaderKey = { [column: number]: string };

export type RawGroup = {
  group_number: number;
  sections: RawSectionPiece[][];
};

export type RawCourse = {
  course_number: string; // 100, 104, 242, 491a, 491b, ...
  course_title: string; // Web Design, Discrete Structures, ...
  units: string;
  groups: RawGroup[];
};

export type RawDepartment = {
  dept: string;
  courses: RawCourse[];
};

export type TermSchedule = {
  semester: Semester;
  year: number;
  departments: RawDepartment[];
};
// END OF RAW DATA TYPES
// ----------------------------------------------------------------------

/**
 * ParsedClassSection is meant to have more specific and refined fields.
 * This structure helps in choosing how we might want to store the data in a database
 * but should not be used directly (one-to-one) in a database.
 */
export type ParsedClassSection = {
  semester: Semester;
  year: number;

  dept_abbr: string; // CECS, BIOL, MATH, ...
  dept_title: string; // Computer Science, Biology, Mathematics, ...

  course_number: string; // 100, 104, 242, 491a, 491b, ...
  course_title: string; // Web Design, Discrete Structures, ... // might change from term to term

  units: string; // might change from term to term
  group_id: string;
  // group_id is generated and was NOT scraped.
  // However, it is generated from the structure of the raw data.
  // Meaning if a section was in a particular group, it got that group's group_id
  // This means across ALL ParsedClassSections, you can discriminate a ParsedClassSection's group.

  section_type: SectionType;
  section_number: string;
  // section_number was scraped meaning it is instrinsic to the schema.
  // section_number can be used to see if a ParsedClassSection is a linked to another ParsedClassSection
  // if and only if the
  // 1. ParsedClassSections have the same group_id
  // 2. The section_type of at least one ParsedClassSections is "add"
  // This means that you CANNOT use section_number
  // to link one ParseClassSection with another
  // across ALL ParseClassSections like you can with group_id
  class_number: string;

  instructor: Instructor;

  days: ClassDay[];
  time: ClassTime;
  location: string;

  comment: string;
};

export type DatabaseClassSection = {
  uid: string;
  semester: Semester;
  year: number;

  dept_abbr: string; // CECS, BIOL, MATH, ...
  dept_title: string; // Computer Science, Biology, Mathematics, ...

  course_number: string; // 100, 104, 242, 491a, 491b, ...
  course_title: string; // Web Design, Discrete Structures, ...

  units: string;
  group_id: string; // can be used to see if a section is in a particular group across ALL rows

  section_type: SectionType;
  section_number: string; // can be used to see if a section is linked to another section WITHIN a group ONLY
  class_number: string;

  instructor_fn: string;
  instructor_ln: string;

  days: string;
  time_start: number;
  time_end: number;
  location: string;

  comment: string;
};
