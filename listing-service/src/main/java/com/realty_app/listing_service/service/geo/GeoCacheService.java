package com.realty_app.listing_service.service.geo;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.realty_app.listing_service.dto.geo.GeoCoordinates;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GeoCacheService {

    private static final Duration GEO_TTL = Duration.ofDays(30);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public Optional<GeoCoordinates> getGeoCoordinates(String address) {
        String key = buildAddressKey(address);
        String json = redisTemplate.opsForValue().get(key);

        if (json == null) {
            return Optional.empty();
        }

        try {
            return Optional.of(objectMapper.readValue(json, GeoCoordinates.class));
        } catch (Exception e) {
            redisTemplate.delete(key);
            return Optional.empty();
        }
    }

    public void saveCoordinates(String address, GeoCoordinates geoCoordinates) {
        try {
            String key = buildAddressKey(address);
            String json = objectMapper.writeValueAsString(geoCoordinates);

            redisTemplate.opsForValue().set(key, json, GEO_TTL);
        } catch (Exception e) {
            throw new RuntimeException("Ошибка сохранения координат в Redis", e);
        }
    }

    private String buildAddressKey(String address) {
        String normalized = address
                .trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ");

        return "geo:address:" + normalized;
    }
}
