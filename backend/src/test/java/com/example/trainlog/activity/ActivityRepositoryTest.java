package com.example.trainlog.activity;

import com.example.trainlog.AbstractIntegrationTest;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ActivityRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    ActivityRepository repository;

    @Autowired
    EntityManager em;

    @Test
    @Transactional
    void zapisujeIczytaProbkiPrzezJsonb() {
        var points = List.of(
                new Activity.TrackPoint(1000L, 50.06, 19.94, 140, 210.0, 3.5, 0.0),
                new Activity.TrackPoint(2000L, 50.07, 19.95, 150, 212.0, 3.6, 12.0));
        var activity = new Activity("running", Instant.ofEpochMilli(1000L), 12.0, 2.0, 145, points);

        Long id = repository.save(activity).getId();

        em.flush();
        em.clear();

        Activity loaded = repository.findById(id).orElseThrow();
        assertEquals(2, loaded.getSamples().size());
        assertEquals(150, loaded.getSamples().get(1).hr());
        assertEquals(50.06, loaded.getSamples().get(0).lat());
    }
}
