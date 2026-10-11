package com.sms.studentmanagementsystem.config;

import com.sms.studentmanagementsystem.entity.*;
import com.sms.studentmanagementsystem.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final FacultyRepository facultyRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubjectRepository subjectRepository;
    private final TimetableRepository timetableRepository;
    private final AnnouncementRepository announcementRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@sms.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository,
                           DepartmentRepository departmentRepository,
                           FacultyRepository facultyRepository,
                           StudentRepository studentRepository,
                           CourseRepository courseRepository,
                           EnrollmentRepository enrollmentRepository,
                           SubjectRepository subjectRepository,
                           TimetableRepository timetableRepository,
                           AnnouncementRepository announcementRepository,
                           AuditLogRepository auditLogRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.facultyRepository = facultyRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.subjectRepository = subjectRepository;
        this.timetableRepository = timetableRepository;
        this.announcementRepository = announcementRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedDefaultAdmin();
        seedInitialDepartmentsAndDemoUsers();
    }

    private void seedDefaultAdmin() {
        String cleanEmail = adminEmail.trim().toLowerCase();

        if (userRepository.countByRole(Role.ADMIN) == 0 && !userRepository.existsByEmail(cleanEmail)) {
            logger.info("No ADMIN found in database. Seeding initial super admin account: {}", cleanEmail);

            User adminUser = new User(
                    cleanEmail,
                    passwordEncoder.encode(adminPassword),
                    Role.ADMIN,
                    true
            );

            userRepository.save(adminUser);
            logger.info("Default super admin created successfully with email: {}", cleanEmail);
        } else {
            logger.info("Super admin account already exists. Seeding skipped.");
        }
    }

    private void seedInitialDepartmentsAndDemoUsers() {
        // 1. Seed Core Academic Departments if none exist
        Department cseDept;
        if (departmentRepository.count() == 0) {
            logger.info("No departments found. Seeding initial academic departments...");
            cseDept = departmentRepository.save(new Department("Computer Science & Engineering", "CSE"));
            departmentRepository.save(new Department("Electronics & Communication Engineering", "ECE"));
            departmentRepository.save(new Department("Mechanical Engineering", "MECH"));
            departmentRepository.save(new Department("Information Technology", "IT"));
            logger.info("Initial academic departments seeded successfully.");
        } else {
            cseDept = departmentRepository.findAll().get(0);
        }

        // 2. Seed Demo Faculty Member if no faculty exist
        Faculty demoFaculty = null;
        String facultyEmail = "faculty@sms.com";
        if (facultyRepository.count() == 0 && !userRepository.existsByEmail(facultyEmail)) {
            logger.info("No faculty members found. Seeding initial demo faculty account: {}", facultyEmail);
            User facultyUser = new User(
                    facultyEmail,
                    passwordEncoder.encode("Faculty@123"),
                    Role.FACULTY,
                    true
            );
            User savedFacultyUser = userRepository.save(facultyUser);

            demoFaculty = new Faculty(
                    savedFacultyUser,
                    "Dr. Alan Turing",
                    "Associate Professor",
                    cseDept
            );
            demoFaculty.setSpecialization("Artificial Intelligence & Systems");
            demoFaculty.setPhone("+1-555-0199");
            demoFaculty.setOfficeRoom("Tech Block A-302");
            demoFaculty = facultyRepository.save(demoFaculty);
            logger.info("Demo faculty member seeded successfully.");
        } else if (facultyRepository.count() > 0) {
            demoFaculty = facultyRepository.findAll().get(0);
        }

        // 3. Seed Demo Course assigned to Faculty if no courses exist
        Course demoCourse = null;
        if (courseRepository.count() == 0 && demoFaculty != null) {
            logger.info("No courses found. Seeding initial course CS101...");
            demoCourse = new Course(
                    "CS101",
                    "Introduction to Computer Science",
                    4,
                    cseDept,
                    demoFaculty,
                    1
            );
            demoCourse.setDescription("Foundational concepts of computing, programming paradigms, and computational problem solving.");
            demoCourse = courseRepository.save(demoCourse);
            logger.info("Demo course CS101 seeded successfully.");
        } else if (courseRepository.count() > 0) {
            demoCourse = courseRepository.findAll().get(0);
        }

        // 4. Seed Demo Subjects if none exist
        Subject demoSubject = null;
        if (subjectRepository.count() == 0 && demoCourse != null && demoFaculty != null) {
            logger.info("No subjects found. Seeding core academic subjects...");
            demoSubject = subjectRepository.save(new Subject(
                    "CS201",
                    "Data Structures & Algorithms",
                    4,
                    "THEORY",
                    cseDept,
                    demoCourse,
                    demoFaculty,
                    1
            ));
            subjectRepository.save(new Subject(
                    "CS202",
                    "Database Management Systems",
                    3,
                    "THEORY",
                    cseDept,
                    demoCourse,
                    demoFaculty,
                    1
            ));
            subjectRepository.save(new Subject(
                    "CS203L",
                    "Data Structures Laboratory",
                    2,
                    "PRACTICAL",
                    cseDept,
                    demoCourse,
                    demoFaculty,
                    1
            ));
            logger.info("Academic subjects seeded successfully.");
        } else if (subjectRepository.count() > 0) {
            demoSubject = subjectRepository.findAll().get(0);
        }

        // 5. Seed Demo Student if no students exist
        String studentEmail = "student@sms.com";
        String studentRollNumber = "CS2026001";
        if (studentRepository.count() == 0 && !userRepository.existsByEmail(studentEmail) && !studentRepository.existsByRollNumber(studentRollNumber)) {
            logger.info("No students found. Seeding initial demo student: {}", studentEmail);
            User studentUser = new User(
                    studentEmail,
                    passwordEncoder.encode("Student@123"),
                    Role.STUDENT,
                    true
            );
            User savedStudentUser = userRepository.save(studentUser);

            Student demoStudent = new Student(
                    savedStudentUser,
                    studentRollNumber,
                    "Ada Lovelace",
                    20,
                    cseDept,
                    1
            );
            demoStudent.setAcademicYear("2025-2026");
            demoStudent.setPhone("+1-555-0144");
            demoStudent.setAddress("42 Innovation Way, Tech Campus");
            Student savedStudent = studentRepository.save(demoStudent);

            // Enroll demo student into demo course
            if (demoCourse != null) {
                enrollmentRepository.save(new Enrollment(savedStudent, demoCourse));
                logger.info("Demo student enrolled into course CS101.");
            }
            logger.info("Demo student account and profile seeded successfully.");
        }

        // 6. Seed Timetable slots if none exist
        if (timetableRepository.count() == 0 && demoCourse != null && demoSubject != null && demoFaculty != null) {
            logger.info("Seeding initial timetable schedule...");
            timetableRepository.save(new TimetableEntry(
                    "MONDAY", "09:00 AM", "10:00 AM", "LH-101",
                    cseDept, 1, demoCourse, demoSubject, demoFaculty
            ));
            timetableRepository.save(new TimetableEntry(
                    "WEDNESDAY", "10:15 AM", "11:15 AM", "LH-101",
                    cseDept, 1, demoCourse, demoSubject, demoFaculty
            ));
            timetableRepository.save(new TimetableEntry(
                    "FRIDAY", "02:00 PM", "04:00 PM", "Lab-2",
                    cseDept, 1, demoCourse, demoSubject, demoFaculty
            ));
            logger.info("Timetable slots seeded successfully.");
        }

        // 7. Seed Announcements if none exist
        if (announcementRepository.count() == 0) {
            logger.info("Seeding initial announcements...");
            announcementRepository.save(new Announcement(
                    "Welcome to the Academic Management Portal",
                    "Welcome students and faculty to the upgraded EduManage institutional portal. Please check your assigned courses, subjects, and weekly schedules.",
                    "ALL",
                    "GENERAL",
                    null,
                    "Office of Academic Affairs",
                    true
            ));
            announcementRepository.save(new Announcement(
                    "Mid-Term Examination Schedule Announced",
                    "The mid-term examination timetable for Semester 1 will commence next month. Detailed subject-wise schedules are now published.",
                    "STUDENT",
                    "EXAM",
                    cseDept,
                    "Examination Cell",
                    false
            ));
            logger.info("Initial announcements seeded successfully.");
        }

        // 8. Seed Initial Audit Log if none exist
        if (auditLogRepository.count() == 0) {
            auditLogRepository.save(new AuditLog(
                    "SYSTEM_INIT",
                    "System Engine",
                    "Institutional Catalog",
                    "Academic departments, default super admin, courses, and timetable initialized."
            ));
        }
    }
}
