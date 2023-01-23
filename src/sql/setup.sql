drop table if exists class_sections;

create table class_sections (
  uid            uuid          DEFAULT   uuid_generate_v4(),
  semester       varchar(10)   NOT NULL,
  year           smallint      NOT NULL,

  dept_abbr      varchar(10)   NOT NULL, 
  dept_title     varchar(50)   NOT NULL, 

  course_number  varchar(10)   NOT NULL,
  course_title   varchar(50)   NOT NULL, 

  units          varchar(10)   NOT NULL,
  group_id       uuid          NOT NULL, 

  section_type   varchar(10)   NOT NULL,
  section_number varchar(10)   NOT NULL, 
  class_number   varchar(10)   NOT NULL,

  instructor_fn  varchar(50)   NOT NULL,
  instructor_ln  varchar(50)   NOT NULL,

  days           varchar(20)   NOT NULL,
  time_start     integer       NOT NULL,
  time_end       integer       NOT NULL,
  location       varchar(50)   NOT NULL,

  comment        varchar(1000) NOT NULL,

  primary key(uid),
  unique(semester, year, dept_abbr, course_number, group_id, section_number, class_number)
);

alter table class_sections enable row level security;

create policy "class_sections are viewable by everyone"
on class_sections for select using (true);

