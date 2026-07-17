
use Enrich_Uni_DB;

-- 1. CLEANUP
DROP TABLE IF EXISTS prereq; DROP TABLE IF EXISTS advisor; DROP TABLE IF EXISTS takes; 
DROP TABLE IF EXISTS teaches; DROP TABLE IF EXISTS section; DROP TABLE IF EXISTS course; 
DROP TABLE IF EXISTS instructor; DROP TABLE IF EXISTS student; DROP TABLE IF EXISTS department;
 
-- 2. DDL (Schema Definition)
CREATE TABLE department (
    dept_name VARCHAR(20),
    building VARCHAR(15),
    budget NUMERIC(12 , 2 ),
    PRIMARY KEY (dept_name)
);
CREATE TABLE instructor (
    ID VARCHAR(5),
    name VARCHAR(20),
    dept_name VARCHAR(20),
    salary NUMERIC(8 , 2 ),
    PRIMARY KEY (ID),
    FOREIGN KEY (dept_name)
        REFERENCES department (dept_name)
);
CREATE TABLE student (
    ID VARCHAR(5),
    name VARCHAR(20),
    dept_name VARCHAR(20),
    tot_cred NUMERIC(3 , 0 ),
    PRIMARY KEY (ID),
    FOREIGN KEY (dept_name)
        REFERENCES department (dept_name)
);
CREATE TABLE course (
    course_id VARCHAR(8),
    title VARCHAR(50),
    dept_name VARCHAR(20),
    credits NUMERIC(2 , 0 ),
    PRIMARY KEY (course_id),
    FOREIGN KEY (dept_name)
        REFERENCES department (dept_name)
);
CREATE TABLE section (
    course_id VARCHAR(8),
    sec_id VARCHAR(8),
    semester VARCHAR(6),
    year NUMERIC(4 , 0 ),
    building VARCHAR(15),
    room_number VARCHAR(7),
    time_slot_id VARCHAR(4),
    PRIMARY KEY (course_id , sec_id , semester , year),
    FOREIGN KEY (course_id)
        REFERENCES course (course_id)
);
CREATE TABLE teaches (
    ID VARCHAR(5),
    course_id VARCHAR(8),
    sec_id VARCHAR(8),
    semester VARCHAR(6),
    year NUMERIC(4 , 0 ),
    PRIMARY KEY (ID , course_id , sec_id , semester , year),
    FOREIGN KEY (course_id , sec_id , semester , year)
        REFERENCES section (course_id , sec_id , semester , year),
    FOREIGN KEY (ID)
        REFERENCES instructor (ID)
);
CREATE TABLE takes (
    ID VARCHAR(5),
    course_id VARCHAR(8),
    sec_id VARCHAR(8),
    semester VARCHAR(6),
    year NUMERIC(4 , 0 ),
    grade VARCHAR(2),
    PRIMARY KEY (ID , course_id , sec_id , semester , year),
    FOREIGN KEY (ID)
        REFERENCES student (ID),
    FOREIGN KEY (course_id , sec_id , semester , year)
        REFERENCES section (course_id , sec_id , semester , year)
);
 
-- 3. DML (Insert Data)
INSERT INTO department VALUES ('Comp. Sci.', 'Taylor', 100000);
INSERT INTO department VALUES ('Biology', 'Watson', 90000);
INSERT INTO department VALUES ('Elec. Eng.', 'Taylor', 85000);
INSERT INTO department VALUES ('History', 'Painter', 50000);
INSERT INTO department VALUES ('Finance', 'Wilson', 95000);
INSERT INTO department VALUES ('Physics', 'Tesla', 92000);


