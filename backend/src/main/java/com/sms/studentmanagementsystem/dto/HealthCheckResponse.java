package com.sms.studentmanagementsystem.dto;

public record HealthCheckResponse(
        String status,
        String serviceName,
        String version,
        String timestamp,
        String environment,
        String databaseStatus
) {}
