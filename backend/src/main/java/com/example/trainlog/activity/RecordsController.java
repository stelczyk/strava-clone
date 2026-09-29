package com.example.trainlog.activity;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/records")
public class RecordsController {

    private static final int[] DISTANCES = {1000, 5000, 10000};

    private final ActivityRepository repository;

    public RecordsController(ActivityRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public RecordsResponse records() {
        List<Activity> runs = repository.findAll().stream()
                .filter(a -> "running".equals(a.getSport()))
                .toList();

        List<BestEffort> efforts = new ArrayList<>();
        for (int distance : DISTANCES) {
            Long best = null;
            for (Activity a : runs) {
                Long effort = Records.bestEffort(a.getSamples(), distance);
                if (effort != null && (best == null || effort < best)) {
                    best = effort;
                }
            }
            efforts.add(new BestEffort(distance, best));
        }

        Double longest = runs.stream()
                .map(Activity::getTotalDistanceMeters)
                .filter(Objects::nonNull)
                .max(Double::compareTo)
                .orElse(null);

        return new RecordsResponse(efforts, longest);
    }

    public record BestEffort(int distanceMeters, Long timeMillis) {}
    public record RecordsResponse(List<BestEffort> bestEfforts, Double longestRunMeters) {}
}
