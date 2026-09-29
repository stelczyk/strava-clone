package com.example.trainlog.activity;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class RecordsTest {

    private Activity.TrackPoint at(long tMs, double distM) {
        return new Activity.TrackPoint(tMs, null, null, null, null, null, distM);
    }

    @Test
    void znajdujeNajszybszyKilometr() {
        List<Activity.TrackPoint> samples = List.of(
                at(0, 0),
                at(300_000, 1000),
                at(560_000, 2000));

        assertEquals(260_000L, Records.bestEffort(samples, 1000));
    }

    @Test
    void zwracaNullGdyBiegKrotszyNizDystans() {
        List<Activity.TrackPoint> samples = List.of(
                at(0, 0),
                at(300_000, 1000));

        assertNull(Records.bestEffort(samples, 5000));
    }
}
