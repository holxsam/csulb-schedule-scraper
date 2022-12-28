export type Semester = "Fall" | "Spring" | "Winter" | "Summer";
export type ClassType = "LAB" | "LEC" | "SEM";
export type ClassDays = "M" | "Tu" | "W" | "Th" | "F" | "Sa";

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

export type ClassSection = {
  semester: Semester;
  year: number;

  subject_abbr: string; // CECS, BIOL, MATH, ...
  subject_title: string; // Computer Science, Biology, Mathematics, ...

  course_number: string; // 100, 104, 242, 491a, 491b, ...
  course_title: string; // Web Design, Discrete Structures, ... // might change from term to term

  units: string; // might change from term to term
  group_number: number;

  type: ClassType;
  section_number: string;
  class_number: string;

  // instructor: string;
  instructor: Instructor;

  days: ClassDays[];
  time: ClassTime;
  location: string;

  comment: string;
};

export type RawValidSection = {
  type: string;
  section_number: string;
  class_number: string;

  instructor: string;

  days: string;
  time: string;
  location: string;

  comment: string;
};

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
  // semester_year: string;
  subject: string;

  courses: RawCourse[];
};

export type TermSchedule = {
  semester: Semester;
  year: number;

  departments: RawDepartment[];
};
