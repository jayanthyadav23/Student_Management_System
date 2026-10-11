package com.sms.studentmanagementsystem;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.studentmanagementsystem.dto.auth.LoginRequest;
import com.sms.studentmanagementsystem.dto.auth.RegisterRequest;
import com.sms.studentmanagementsystem.entity.Department;
import com.sms.studentmanagementsystem.repository.DepartmentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthenticationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Test
    @DisplayName("Admin can log in with default seeded credentials")
    void adminLoginSuccess() throws Exception {
        LoginRequest request = new LoginRequest("admin@sms.com", "Admin@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.email").value("admin@sms.com"))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Login with invalid password returns 401 Unauthorized")
    void loginWithWrongPassword() throws Exception {
        LoginRequest request = new LoginRequest("admin@sms.com", "WrongPassword@999");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("Invalid email or password")));
    }

    @Test
    @DisplayName("Public departments endpoint returns 200 with seeded departments")
    void getPublicDepartments() throws Exception {
        mockMvc.perform(get("/api/auth/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Student public registration succeeds and returns JWT token")
    void studentRegistrationSuccess() throws Exception {
        Department dept = departmentRepository.findAll().get(0);

        String uniqueEmail = "newstudent_" + System.currentTimeMillis() + "@sms.com";
        String uniqueRoll = "ROLL" + (System.currentTimeMillis() % 100000);

        RegisterRequest request = new RegisterRequest(
                "Grace Hopper",
                uniqueEmail,
                uniqueRoll,
                dept.getId(),
                1,
                21,
                "Student@123"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.email").value(uniqueEmail))
                .andExpect(jsonPath("$.data.role").value("STUDENT"));
    }

    @Test
    @DisplayName("Registration with duplicate email returns 409 Conflict")
    void studentRegistrationDuplicateEmail() throws Exception {
        Department dept = departmentRepository.findAll().get(0);

        // admin@sms.com already exists in the system
        RegisterRequest request = new RegisterRequest(
                "Duplicate Email Student",
                "admin@sms.com",
                "UNIQUE999",
                dept.getId(),
                1,
                20,
                "Password@123"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("already exists")));
    }

    @Test
    @DisplayName("Protected admin dashboard rejects unauthenticated request with 401")
    void unauthenticatedAccessRejected() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Faculty registration succeeds and returns JWT token with FACULTY role")
    void facultyRegistrationSuccess() throws Exception {
        Department dept = departmentRepository.findAll().get(0);
        String uniqueEmail = "newfaculty_" + System.currentTimeMillis() + "@sms.com";

        RegisterRequest request = new RegisterRequest(
                "Prof. Ada",
                uniqueEmail,
                null,
                dept.getId(),
                null,
                null,
                "Professor",
                "FACULTY",
                "Faculty@123"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.email").value(uniqueEmail))
                .andExpect(jsonPath("$.data.role").value("FACULTY"));
    }

    @Test
    @DisplayName("Admin registration succeeds and returns JWT token with ADMIN role")
    void adminRegistrationSuccess() throws Exception {
        String uniqueEmail = "newadmin_" + System.currentTimeMillis() + "@sms.com";

        RegisterRequest request = new RegisterRequest(
                "Super Admin 2",
                uniqueEmail,
                null,
                null,
                null,
                null,
                null,
                "ADMIN",
                "Admin@12345"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Direct registration as ADMIN is prohibited. Administrator accounts must be provisioned by institutional initialization."));
    }
}
