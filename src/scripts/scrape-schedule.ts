import puppeteer, { Browser } from "puppeteer";
import { clean } from "../utils/formatter";
import {
  ClassDays,
  ClassSection,
  ClassTime,
  ClassType,
  RawClassSection,
  Semester,
} from "../utils/types";
import { outputToFile } from "../utils/utils";

const referenceURL = `http://web.csulb.edu/depts/enrollment/registration/class_schedule/Fall_2010/By_Subject/CECS.html`;
const bySubjectRef = `http://web.csulb.edu/depts/enrollment/registration/class_schedule/Fall_2010/By_Subject/index.html`;

const removeLetters = (str: string) => str.replace(/\D/g, "");

const getSubjectLink = (semester: Semester, year: number) =>
  `http://web.csulb.edu/depts/enrollment/registration/class_schedule/${semester}_${year}/By_Subject/index.html`;

export const generateSemYearLinks = (
  startYear: number,
  endYear: number,
  semesters?: Semester[]
) => {
  semesters = semesters ?? ["Spring", "Summer", "Fall", "Winter"];
  const links: string[] = [];

  let year = startYear;
  while (year <= endYear) {
    semesters.forEach((sem) => {
      links.push(getSubjectLink(sem, year));
    });
    year++;
  }

  return links;
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

const extractHourMinutes = (str: string) => {
  const s = str.split(":");
  const nums = s.map((token) => parseInt(token.replace(/\D/g, "")));

  const h = nums[0];
  const m = s.length > 1 ? nums[1] : 0;

  const meridiem = str.toLowerCase().includes("pm") ? "pm" : "am";

  return { str, h, m, meridiem };
};

const convert12To24 = (hour: number, minute: number, meridiem: string) => {
  const h = hour % 12;
  const factor = meridiem === "pm" ? 12 : 0;
  const H = h + factor;

  return { hour: H, minute, rawMinutes: H * 60 + minute };
};

const extractTime = (str: string): ClassTime => {
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

const extractCourseNumber = (str: string) => {
  const i = str.lastIndexOf(" ");
  return str.slice(i).trim();
};

const extractSemesterYear = (str: string) => {
  const s = str.split(" ");
  return { semester: s[0] as Semester, year: parseInt(removeLetters(s[1])) };
};

const extractSubjectParts = (str: string) => {
  const s = str.split("-");
  return {
    subject_abbr: s[1].replace("(", "").replace(")", "").trim(),
    subject_title: s[0].trim(),
  };
};

// keeps only digits and hyphens(-):
const extractUnits = (str: string) => str.replace(/[^\d-]/g, "");

const extractDays = (str: string): ClassDays[] => {
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

const formatRawClassSections = (data: RawClassSection[]): ClassSection[] =>
  data.map((raw) => {
    // these fields are just one-to-one strings (for the most part):
    const {
      course_title,
      group_number,
      section_number,
      class_number,
      instructor,
      location,
      comment,
    } = raw;

    // these fields require extraction:
    const { semester, year } = extractSemesterYear(raw.semester_year);
    const { subject_abbr, subject_title } = extractSubjectParts(raw.subject);
    const type = raw.type as ClassType;
    const course_number = extractCourseNumber(raw.course_number);
    const units = extractUnits(raw.units);
    const days = extractDays(raw.days);

    let time: ClassTime;

    try {
      time = extractTime(raw.time);
    } catch (e) {
      time = {
        rawStrRange: raw.time,
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

    return {
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
    };
  });

export const scrapeSubjectByUrl = (
  browser: Browser,
  url: string
): Promise<RawClassSection[]> =>
  new Promise(async (resolve, reject) => {
    // page initialization:
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 0 });
    // -------------------------------------------------------------------

    let validPage = false;

    try {
      await page.$eval(".departmentTitle", (el) => el);
      validPage = true;
    } catch (e) {
      validPage = false;
    }

    if (!validPage) {
      resolve([]);
      return;
    }

    // -------------------------------------------------------------------
    const semester_year = await page.$eval(
      "h1:not(.socheader)",
      (el) => el.textContent ?? ""
    );

    const subject = await page.$eval(
      ".departmentTitle",
      (el) => el.textContent ?? ""
    );
    // -------------------------------------------------------------------

    const rawCourseData = await page.$$eval(".courseBlock", (courseBlock) => {
      const verify_section_number = (str: string) => str.includes("sec"); //
      const verify_class_number = (str: string) => str.includes("class #"); //
      const verify_type = (str: string) => str.includes("type"); //
      const verify_days = (str: string) => str.includes("day"); //
      const verify_time = (str: string) => str.includes("time"); //
      const verify_location = (str: string) => str.includes("location"); //
      const verify_instructor = (str: string) => str.includes("instructor"); //
      const verify_comment = (str: string) => str.includes("comment"); //

      const verifyHeader = [
        { key: "section_number", verify: verify_section_number },
        { key: "class_number", verify: verify_class_number },
        { key: "type", verify: verify_type },
        { key: "days", verify: verify_days },
        { key: "time", verify: verify_time },
        { key: "location", verify: verify_location },
        { key: "instructor", verify: verify_instructor },
        { key: "comment", verify: verify_comment },
      ];

      const allCourseSections: RawClassSection[] = courseBlock.flatMap((el) => {
        const courseSections: RawClassSection[] = [];

        const courseNumberEl = el.querySelector(".courseCode");
        const course_number = courseNumberEl?.textContent ?? "";

        const courseTitleEl = el.querySelector(".courseTitle");
        const course_title = courseTitleEl?.textContent ?? "";

        // UNITS CAN HAVE A RANGE, currently DOES NOT SUPPORT THIS:
        const unitsEl = el.querySelector(".units");
        const units = unitsEl?.textContent ?? "";

        const groups = el.querySelectorAll(".sectionTable");

        groups.forEach((tableEl, group_number) => {
          // Find header keys and column order:
          const headerEls = tableEl.querySelectorAll(
            "tbody > tr:nth-child(1) > th"
          );

          const keys: { key: keyof RawClassSection; column: number }[] = [];

          headerEls.forEach((header, i) => {
            const text = (header.textContent ?? "").toLowerCase();

            verifyHeader.some((verifier) => {
              const verified = verifier.verify(text);
              if (verified)
                keys.push({
                  key: verifier.key as keyof RawClassSection,
                  column: i + 1,
                });
              return verified;
            });
          });

          const sections = tableEl.querySelectorAll(
            "tbody > tr:not(:first-child)"
          );

          sections.forEach((sectionRow) => {
            let sectionData: RawClassSection = {
              semester_year: "___", // out of $$eval scope
              subject: "___", // out of $$eval scope

              course_number,
              course_title,

              units,
              group_number,

              // will get injected with keys array:
              type: "___",
              section_number: "___",
              class_number: "___",

              instructor: "___",

              days: "___",
              time: "___",
              location: "___",

              comment: "___",
            };

            const sectionSpecificFields: { [key: string]: any } = {};

            keys.forEach((header) => {
              const { key, column } = header;
              const valueEl = sectionRow.querySelector(`:nth-child(${column})`);
              sectionSpecificFields[key] = valueEl?.textContent ?? "";
            });

            sectionData = { ...sectionData, ...sectionSpecificFields };
            courseSections.push(sectionData);
          });
        });

        return courseSections;
      });

      return allCourseSections;
    });
    // -------------------------------------------------------------------
    // resolve promise by sending back the data:
    resolve(
      rawCourseData.map((group) => ({
        ...group,
        semester_year,
        subject,
      }))
    );

    await page.close();
  });

export const scrapeSubjectLinks = async (
  browser: Browser,
  semester?: Semester,
  year?: number
) => {
  semester = semester ?? "Fall";
  year = year ?? 2020;
  const link = getSubjectLink(semester, year);
  console.log("Scraping LINKS from ", link);

  const page = await browser.newPage();
  await page.goto(link);
  // await page.waitForSelector(".indexList");

  let validPage = false;

  try {
    await page.$eval(".indexList", (el) => el);
    validPage = true;
  } catch (e) {
    validPage = false;
  }

  if (!validPage) {
    // resolve([]);
    return [];
  }

  const subjectLinks = await page.$$eval(".indexList > ul > li > a", (links) =>
    links.map((el) => (el as HTMLAnchorElement).href ?? "n/a")
  );

  await page.close();

  return subjectLinks;
};

export const scrapeSchedule = async (
  browser: Browser,
  semester: Semester,
  year: number
) => {
  let subjectlinks = await scrapeSubjectLinks(browser, semester, year);

  const data: ClassSection[] = [];
  for (let link of subjectlinks) {
    console.log("------------------------");
    console.log("Scraping", link);
    const rawData = await scrapeSubjectByUrl(browser, link);
    const formattedData = formatRawClassSections(rawData);
    console.log("Finished scraping subject", rawData.length);
    data.push(...formattedData.flatMap((v) => v));
  }

  console.log("TOTAL class sections for the year", data.length);

  return data;
};

export const scrapeSchedules = async (
  startYear: number,
  endYear: number,
  semesters?: Semester[]
) => {
  const browser = await puppeteer.launch();

  const semester_year = generateSemYear(startYear, endYear, semesters);
  const data: ClassSection[] = [];

  for (let { semester, year } of semester_year) {
    console.log("=======================================");

    const schedule = await scrapeSchedule(browser, semester, year);
    data.push(...schedule);
  }

  await browser.close();
  return data;
};
