package com.example.trainlog.activity;

import java.time.Instant;

public interface ActivityListView {
    Long getId();
    String getSport();
    Instant getStartTime();
    Double getTotalDistanceMeters();
    Double getTotalElapsedSeconds();
    Integer getAvgHeartRate();
}
