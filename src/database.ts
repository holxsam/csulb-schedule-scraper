import { getParsedData } from "./scripts/schedule/analysis";
import {
  convertParsedDataToDatabaseForm,
  generateCSV,
} from "./scripts/schedule/database";

const startDatabaseConversions = () => {
  const parsedData = getParsedData();
  const dbForm = convertParsedDataToDatabaseForm(parsedData);

  generateCSV(dbForm);
};

startDatabaseConversions();
