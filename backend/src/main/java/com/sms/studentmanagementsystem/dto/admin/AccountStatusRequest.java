package com.sms.studentmanagementsystem.dto.admin;

import jakarta.validation.constraints.NotNull;

public record AccountStatusRequest(
        @NotNull(message = "Enabled flag is required")
        Boolean enabled
) {}
