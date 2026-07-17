CREATE DATABASE uni_db;
USE uni_db;

-- 1. CLEANUP
DROP TRIGGER IF EXISTS update_tot_cred;
DROP PROCEDURE IF EXISTS register_student;
DROP TABLE IF EXISTS takes; 
DROP TABLE IF EXISTS section; 
DROP TABLE IF EXISTS course; 
DROP TABLE IF EXISTS instructor; 
DROP TABLE IF EXISTS student; 
DROP TABLE IF EXISTS department;

-- 2. DDL (TABLE CREATION)

CREATE TABLE department (
    dept_name VARCHAR(20),
    building VARCHAR(15),
    budget NUMERIC(12,2),
    PRIMARY KEY (dept_name)
);

CREATE TABLE instructor (
    ID VARCHAR(5),
    name VARCHAR(20),
    dept_name VARCHAR(20),
    salary NUMERIC(8,2),
    PRIMARY KEY (ID),
    FOREIGN KEY (dept_name) REFERENCES department(dept_name)
);

CREATE TABLE student (
    ID VARCHAR(5),
    name VARCHAR(20),
    dept_name VARCHAR(20),
    tot_cred NUMERIC(3,0) DEFAULT 0,
    PRIMARY KEY (ID),
    FOREIGN KEY (dept_name) REFERENCES department(dept_name)
);

CREATE TABLE course (
    course_id VARCHAR(8),
    title VARCHAR(50),
    dept_name VARCHAR(20),
    credits NUMERIC(2,0),
    PRIMARY KEY (course_id),
    FOREIGN KEY (dept_name) REFERENCES department(dept_name)
);

CREATE TABLE section (
    course_id VARCHAR(8),
    sec_id VARCHAR(8),
    semester VARCHAR(6),
    year NUMERIC(4,0),
    PRIMARY KEY (course_id, sec_id, semester, year),
    FOREIGN KEY (course_id) REFERENCES course(course_id)
);

CREATE TABLE takes (
    ID VARCHAR(5),
    course_id VARCHAR(8),
    sec_id VARCHAR(8),
    semester VARCHAR(6),
    year NUMERIC(4,0),
    grade VARCHAR(2),
    PRIMARY KEY (ID, course_id, sec_id, semester, year)
  --  FOREIGN KEY (ID) REFERENCES student(ID),
   -- FOREIGN KEY (course_id, sec_id, semester, year) 
    --    REFERENCES section(course_id, sec_id, semester, year)
);

-- 3. DML (INSERT DATA)

INSERT INTO department VALUES ('Comp. Sci.', 'Taylor', 100000);
INSERT INTO department VALUES ('Biology', 'Watson', 90000);

INSERT INTO instructor VALUES ('10101', 'Srinivasan', 'Comp. Sci.', 65000);
INSERT INTO instructor VALUES ('22222', 'Einstein', 'Biology', 95000);

INSERT INTO course VALUES ('CS-101', 'Intro to CS', 'Comp. Sci.', 4);
INSERT INTO course VALUES ('CS-315', 'Robotics', 'Comp. Sci.', 3);
INSERT INTO course VALUES ('BIO-101', 'Intro to Bio', 'Biology', 3);

INSERT INTO section VALUES ('CS-101', '1', 'Fall', 2024);
INSERT INTO section VALUES ('CS-315', '1', 'Spring', 2025);

INSERT INTO student VALUES ('00128', 'Zhang', 'Comp. Sci.', 0);
INSERT INTO student VALUES ('12345', 'Shankar', 'Comp. Sci.', 0);

INSERT INTO takes (ID, course_id, sec_id, semester, year, grade)
VALUES ('00128', 'CS-101', '1', 'Fall', 2024, 'A');
INSERT INTO takes (ID, course_id, sec_id, semester, year, grade)
VALUES ('12345', 'CS-315', '1', 'Spring', 2025, 'B');


-- Section A
-- 1.Missing data

SELECT 
    name
FROM
    student
WHERE
    ID NOT IN (SELECT 
            ID
        FROM
            takes);

-- 2. credit check

select sum(credits) as Total_Credit
from course
WHERE dept_name="Comp. Sci." ;

