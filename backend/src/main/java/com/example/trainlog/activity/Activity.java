package com.example.trainlog.activity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "activity")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sport;

    private Instant startTime;
    private Double totalDistanceMeters;
    private Double totalElapsedSeconds;
    private Integer avgHeartRate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<TrackPoint> samples;

    protected Activity() {
    }

    public Activity(String sport, Instant startTime, Double totalDistanceMeters,
                    Double totalElapsedSeconds, Integer avgHeartRate, List<TrackPoint> samples) {
        this.sport = sport;
        this.startTime = startTime;
        this.totalDistanceMeters = totalDistanceMeters;
        this.totalElapsedSeconds = totalElapsedSeconds;
        this.avgHeartRate = avgHeartRate;
        this.samples = samples;
    }

    public record TrackPoint(
            long t,
            Double lat,
            Double lng,
            Integer hr,
            Double alt,
            Double spd,
            Double dist
    ) {}

    public Long getId() {
        return id;
    }

    public String getSport() {
        return sport;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public Double getTotalDistanceMeters() {
        return totalDistanceMeters;
    }

    public Double getTotalElapsedSeconds() {
        return totalElapsedSeconds;
    }

    public Integer getAvgHeartRate() {
        return avgHeartRate;
    }

    public List<TrackPoint> getSamples() {
        return samples;
    }
}
