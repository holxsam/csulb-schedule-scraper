import {
  generateSemYearLinks,
  scrapeSchedule,
  scrapeSchedules,
} from "./scripts/scrape-schedule";
import { Semester } from "./utils/types";
import { outputToFile } from "./utils/utils";

const startScrape = async () => {
  // const catalogs = generateSemYearLinks(2008, 2022);
  // outputToFile(catalogs, `../output/catalog-lings.json`);

  // console.time("scrape");
  // const sem: Semester = "Fall";
  // const year = 2022;
  // const schedules = await scrapeSchedule(sem, year);
  // outputToFile(schedules, `../schedules/schedules-${sem}-${year}.json`);
  // console.timeEnd("scrape");

  const scrapeTimeLabel = "Scrape Time";
  console.time(scrapeTimeLabel);
  const schedules = await scrapeSchedules(2008, 2022);
  outputToFile(schedules, `../schedules/schedules.json`);
  console.timeEnd(scrapeTimeLabel);
};

startScrape();
