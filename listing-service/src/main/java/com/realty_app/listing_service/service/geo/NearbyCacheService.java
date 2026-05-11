package com.realty_app.listing_service.service.geo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.realty_app.listing_service.dto.geo.NearbyPlacesResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NearbyCacheService {
    private static final Duration TTL = Duration.ofDays(14);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public Optional<NearbyPlacesResponse> get(BigDecimal latitude, BigDecimal longitude, int radiusMeters) {
        String key = buildKey(latitude, longitude, radiusMeters);
        String json = redisTemplate.opsForValue().get(key);

        if (json == null) {
            return Optional.empty();
        }

        try {
            return Optional.of(objectMapper.readValue(json, NearbyPlacesResponse.class));
        } catch (Exception e) {
            redisTemplate.delete(key);
            return Optional.empty();
        }
    }

    public void save(BigDecimal latitude, BigDecimal longitude, int radiusMeters, NearbyPlacesResponse response) {
        try {
            String key = buildKey(latitude, longitude, radiusMeters);
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(key, json, TTL);
        } catch (Exception e) {
            throw new RuntimeException("Ошибка сохранения POI в Redis", e);
        }
    }

    private String buildKey(BigDecimal latitude, BigDecimal longitude, int radiusMeters) {
        BigDecimal lat = latitude.setScale(4, RoundingMode.HALF_UP);
        BigDecimal lon = longitude.setScale(4, RoundingMode.HALF_UP);

        return "geo:nearby:" + lat + ":" + lon + ":" + radiusMeters;
    }
}
