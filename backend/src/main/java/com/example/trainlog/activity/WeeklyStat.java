package com.example.trainlog.activity;

import java.time.LocalDate;

public interface WeeklyStat {
    LocalDate getWeekStart();
    String getSport();
    Double getDistanceMeters();
    Double getTimeSeconds();
    Long getActivityCount();
}
