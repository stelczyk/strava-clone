package com.example.trainlog.activity;

import java.util.List;

public class Records {

    public static Long bestEffort(List<Activity.TrackPoint> samples, double distanceMeters) {
        List<Activity.TrackPoint> pts = samples.stream().filter(s -> s.dist() != null).toList();
        long best = Long.MAX_VALUE;
        int i = 0;
        for (int j = 0; j < pts.size(); j++) {
            while (pts.get(j).dist() - pts.get(i).dist() >= distanceMeters) {
                best = Math.min(best, pts.get(j).t() - pts.get(i).t());
                i++;
            }
        }
        return best == Long.MAX_VALUE ? null : best;
    }
}
