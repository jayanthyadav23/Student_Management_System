package com.sms.studentmanagementsystem.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "faculty",
        indexes = {
                @Index(name = "idx_faculty_user_id", columnList = "user_id", unique = true),
                @Index(name = "idx_faculty_department_id", columnList = "department_id")
        }
)
public class Faculty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String designation;

    @Column(length = 150)
    private String specialization = "General";

    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(length = 25)
    private String phone;

    @Column(name = "office_room", length = 50)
    private String officeRoom;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    public Faculty() {
    }

    public Faculty(User user, String name, String designation, Department department) {
        this.user = user;
        this.name = name;
        this.designation = designation;
        this.department = department;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
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

    public String getOfficeRoom() {
        return officeRoom;
    }

    public void setOfficeRoom(String officeRoom) {
        this.officeRoom = officeRoom;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }
}
