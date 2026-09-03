package com.example.trainlog.fit;

import java.time.Instant;
import java.util.List;

public record ParsedActivity(
        String sport,
        Instant startTime,
        Double totalDistanceMeters,
        Double totalElapsedSeconds,
        Integer avgHeartRate,
        List<Sample> samples
) {
    public record Sample(
            Instant time,
            Double latitude,
            Double longitude,
            Integer heartRate,
            Double altitudeMeters,
            Double speedMetersPerSec,
            Double distanceMeters
    ) {}
}
