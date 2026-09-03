package com.example.trainlog.fit;

import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FitParserTest {

    @Test
    void parsujePrzykladowyPlik() throws Exception {
        Path fit = Path.of(getClass().getResource("/sample.fit").toURI());

        ParsedActivity activity = new FitParser().parse(fit);

        System.out.println("Sport:           " + activity.sport());
        System.out.println("Start:           " + activity.startTime());
        System.out.println("Dystans (m):     " + activity.totalDistanceMeters());
        System.out.println("Czas (s):        " + activity.totalElapsedSeconds());
        System.out.println("Sr. tetno:       " + activity.avgHeartRate());
        System.out.println("Liczba probek:   " + activity.samples().size());
        System.out.println("Pierwsza probka: " + activity.samples().get(0));
        System.out.println("Ostatnia probka: " + activity.samples().get(activity.samples().size() - 1));

        assertFalse(activity.samples().isEmpty(), "powinny byc probki (rekordy)");
        assertNotNull(activity.samples().get(0).time(), "probka powinna miec czas");
        boolean maGps = activity.samples().stream()
                .anyMatch(p -> p.latitude() != null && p.longitude() != null);
        assertTrue(maGps, "przykladowa aktywnosc powinna miec dane GPS");
    }
}
