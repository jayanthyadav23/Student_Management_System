package com.sms.studentmanagementsystem.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "marks",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_mark_enrollment_exam", columnNames = {"enrollment_id", "exam_type"})
        },
        indexes = {
                @Index(name = "idx_marks_enrollment_id", columnList = "enrollment_id"),
                @Index(name = "idx_marks_exam_type", columnList = "exam_type")
        }
)
public class Mark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false, length = 20)
    private ExamType examType;

    @Column(nullable = false)
    private Double score;

    @Column(name = "max_score", nullable = false)
    private Double maxScore;

    public Mark() {
    }

    public Mark(Enrollment enrollment, ExamType examType, Double score, Double maxScore) {
        this.enrollment = enrollment;
        this.examType = examType;
        this.score = score;
        this.maxScore = maxScore;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Enrollment getEnrollment() {
        return enrollment;
    }

    public void setEnrollment(Enrollment enrollment) {
        this.enrollment = enrollment;
    }

    public ExamType getExamType() {
        return examType;
    }

    public void setExamType(ExamType examType) {
        this.examType = examType;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public Double getMaxScore() {
        return maxScore;
    }

    public void setMaxScore(Double maxScore) {
        this.maxScore = maxScore;
    }
}
