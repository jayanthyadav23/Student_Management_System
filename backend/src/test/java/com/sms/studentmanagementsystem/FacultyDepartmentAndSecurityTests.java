package com.sms.studentmanagementsystem;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.studentmanagementsystem.dto.attendance.BulkAttendanceRequest;
import com.sms.studentmanagementsystem.dto.attendance.StudentAttendanceEntry;
import com.sms.studentmanagementsystem.dto.auth.LoginRequest;
import com.sms.studentmanagementsystem.dto.course.CourseAssignFacultyRequest;
import com.sms.studentmanagementsystem.dto.course.CourseRequest;
import com.sms.studentmanagementsystem.dto.enrollment.EnrollmentRequest;
import com.sms.studentmanagementsystem.dto.marks.BatchMarkEntryRequest;
import com.sms.studentmanagementsystem.dto.marks.StudentMarkEntry;
import com.sms.studentmanagementsystem.dto.student.StudentCreateRequest;
import com.sms.studentmanagementsystem.entity.*;
import com.sms.studentmanagementsystem.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class FacultyDepartmentAndSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private MarkRepository markRepository;

    private String adminToken;
    private String facultyToken;
    private Department cseDept;
    private Department eceDept;
    private Faculty cseFaculty;
    private Course cseCourse;

    @BeforeEach
    void setUp() throws Exception {
        // Obtain Admin Token
        LoginRequest adminLogin = new LoginRequest("admin@sms.com", "Admin@123");
        MvcResult adminRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode adminJson = objectMapper.readTree(adminRes.getResponse().getContentAsString());
        adminToken = adminJson.get("data").get("token").asText();

        // Obtain Faculty Token
        LoginRequest facultyLogin = new LoginRequest("faculty@sms.com", "Faculty@123");
        MvcResult facultyRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(facultyLogin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode facultyJson = objectMapper.readTree(facultyRes.getResponse().getContentAsString());
        facultyToken = facultyJson.get("data").get("token").asText();

        // Lookup Departments
        cseDept = departmentRepository.findByCode("CSE").orElseGet(() -> departmentRepository.save(new Department("Computer Science", "CSE")));
        eceDept = departmentRepository.findByCode("ECE").orElseGet(() -> departmentRepository.save(new Department("Electronics", "ECE")));

        // Lookup Demo Faculty and Course
        cseFaculty = facultyRepository.findByUserEmail("faculty@sms.com").orElseThrow();
        cseCourse = courseRepository.findByCode("CS101").orElseThrow();
    }

    @Test
    @DisplayName("1. Faculty can log in and receives ROLE_FACULTY token")
    void facultyLoginSuccess() throws Exception {
        LoginRequest facultyLogin = new LoginRequest("faculty@sms.com", "Faculty@123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(facultyLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("faculty@sms.com"))
                .andExpect(jsonPath("$.data.role").value("FACULTY"));
    }

    @Test
    @DisplayName("2. Faculty automatically sees only students belonging to their department")
    void facultyDepartmentScopedStudentListing() throws Exception {
        // Create an ECE student via Admin if not present
        if (studentRepository.findByRollNumber("ECE999").isEmpty()) {
            StudentCreateRequest eceStudentReq = new StudentCreateRequest(
                    "ECE999", "ECE Student", "ecestudent999@sms.com", "Pass@123",
                    21, eceDept.getId(), 2, "2025-2026", "ACTIVE", "1234567890", "ECE Block"
            );
            mockMvc.perform(post("/api/students")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(eceStudentReq)))
                    .andExpect(status().isCreated());
        }

        // Faculty (CSE) queries students list
        MvcResult result = mockMvc.perform(get("/api/students")
                        .header("Authorization", "Bearer " + facultyToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode studentList = json.get("data").get("content");
        assertTrue(studentList.size() > 0, "Faculty should see department students");

        // Assert all returned students belong to CSE
        for (JsonNode student : studentList) {
            assertEquals(cseDept.getId().longValue(), student.get("departmentId").asLong(),
                    "Student department must match faculty department");
            assertNotEquals("ECE999", student.get("rollNumber").asText(),
                    "ECE student must not appear in CSE faculty listing");
        }
    }

    @Test
    @DisplayName("3. Faculty cannot query unrelated department students (returns 403 Forbidden)")
    void facultyCannotQueryAnotherDepartmentStudents() throws Exception {
        mockMvc.perform(get("/api/students")
                        .param("departmentId", String.valueOf(eceDept.getId()))
                        .header("Authorization", "Bearer " + facultyToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("4. Admin assigning a faculty to a course in a mismatched department is rejected (400 Bad Request)")
    void adminAssignFacultyDepartmentMismatchRejected() throws Exception {
        // Create a course in ECE
        String testCourseCode = "ECE201_" + System.currentTimeMillis();
        Course eceCourse = courseRepository.save(new Course(testCourseCode, "Signals & Systems", 4, eceDept, null, 3));

        // Try to assign CSE faculty to ECE course
        CourseAssignFacultyRequest assignReq = new CourseAssignFacultyRequest(cseFaculty.getId());
        mockMvc.perform(put("/api/admin/courses/" + eceCourse.getId() + "/assign-faculty")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Department mismatch")));
    }

    @Test
    @DisplayName("5. Enrolling a student in a course of a different department is rejected (400 Bad Request)")
    void studentCourseEnrollmentDepartmentMismatchRejected() throws Exception {
        // Create an ECE student
        String roll = "ECE_TST_" + System.currentTimeMillis();
        String email = "ecetst" + System.currentTimeMillis() + "@sms.com";
        StudentCreateRequest eceStudentReq = new StudentCreateRequest(
                roll, "Electronics Candidate", email, "Pass@123",
                20, eceDept.getId(), 2, "2025-2026", "ACTIVE", "1234567890", "ECE Lab"
        );
        MvcResult res = mockMvc.perform(post("/api/students")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(eceStudentReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Long studentId = objectMapper.readTree(res.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Try to enroll this ECE student into CS101 (CSE course)
        EnrollmentRequest enrollmentReq = new EnrollmentRequest(studentId, cseCourse.getId());
        mockMvc.perform(post("/api/students/enroll")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(enrollmentReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Department mismatch")));
    }

    @Test
    @DisplayName("6. Faculty recording bulk attendance, updates, and duplicate prevention")
    void facultyAttendanceWorkflowAndDuplicatePrevention() throws Exception {
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(cseCourse.getId());
        assertFalse(enrollments.isEmpty(), "CS101 must have at least one enrollment");
        Enrollment enrollment = enrollments.get(0);

        LocalDate today = LocalDate.now();

        // Record Attendance: PRESENT with remarks
        StudentAttendanceEntry entry = new StudentAttendanceEntry(enrollment.getId(), AttendanceStatus.PRESENT, "Attended on time");
        BulkAttendanceRequest bulkRequest = new BulkAttendanceRequest(today, List.of(entry));

        mockMvc.perform(post("/api/faculty/courses/" + cseCourse.getId() + "/attendance")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bulkRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.records[0].status").value("PRESENT"))
                .andExpect(jsonPath("$.data.records[0].remarks").value("Attended on time"))
                .andExpect(jsonPath("$.data.records[0].attendancePercentage").isNumber());

        // Update Attendance correction on same date: change to LATE
        StudentAttendanceEntry correctedEntry = new StudentAttendanceEntry(enrollment.getId(), AttendanceStatus.LATE, "Traffic delay");
        BulkAttendanceRequest correctedBulkRequest = new BulkAttendanceRequest(today, List.of(correctedEntry));

        mockMvc.perform(post("/api/faculty/courses/" + cseCourse.getId() + "/attendance")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(correctedBulkRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.records[0].status").value("LATE"))
                .andExpect(jsonPath("$.data.records[0].remarks").value("Traffic delay"));

        // Verify in database: exactly 1 attendance record exists for this enrollment and date
        List<Attendance> saved = attendanceRepository.findByCourseIdAndDate(cseCourse.getId(), today);
        long countForEnrollment = saved.stream().filter(a -> a.getEnrollment().getId().equals(enrollment.getId())).count();
        assertEquals(1, countForEnrollment, "Duplicate attendance records must be prevented");
    }

    @Test
    @DisplayName("7. Faculty marks entry, score validation, and standard grading calculation")
    void facultyMarksWorkflowAndGradingCalculation() throws Exception {
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(cseCourse.getId());
        assertFalse(enrollments.isEmpty(), "CS101 must have enrolled students");
        Enrollment enrollment = enrollments.get(0);

        // Validation: score exceeding maxScore is rejected (400 Bad Request)
        StudentMarkEntry invalidScore = new StudentMarkEntry(enrollment.getId(), 110.0, 100.0);
        BatchMarkEntryRequest invalidBatch = new BatchMarkEntryRequest(ExamType.FINAL, 100.0, List.of(invalidScore));

        mockMvc.perform(post("/api/faculty/courses/" + cseCourse.getId() + "/marks/batch")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidBatch)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot exceed maximum score")));

        // Valid submission: score 92 / 100 with remarks -> Grade 'O'
        StudentMarkEntry validScore = new StudentMarkEntry(enrollment.getId(), 92.0, 92.0, 100.0, "Outstanding performance");
        BatchMarkEntryRequest validBatch = new BatchMarkEntryRequest(ExamType.FINAL, 100.0, List.of(validScore));

        mockMvc.perform(post("/api/faculty/courses/" + cseCourse.getId() + "/marks/batch")
                        .header("Authorization", "Bearer " + facultyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validBatch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.marks[0].score").value(92.0))
                .andExpect(jsonPath("$.data.marks[0].grade").value("O"))
                .andExpect(jsonPath("$.data.marks[0].remarks").value("Outstanding performance"))
                .andExpect(jsonPath("$.data.entries").isArray());
    }

    @Test
    @DisplayName("8. Student listing with pagination, sorting by name, and getAllStudentsList")
    void studentListingAndSortingTests() throws Exception {
        // Admin: GET /api/students with sortBy=name&sortDir=asc
        mockMvc.perform(get("/api/students")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "name")
                        .param("sortDir", "asc")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());

        // Admin: GET /api/students/all
        mockMvc.perform(get("/api/students/all")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        // Faculty: GET /api/students with sortBy=name&sortDir=asc
        mockMvc.perform(get("/api/students")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "name")
                        .param("sortDir", "asc")
                        .header("Authorization", "Bearer " + facultyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());

        // Faculty: GET /api/students/all
        mockMvc.perform(get("/api/students/all")
                        .header("Authorization", "Bearer " + facultyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }
}
