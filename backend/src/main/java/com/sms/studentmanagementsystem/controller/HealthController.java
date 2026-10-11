package com.sms.studentmanagementsystem.controller;

import com.sms.studentmanagementsystem.dto.ApiResponse;
import com.sms.studentmanagementsystem.dto.HealthCheckResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Value("${spring.application.name:student-management-system}")
    private String applicationName;

    @Autowired(required = false)
    private DataSource dataSource;

    @GetMapping
    public ResponseEntity<ApiResponse<HealthCheckResponse>> checkHealth() {
        String dbStatus = checkDatabaseConnectivity();

        HealthCheckResponse healthData = new HealthCheckResponse(
                "UP",
                applicationName,
                "1.0.0",
                Instant.now().toString(),
                "Active - Phase 2 (Neon PostgreSQL Ready)",
                dbStatus
        );

        return ResponseEntity.ok(ApiResponse.success("Service is healthy and reachable", healthData));
    }

    private String checkDatabaseConnectivity() {
        if (dataSource == null) {
            return "DATABASE_NOT_CONFIGURED";
        }
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                return "CONNECTED (" + connection.getMetaData().getDatabaseProductName() + " "
                        + connection.getMetaData().getDatabaseProductVersion() + ")";
            }
            return "CONNECTION_INVALID";
        } catch (Exception e) {
            return "DISCONNECTED: " + e.getMessage();
        }
    }
}
