package com.example.trainlog.activity;

import com.example.trainlog.user.CurrentUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final ActivityRepository repository;
    private final CurrentUser currentUser;

    public StatsController(ActivityRepository repository, CurrentUser currentUser) {
        this.repository = repository;
        this.currentUser = currentUser;
    }

    @GetMapping("/weekly")
    public List<WeeklyStat> weekly() {
        return repository.weeklyBySport(currentUser.id());
    }
}
