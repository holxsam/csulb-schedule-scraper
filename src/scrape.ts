import { scrapeSchedules } from "./scripts/schedule/scrape";

export const startScrape = async () => {
  const label = "Total Scrape Time";
  console.time(label);

  await scrapeSchedules(2008, 2023, ["Fall", "Spring", "Summer"]);

  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  console.timeEnd(label);
  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
};

startScrape();
