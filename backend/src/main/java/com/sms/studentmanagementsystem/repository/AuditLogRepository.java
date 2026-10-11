package com.sms.studentmanagementsystem.repository;

import com.sms.studentmanagementsystem.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findTop20ByOrderByTimestampDesc();

    List<AuditLog> findAllByOrderByTimestampDesc();
}