-- Instructors
INSERT INTO instructor VALUES ('10101', 'Srinivasan', 'Comp. Sci.', 65000);
INSERT INTO instructor VALUES ('12121', 'Wu', 'Finance', 90000);
INSERT INTO instructor VALUES ('22222', 'Einstein', 'Physics', 95000);
INSERT INTO instructor VALUES ('32343', 'El Said', 'History', 60000);
INSERT INTO instructor VALUES ('45565', 'Katz', 'Comp. Sci.', 75000);
INSERT INTO instructor VALUES ('58583', 'Califieri', 'History', 62000);
INSERT INTO instructor VALUES ('76543', 'Singh', 'Finance', 80000);
INSERT INTO instructor VALUES ('98345', 'Kim', 'Elec. Eng.', 80000);
 
-- Courses
INSERT INTO course VALUES ('CS-101', 'Intro to CS', 'Comp. Sci.', 4);
INSERT INTO course VALUES ('CS-315', 'Robotics', 'Comp. Sci.', 3);
INSERT INTO course VALUES ('CS-347', 'Db Systems', 'Comp. Sci.', 3);
INSERT INTO course VALUES ('EE-181', 'Intro to Digital Systems', 'Elec. Eng.', 3);
INSERT INTO course VALUES ('BIO-101', 'Intro to Bio', 'Biology', 3);
INSERT INTO course VALUES ('HIS-351', 'World History', 'History', 3);
 
-- Sections (Crucial for Set Ops: some in Fall, some in Spring)
INSERT INTO section VALUES ('CS-101', '1', 'Fall', 2024, 'Taylor', '3128', 'A');
INSERT INTO section VALUES ('CS-347', '1', 'Fall', 2024, 'Taylor', '3128', 'A');
INSERT INTO section VALUES ('CS-101', '1', 'Spring', 2025, 'Packard', '101', 'B'); -- CS-101 runs in BOTH semesters
INSERT INTO section VALUES ('CS-315', '1', 'Spring', 2025, 'Taylor', '3128', 'B');
INSERT INTO section VALUES ('BIO-101', '1', 'Summer', 2025, 'Painter', '514', 'C');
 
-- Teaches
INSERT INTO teaches VALUES ('10101', 'CS-101', '1', 'Fall', 2024);
INSERT INTO teaches VALUES ('10101', 'CS-347', '1', 'Fall', 2024);
INSERT INTO teaches VALUES ('10101', 'CS-101', '1', 'Spring', 2025);
INSERT INTO teaches VALUES ('45565', 'CS-315', '1', 'Spring', 2025);
 
-- Students (Null checks included)
INSERT INTO student VALUES ('00128', 'Zhang', 'Comp. Sci.', 102);
INSERT INTO student VALUES ('12345', 'Shankar', 'Comp. Sci.', 32);
INSERT INTO student VALUES ('54321', 'Williams', 'Comp. Sci.', 54);
INSERT INTO student VALUES ('76543', 'Brown', 'Comp. Sci.', 58);
INSERT INTO student VALUES ('98988', 'Tanaka', 'Biology', 120);
 
-- Takes (Grades include NULL)
INSERT INTO takes VALUES ('00128', 'CS-101', '1', 'Fall', 2024, 'A');
INSERT INTO takes VALUES ('00128', 'CS-347', '1', 'Fall', 2024, 'A-');
INSERT INTO takes VALUES ('12345', 'CS-101', '1', 'Fall', 2024, 'C');
INSERT INTO takes VALUES ('54321', 'CS-101', '1', 'Fall', 2024, 'A');
INSERT INTO takes VALUES ('54321', 'CS-315', '1', 'Spring', 2025, 'B');
INSERT INTO takes VALUES ('76543', 'CS-101', '1', 'Fall', 2024, NULL);-- Grade not yet posted






SELECT 
    name
FROM
    instructor
WHERE
    name LIKE ('%an%');

-- Null values

SELECT 
    ID, course_id
FROM
    takes
WHERE
    grade IS NULL;

-- Department census

SELECT 
    dept_name, COUNT(*)
FROM
    instructor
GROUP BY dept_name;

-- (Department Spending: Find the average salary of instructors in each department. Rename the result column to avg_salary.)
SELECT 
    dept_name, AVG(salary) AS avg_salary
FROM
    instructor
GROUP BY dept_name;

