import { scrapeSchedules } from "./scripts/schedule/scrape-schedule";

const startScrape = async () => {
  const scrapeTimeLabel = "Total Scrape Time";
  console.time(scrapeTimeLabel);

  // await scrapeSchedules(2022, 2022, ["Fall", "Spring"]);
  // await scrapeSchedules(2008, 2023, ["Fall", "Spring", "Summer"]);

  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  console.timeEnd(scrapeTimeLabel);
  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
};

startScrape();
