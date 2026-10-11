package com.sms.studentmanagementsystem.service;

import com.sms.studentmanagementsystem.dto.auth.AuthResponse;
import com.sms.studentmanagementsystem.dto.auth.LoginRequest;
import com.sms.studentmanagementsystem.dto.auth.RegisterRequest;
import com.sms.studentmanagementsystem.dto.auth.UserSummaryResponse;
import com.sms.studentmanagementsystem.dto.department.DepartmentResponse;

import java.util.List;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    UserSummaryResponse getCurrentUser();

    List<DepartmentResponse> getPublicDepartments();
}
