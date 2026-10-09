package com.example.trainlog.activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByUserId(Long userId);
    Page<ActivityListView> findByUserId(Long userId, Pageable pageable);
    Page<ActivityListView> findByUserIdAndSport(Long userId, String sport, Pageable pageable);

    @Query(value = """
        select (date_trunc('week', start_time at time zone 'Europe/Warsaw'))::date as weekStart,
               sport as sport,
               sum(total_distance_meters) as distanceMeters,
               sum(total_elapsed_seconds) as timeSeconds,
               count(*) as activityCount
        from activity
        where user_id = :userId
          and start_time is not null
          and start_time >= now() - interval '12 weeks'
        group by date_trunc('week', start_time at time zone 'Europe/Warsaw'), sport
        order by weekStart
        """, nativeQuery = true)
    List<WeeklyStat> weeklyBySport(@Param("userId") Long userId);
}