-- 3. The budget Cut
Set SQL_safe_updates=0;
update department
set budget = budget* 0.95;
-- Set SQL_safe_updates=1;


-- 4. The Roster Procedure

DELIMITER //

CREATE PROCEDURE get_dept_instructors (
    IN dept VARCHAR(20)
)
BEGIN
    SELECT ID, name
    FROM instructor
    WHERE dept_name = dept ;
END;
//

DELIMITER ;

CALL get_dept_instructors('Comp. Sci.');
	
-- 5. The Registration Procedure

DELIMITER //

CREATE PROCEDURE register_student (
    IN s_id VARCHAR(5),
    IN c_id VARCHAR(8),
    IN sec VARCHAR(8),
    IN sem VARCHAR(6),
    IN yr NUMERIC(4,0)
)
BEGIN
    INSERT INTO takes (ID, course_id, sec_id, semester, year, grade)
    VALUES (s_id, c_id, sec, sem, yr, NULL);
END;
//

DELIMITER ;

CALL register_student('00138','CS-101','1','Fall','2024');

-- 6. The Salary Cap

DELIMITER //

CREATE TRIGGER check_salary
BEFORE INSERT ON instructor
FOR EACH ROW
BEGIN
    IF NEW.salary > 150000 THEN
        SET NEW.salary = 150000;
    END IF;
END;
//

DELIMITER 

-- check 
INSERT INTO instructor 
VALUES ('33333', 'Rahim', 'Comp. Sci.', 200000);

-- 7. Automating Total credits
Drop trigger if exists update_tot_cred;
DELIMITER //

CREATE TRIGGER update_tot_cred
AFTER UPDATE ON takes
FOR EACH ROW
BEGIN

    IF OLD.grade IS NULL AND NEW.grade IN ('A', 'B', 'C') THEN
        
        UPDATE student
        SET tot_cred = tot_cred + (
            SELECT credits
            FROM course
            WHERE course_id = NEW.course_id
        )
        WHERE ID = NEW.ID;

    END IF;
END;
//

DELIMITER ;

INSERT INTO student VALUES ('00001', 'Messi', 'Biology', 0);
INSERT INTO course VALUES ('CS-100', 'DBMS', 'Biology', 3);
INSERT INTO section VALUES ('CS-100', '5', 'Spring', 2026);

CALL register_student('00001', 'CS-100', '5', 'Spring', 2026);

UPDATE takes
SET grade = 'C'
WHERE ID = '00001' 
  AND course_id = 'CS-100'
  AND sec_id = '5'
  AND semester = 'Spring'
  AND year = 2026;


SELECT * FROM student WHERE ID = '00001';

drop procedure if exists get_dept_student;
DELIMITER //
create procedure get_dept_student( )
 
 begin 
    select ID,name,tot_cred
    from student
    where dept_name='Comp. Sci.';
    END //
DELIMITER ;
    
    call get_dept_student()
 

DELIMITER //

create trigger check_valid_grade
before insert on takes
for each row
 begin
	if new.grade != 'A' or new.grade != 'B' or new.grade != 'C' or new.grade != null
    then
     SIGNAL SQLSTATE '45000'
    set message_text = 'PUT right grade';
    
    end if;
    end
//
delimiter ;



INSERT INTO takes (ID, course_id, sec_id, semester, year, grade)
VALUES ('12345', 'BIO-101', '1', 'Fall', 2024, 'X');
course
drop trigger if exists update_tot_cred;

create trigger update_tot_cred
after update on takes
for each row
begin
	if new.grade in ('A','B','C') 
    where (select ID from takes
    
DELIMITER //


drop procedure if exists adjust_budget;
create procedure adjust_budget(
IN P_dept_name varchar(30) , 
IN P_percent numeric(4,0)
)
begin 
     update department
     set budget=budget * P_percent
end //
     
DELIMITER ;

drop procedure if exists get_dept_student;
DELIMITER //
create procedure get_dept_student( )
 
 begin 
    select ID,name,tot_cred
    from student
    where dept_name='Comp. Sci.';
    END //
DELIMITER ;
    