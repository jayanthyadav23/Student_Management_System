package com.sms.studentmanagementsystem.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "announcements",
        indexes = {
                @Index(name = "idx_announcements_role", columnList = "target_role"),
                @Index(name = "idx_announcements_created", columnList = "created_at")
        }
)
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 3000)
    private String content;

    @Column(name = "target_role", nullable = false, length = 20)
    private String targetRole = "ALL"; // ALL, STUDENT, FACULTY

    @Column(nullable = false, length = 30)
    private String category = "ACADEMIC"; // ACADEMIC, EXAM, EVENT, GENERAL

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department; // null means college-wide

    @Column(name = "author_name", nullable = false, length = 100)
    private String authorName = "College Administration";

    @Column(name = "is_pinned", nullable = false)
    private boolean pinned = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Announcement() {
    }

    public Announcement(String title, String content, String targetRole, String category, Department department, String authorName, boolean pinned) {
        this.title = title;
        this.content = content;
        this.targetRole = (targetRole != null && !targetRole.isBlank()) ? targetRole : "ALL";
        this.category = (category != null && !category.isBlank()) ? category : "ACADEMIC";
        this.department = department;
        this.authorName = (authorName != null && !authorName.isBlank()) ? authorName : "College Administration";
        this.pinned = pinned;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public boolean isPinned() {
        return pinned;
    }

    public void setPinned(boolean pinned) {
        this.pinned = pinned;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
