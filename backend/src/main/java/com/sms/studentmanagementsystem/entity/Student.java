package com.sms.studentmanagementsystem.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
        name = "students",
        indexes = {
                @Index(name = "idx_students_roll_number", columnList = "roll_number", unique = true),
                @Index(name = "idx_students_user_id", columnList = "user_id", unique = true),
                @Index(name = "idx_students_department_id", columnList = "department_id")
        }
)
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "roll_number", nullable = false, unique = true, length = 50)
    private String rollNumber;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private Integer age;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(nullable = false)
    private Integer semester;

    @Column(name = "academic_year", length = 20)
    private String academicYear = "2025-2026";

    @Column(name = "section", length = 20)
    private String section = "A";

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(length = 25)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(name = "enrollment_date", nullable = false, updatable = false)
    private LocalDate enrollmentDate;

    public Student() {
    }

    public Student(User user, String rollNumber, String name, Integer age, Department department, Integer semester) {
        this.user = user;
        this.rollNumber = rollNumber;
        this.name = name;
        this.age = age;
        this.department = department;
        this.semester = semester;
    }

    @PrePersist
    protected void onCreate() {
        if (this.enrollmentDate == null) {
            this.enrollmentDate = LocalDate.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getRollNumber() {
        return rollNumber;
    }

    public void setRollNumber(String rollNumber) {
        this.rollNumber = rollNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getSection() {
        return (section != null && !section.isBlank()) ? section : "A";
    }

    public void setSection(String section) {
        this.section = (section != null && !section.isBlank()) ? section : "A";
    }

    public String getStatus() {
        return (status != null && !status.isBlank()) ? status : "ACTIVE";
    }

    public void setStatus(String status) {
        this.status = (status != null && !status.isBlank()) ? status : "ACTIVE";
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public LocalDate getEnrollmentDate() {
        return enrollmentDate;
    }

    public void setEnrollmentDate(LocalDate enrollmentDate) {
        this.enrollmentDate = enrollmentDate;
    }
}