-- High Budget Departments: Find the department names that have an average instructor salary greater than $70,000
SELECT 
    dept_name, AVG(salary) AS avg_salary
FROM
    instructor
GROUP BY dept_name
HAVING avg_salary > 70000;


-- Section B
-- Semester Overlap: Find the course_id of courses that were offered in Fall 2024 AND in Spring 2025.(Hint: Use INTERSECT).

SELECT DISTINCT
    course_id
FROM
    takes
WHERE
    semester = 'Fall' AND year = 2024
        AND course_id IN (SELECT 
            course_id
        FROM
            takes
        WHERE
            semester = 'Spring' AND year = 2025);
-- UNION
SELECT DISTINCT
    course_id
FROM
    takes
WHERE
    semester = 'FALL' AND year = 2024
        OR semester = 'Spring' AND year = 2025;

-- Semester Exclusions: Find the course_id of courses that were offered in Fall 2024 but were NOT offered in Spring 2025.(Hint: Use EXCEPT).
SELECT DISTINCT
    course_id
FROM
    takes
WHERE
    semester = 'Fall' AND year = 2024
        AND course_id NOT IN (SELECT 
            course_id
        FROM
            takes
        WHERE
            semester = 'Spring' AND year = 2025); 

SELECT course_id
FROM section
WHERE semester = 'Fall' AND year = 2024

EXCEPT

SELECT course_id
FROM section
WHERE semester = 'Spring' AND year = 2025;

# The "CS" List: Find the set of all names (just the names) present in the instructor table combined with all names present in the student table.(Hint: Use UNION).

select name
from instructor 
UNION
select name 
from student;

SELECT 
    AVG(salary)
FROM
    instructor;
SELECT 
    name
FROM
    instructor
WHERE
    salary > (SELECT 
            AVG(salary)
        FROM
            instructor);
		
        
-- Course Comparison: Find the names of all instructors whose salary is greater than at least one instructor in the 'Biology' department.(Hint: Use > SOME or > ANY).		

SELECT 
    name
FROM
    instructor
WHERE
    salary > ANY (SELECT 
            salary
        FROM
            instructor
        WHERE
            dept_name = 'Biology');
		
-- Enrolled Students: Find the names of all students who have taken the course 'CS-101'.(Hint: Use WHERE ID IN (...)).

SELECT 
    name
FROM
    student
WHERE
    ID IN (SELECT 
            ID
        FROM
            takes
        WHERE
            course_id = 'CS-101');
            
 -- New Hire: Insert a new instructor named 'Mozart' into the 'Music' department with ID '99999' and a salary of $50,000.(Note: If the 'Music' department does not exist in the department table, you may need to add it first, or use an existing department).   
                        
-- Add the missing parent row first
INSERT INTO department (dept_name, building, budget)
VALUES ('Music', 'Arts', 50000);

-- Now insert the instructor
INSERT INTO instructor (ID, name, dept_name, salary)
VALUES ('99999', 'Mozart', 'Music', 50000);
set safe_update =0;
SET SQL_SAFE_UPDATES = 0;
-- The Raise: Give a 5% salary increase to all instructors in the 'Comp. Sci.' department.(Hint: UPDATE instructor SET ...).
UPDATE instructor 
SET 
    salary = salary -50000;
WHERE
    ID IS NOT NULL LIMIT 1000;
-- where dept_name;

SELECT 
    *
FROM
    instructor;

-- Cleanup: Delete all students who have a tot_cred (total credits) value of less than 40.
DELETE FROM takes 
WHERE
    ID IN (SELECT 
        ID
    FROM
        student
    
    WHERE
        tot_cred < 40);
Set SQL_safe_updates=0;
DELETE FROM student 
WHERE
    tot_cred < 40;
Set SQL_safe_updates=1;

SELECT 
    Id, name, salary / 100 AS salary2
FROM
    instructor;


SELECT DISTINCT
    T.name
FROM
    instructor AS T,
    instructor AS S
WHERE
    T.salary > S.salary
        AND S.dept_name = 'Biology';

