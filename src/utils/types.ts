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

export type ClassSection = {
  semester: Semester;
  year: number;

  subject_abbr: string; // ex: CECS, BIOL, MATH, ...
  subject_title: string; // ex: computer science, biology, ...

  course_number: string; // 100, 104, 242, 491a, 491b, ...
  course_title: string; // Web Design, Discrete Structures, ...

  units: string;
  group_number: number;

  type: ClassType;
  section_number: string;
  class_number: string;

  instructor: string;

  days: ClassDays[];
  time: ClassTime;
  location: string;

  comment: string;
};

export type RawClassSection = {
  semester_year: string;

  subject: string;

  course_number: string; // 100, 104, 242, 491a, 491b, ...
  course_title: string; // Web Design, Discrete Structures, ...

  units: string;
  group_number: number;

  type: string;
  section_number: string;
  class_number: string;

  instructor: string;

  days: string;
  time: string;
  location: string;

  comment: string;
};
