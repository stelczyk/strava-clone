package com.example.trainlog.fit;

import com.garmin.fit.Decode;
import com.garmin.fit.DateTime;
import com.garmin.fit.MesgBroadcaster;
import com.garmin.fit.RecordMesg;
import com.garmin.fit.RecordMesgListener;
import com.garmin.fit.SessionMesg;
import com.garmin.fit.SessionMesgListener;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;


public class FitParser {

    private static final double SEMICIRCLE_TO_DEGREES = 180.0 / (1L << 31);

    public ParsedActivity parse(Path fitFile) throws IOException {
        try (InputStream in = Files.newInputStream(fitFile)) {
            return parse(in);
        }
    }

    public ParsedActivity parse(InputStream in) {
        List<ParsedActivity.Sample> samples = new ArrayList<>();
        List<SessionMesg> sessions = new ArrayList<>();

        Decode decode = new Decode();
        MesgBroadcaster broadcaster = new MesgBroadcaster(decode);
        broadcaster.addListener((RecordMesgListener) m -> samples.add(toSample(m)));
        broadcaster.addListener((SessionMesgListener) sessions::add);
        broadcaster.run(in);

        SessionMesg s = sessions.isEmpty() ? null : sessions.get(0);
        return new ParsedActivity(
                s == null || s.getSport() == null ? null : s.getSport().name().toLowerCase(),
                s == null ? null : instant(s.getStartTime()),
                s == null ? null : toDouble(s.getTotalDistance()),
                s == null ? null : toDouble(s.getTotalElapsedTime()),
                s == null || s.getAvgHeartRate() == null ? null : s.getAvgHeartRate().intValue(),
                samples
        );
    }

    private ParsedActivity.Sample toSample(RecordMesg m) {
        Float altitude = m.getEnhancedAltitude() != null ? m.getEnhancedAltitude() : m.getAltitude();
        Float speed = m.getEnhancedSpeed() != null ? m.getEnhancedSpeed() : m.getSpeed();
        return new ParsedActivity.Sample(
                instant(m.getTimestamp()),
                degrees(m.getPositionLat()),
                degrees(m.getPositionLong()),
                m.getHeartRate() == null ? null : m.getHeartRate().intValue(),
                toDouble(altitude),
                toDouble(speed),
                toDouble(m.getDistance())
        );
    }

    private static Instant instant(DateTime dt) {
        return dt == null ? null : dt.getDate().toInstant();
    }

    private static Double degrees(Integer semicircles) {
        return semicircles == null ? null : semicircles * SEMICIRCLE_TO_DEGREES;
    }

    private static Double toDouble(Float f) {
        return f == null ? null : f.doubleValue();
    }
}
