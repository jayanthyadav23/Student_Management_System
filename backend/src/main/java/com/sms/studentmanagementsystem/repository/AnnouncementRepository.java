package com.sms.studentmanagementsystem.repository;

import com.sms.studentmanagementsystem.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findAllByOrderByPinnedDescCreatedAtDesc();

    @Query("SELECT a FROM Announcement a WHERE a.targetRole = 'ALL' OR a.targetRole = :role ORDER BY a.pinned DESC, a.createdAt DESC")
    List<Announcement> findByTargetRoleOrderByPinnedDescCreatedAtDesc(@Param("role") String role);

    List<Announcement> findTop5ByOrderByCreatedAtDesc();
}
