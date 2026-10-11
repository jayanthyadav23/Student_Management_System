package com.sms.studentmanagementsystem.service.impl;

import com.sms.studentmanagementsystem.dto.audit.AuditLogResponse;
import com.sms.studentmanagementsystem.entity.AuditLog;
import com.sms.studentmanagementsystem.repository.AuditLogRepository;
import com.sms.studentmanagementsystem.service.AuditLogService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional
    public void logAction(String action, String performedBy, String targetResource, String details) {
        AuditLog log = new AuditLog(action, performedBy, targetResource, details);
        auditLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getRecentLogs() {
        return auditLogRepository.findTop20ByOrderByTimestampDesc().stream()
                .map(log -> new AuditLogResponse(
                        log.getId(),
                        log.getAction(),
                        log.getPerformedBy(),
                        log.getTargetResource(),
                        log.getDetails(),
                        log.getTimestamp()
                ))
                .toList();
    }
}
