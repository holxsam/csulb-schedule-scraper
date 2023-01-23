import puppeteer, { Browser } from "puppeteer";
import {
  RawGroup,
  RawHeaderKey,
  RawCourse,
  RawSectionPiece,
  Semester,
  RawDepartment,
  TermSchedule,
} from "./types";
import { outputToFile } from "../../utils/utils";
import {
  generateSemYear,
  getCatalogLink,
  getTotalSectionsFromDepartment,
  getTotalSectionsFromTerm,
} from "./parser";

const pad = (s: string) => `${s.padEnd(20, " ")} :`;

export const scrapeDepartmentsByUrl = (
  browser: Browser,
  url: string
): Promise<RawDepartment> =>
  new Promise(async (resolve, reject) => {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "load", timeout: 0 });

    try {
      await page.$eval(".departmentTitle", (el) => el);
    } catch (e) {
      resolve({ dept: "error", courses: [] });
      await page.close();
      return;
    }

    // // use this to scrape the semester_year if needed:
    // const semester_year = await page.$eval(
    //   "h1:not(.socheader)",
    //   (el) => el.textContent ?? ""
    // );

    const dept = await page.$eval(
      ".departmentTitle",
      (el) => el.textContent ?? ""
    );

    const rawCourseData = await page.$$eval(".courseBlock", (courseBlock) => {
      const allCourseSections: RawCourse[] = courseBlock.map((el) => {
        const course_number =
          el.querySelector(".courseCode")?.textContent ?? "";

        const course_title =
          el.querySelector(".courseTitle")?.textContent ?? "";

        const units = el.querySelector(".units")?.textContent ?? "";

        const groupEls = el.querySelectorAll(".sectionTable");
        const groups: RawGroup[] = [];
        groupEls.forEach((tableEl, group_number) => {
          // get the headers so that we can use them as keys for each data row later:
          const headerEls = tableEl.querySelectorAll(
            "tbody > tr:nth-child(1) > th"
          );
          const headerKeys: RawHeaderKey = {};
          headerEls.forEach((headerEl, column) => {
            const key = headerEl.textContent ?? "";
            headerKeys[column] = key;
          });

          // put in all the values for each key:
          const dataRows = tableEl.querySelectorAll(
            "tbody > tr:not(:first-child)"
          );
          const sections: RawSectionPiece[][] = [];
          dataRows.forEach((sectionRow) => {
            const section: RawSectionPiece[] = [];

            const columns = sectionRow.querySelectorAll("tr > *");

            columns.forEach((columnEl, columnNum) => {
              const value = columnEl.textContent ?? "";
              const raw_key = headerKeys[columnNum];
              section.push({ raw_key, value });
            });

            sections.push(section);
          });

          groups.push({ group_number, sections });
        });

        return { course_number, course_title, units, groups };
      });

      return allCourseSections;
    });

    resolve({ dept, courses: rawCourseData });
    await page.close();
  });

export const scrapeDeptLinks = async (
  browser: Browser,
  semester?: Semester,
  year?: number
) => {
  semester = semester ?? "Fall";
  year = year ?? 2020;
  const catalogLink = getCatalogLink(semester, year);
  console.log(`Scraping catalog links for ${semester} ${year}`);
  console.log(catalogLink);

  const page = await browser.newPage();
  await page.goto(catalogLink);

  try {
    await page.$eval(".indexList", (el) => el);
  } catch (e) {
    return [];
  }

  const deptLinks = await page.$$eval(".indexList > ul > li > a", (links) =>
    links.map((el) => (el as HTMLAnchorElement).href ?? "n/a")
  );

  await page.close();

  return deptLinks;
};

export const scrapeTerm = async (
  browser: Browser,
  semester: Semester,
  year: number
) => {
  console.log("=============================================================");
  const deptlinks = await scrapeDeptLinks(browser, semester, year);
  console.log("=============================================================");

  const data: RawDepartment[] = [];

  for (let link of deptlinks) {
    console.log("");
    console.log(pad("link"), link);
    const rawData = await scrapeDepartmentsByUrl(browser, link);
    data.push(rawData);

    console.log(pad("courses"), rawData.courses.length);
    console.log(pad("sections"), getTotalSectionsFromDepartment(rawData));
  }
  console.log(pad("TOTAL SECTIONS"), getTotalSectionsFromTerm(data));

  return data;
};

export const scrapeSchedules = async (
  startYear: number,
  endYear: number,
  semesters?: Semester[]
) => {
  const browser = await puppeteer.launch();

  // all the school terms (Fall 2022, Spring 2011, etc) to scrape:
  const terms = generateSemYear(startYear, endYear, semesters);

  for (let { semester, year } of terms) {
    const departments = await scrapeTerm(browser, semester, year);
    const rawData: TermSchedule = { semester, year, departments };
    const rawPath = `./src/output/schedules/raw/RAW_${year}_${semester}.json`;
    outputToFile(rawData, rawPath);
  }

  await browser.close();
};
