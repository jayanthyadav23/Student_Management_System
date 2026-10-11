package com.sms.studentmanagementsystem.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "audit_logs",
        indexes = {
                @Index(name = "idx_audit_logs_timestamp", columnList = "timestamp"),
                @Index(name = "idx_audit_logs_action", columnList = "action")
        }
)
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String action; // e.g. CREATE_STUDENT, DELETE_COURSE, UPDATE_MARKS

    @Column(name = "performed_by", nullable = false, length = 150)
    private String performedBy;

    @Column(name = "target_resource", length = 150)
    private String targetResource;

    @Column(length = 1000)
    private String details;

    @Column(nullable = false, updatable = false)
    private Instant timestamp;

    public AuditLog() {
    }

    public AuditLog(String action, String performedBy, String targetResource, String details) {
        this.action = action;
        this.performedBy = performedBy;
        this.targetResource = targetResource;
        this.details = details;
    }

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public String getTargetResource() {
        return targetResource;
    }

    public void setTargetResource(String targetResource) {
        this.targetResource = targetResource;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
