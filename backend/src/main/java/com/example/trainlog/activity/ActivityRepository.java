package com.example.trainlog.activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByUserId(Long userId);
    Page<ActivityListView> findByUserId(Long userId, Pageable pageable);
    Page<ActivityListView> findByUserIdAndSport(Long userId, String sport, Pageable pageable);
}
