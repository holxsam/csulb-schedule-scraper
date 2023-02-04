## Get Started

To get CSULBs schedule data:

1. Run `npm run scrape` and let it finish.
2. Run `npm run parse`. If you do not like the results of the parse then you can modify the contents of `./src/scripts/schedule/parse.ts` or parse the raw data yourself.

## More Info

        npm run scrape

will scrape all CSULB schedules from 2008 to 2023 and output each term in `./src/output/schedules/raw`. This process will take 20-30 minutes. Minimal parsing is done in this step, if at all. The most opiniated taken done will be how the different fields are grouped to preserve their relationship to one another. For example, each term (semester, year) will have a list of courses, then each course will have a list of groups, then each group will have a list of sections, etc. This is done so that anyone can then take this raw data and parse it how they see fit while keeping the relationships of the data intact.

        npm run parse

will use the scraped files in `./src/output/schedules/raw` to parse the data into an easier to work with format and output the results in `./src/output/schedules/parsed`.

        npm run analysis

can be used to get a feel for the data so that we can parse the raw data more effectively or verify that our parsed data is what we expect it to be. For example, before parsing the data for a section_type field, we might want to see what type of values appear in that field. Or you might want to know how many class sections are of section_type = "lec". Try to log the results in `./src/output/schedules/analysis`.

## Bulk Load Data (PostgreSQL):

### Prepare the data:

1. `npm run database` to generate a .csv file of all the data. This data is stored in `./src/output/schedules/all` by default.

### Bulk load the data:

1.  Download postgres: https://www.postgresql.org/download/
2.  Open your `psql` shell (windows).
3.  Connect to your database server.
4.  Run this command:

        \copy table_name from '/path/to/data.csv' WITH DELIMITER ',' CSV HEADER

    - Replace `table_name` with your table's name.
    - Replace `/path/to/data.csv` to the path to the generated .csv file and make sure the single quotes are surrounding the path.
    - If your generated .csv does not have a header columns then remove `CSV HEADER`.

    If you altered any of the scripts in `npm run database` or used a different method to prepare your .csv file, you may have issues if you did not clean your the data properly, like not having double quotes around strings, having a double quote inside a string, having carriage returns in the .csv file, etc. You will have to follow the error outputs from psql to help you solve all these granular formatting issues.
