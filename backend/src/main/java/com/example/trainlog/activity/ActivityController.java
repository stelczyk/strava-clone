package com.example.trainlog.activity;

import com.example.trainlog.fit.FitParser;
import com.example.trainlog.fit.ParsedActivity;
import com.example.trainlog.user.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityRepository repository;
    private final FitParser fitParser = new FitParser();
    private final CurrentUser currentUser;

    public ActivityController(ActivityRepository repository, CurrentUser currentUser) {
        this.repository = repository;
        this.currentUser = currentUser;
    }

    @PostMapping
    public ActivitySummary upload(@RequestParam("file") MultipartFile file) throws IOException {
        ParsedActivity parsed = fitParser.parse(file.getInputStream());

        List<Activity.TrackPoint> points = parsed.samples().stream()
                .map(s -> new Activity.TrackPoint(
                        s.time().toEpochMilli(),
                        s.latitude(),
                        s.longitude(),
                        s.heartRate(),
                        s.altitudeMeters(),
                        s.speedMetersPerSec(),
                        s.distanceMeters()))
                .toList();

        Activity activity = new Activity(
                parsed.sport(),
                parsed.startTime(),
                parsed.totalDistanceMeters(),
                parsed.totalElapsedSeconds(),
                parsed.avgHeartRate(),
                points);
        activity.setUserId(currentUser.id());

        Activity saved = repository.save(activity);

        return new ActivitySummary(
                saved.getId(),
                saved.getSport(),
                saved.getTotalDistanceMeters(),
                saved.getSamples().size());
    }

    public record ActivitySummary(Long id, String sport, Double distanceMeters, int samplesCount) {}

    @GetMapping
    public List<ActivityListItem> list() {
        return repository.findByUserId(currentUser.id()).stream()
                .map(a -> new ActivityListItem(
                        a.getId(),
                        a.getSport(),
                        a.getStartTime(),
                        a.getTotalDistanceMeters(),
                        a.getTotalElapsedSeconds(),
                        a.getAvgHeartRate()))
                .toList();
    }

    @GetMapping("/{id}")
    public Activity get(@PathVariable Long id) {
        Activity activity = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!currentUser.id().equals(activity.getUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return activity;
    }

    public record ActivityListItem(Long id, String sport, Instant startTime,
                                   Double distanceMeters, Double elapsedSeconds,
                                   Integer avgHeartRate) {}
}
