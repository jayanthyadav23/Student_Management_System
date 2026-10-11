package com.sms.studentmanagementsystem.dto.audit;

import java.time.Instant;

public record AuditLogResponse(
        Long id,
        String action,
        String performedBy,
        String targetResource,
        String details,
        Instant timestamp
) {}
