-- drop function get_distinct_semesters();
create or replace function get_distinct_semesters
()
returns table 
(semester varchar(10))
as
$$
  select distinct on (semester) semester from class_sections;
$$ language sql;

-- drop function get_distinct_terms();
create or replace function get_distinct_terms
()
returns table 
(semester varchar(10), year smallint)
as
$$
   select distinct on (semester, year) semester, year from class_sections;
$$ language sql;

-- drop function get_distinct_years();
create or replace function get_distinct_years
()
returns table 
(year smallint)
as
$$
  select distinct on (year) year from class_sections;
$$ language sql;

-- drop function get_distinct_depts(text, int);
create or replace function get_distinct_depts
(_semester text, _year int)
returns table
(uid uuid, dept_abbr text, dept_title text)
as
$$
  select distinct on (dept_abbr) uid, dept_abbr, dept_title
  from class_sections
  where semester = _semester AND year = _year;
$$ language sql;

-- drop function get_distinct_course_codes(text, int, text);
create or replace function get_distinct_course_codes 
(_semester text, _year int, _dept_abbr text)
returns table
(uid uuid, course_number text, course_title text)
as
$$
  select distinct on (course_number) uid, course_number, course_title
  from class_sections
  where semester = _semester AND year = _year AND dept_abbr = _dept_abbr;
$$ language sql;