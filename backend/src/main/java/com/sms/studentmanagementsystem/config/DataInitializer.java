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
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.facultyRepository = facultyRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
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
            demoFaculty = facultyRepository.save(demoFaculty);
            logger.info("Demo faculty member seeded successfully.");
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
            demoCourse = courseRepository.save(demoCourse);
            logger.info("Demo course CS101 seeded successfully.");
        }

        // 4. Seed Demo Student if no students exist
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
            Student savedStudent = studentRepository.save(demoStudent);

            // Enroll demo student into demo course
            if (demoCourse != null) {
                enrollmentRepository.save(new Enrollment(savedStudent, demoCourse));
                logger.info("Demo student enrolled into course CS101.");
            }
            logger.info("Demo student account and profile seeded successfully.");
        }
    }
}
