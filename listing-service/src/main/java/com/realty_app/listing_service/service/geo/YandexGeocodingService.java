package com.realty_app.listing_service.service.geo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.realty_app.listing_service.dto.geo.GeoCoordinates;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class YandexGeocodingService {
    private final GeoCacheService geoCacheService;
    private final ObjectMapper objectMapper;

    private final RestClient restClient = RestClient.create();

    @Value("${yandex.geocoder.api-key}")
    private String apiKey;

    @Value("${yandex.geocoder.url}")
    private String geocoderUrl;

    public Optional<GeoCoordinates> geocode(String address) {
        return geoCacheService.getGeoCoordinates(address)
                .or(() -> requestYandexAndCache(address));
    }

    private Optional<GeoCoordinates> requestYandexAndCache(String address) {

        System.out.println("YANDEX API KEY = " + apiKey);
        System.out.println("YANDEX API KEY is null = " + (apiKey == null));
        System.out.println("YANDEX API KEY is blank = " + (apiKey != null && apiKey.isBlank()));

        if (apiKey == null || apiKey.isBlank()) {
            return Optional.empty();
        }
        try {
            String response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("geocode-maps.yandex.ru")
                            .path("/1.x/")
                            .queryParam("apikey", apiKey)
                            .queryParam("geocode", address)
                            .queryParam("lang", "ru_RU")
                            .queryParam("format", "json")
                            .queryParam("results", 1)
                            .build()
                    )
                    .retrieve()
                    .body(String.class);

            GeoCoordinates coordinates = parseCoordinates(response);

            geoCacheService.saveCoordinates(address, coordinates);

            return Optional.of(coordinates);
        } catch (Exception e) {
            e.printStackTrace();
            return Optional.empty();
        }
    }

    private GeoCoordinates parseCoordinates(String response) throws Exception {
        JsonNode root = objectMapper.readTree(response);

        JsonNode featureMembers = root
                .path("response")
                .path("GeoObjectCollection")
                .path("featureMember");

        if (!featureMembers.isArray() || featureMembers.isEmpty()) {
            throw new RuntimeException("Яндекс не вернул координаты");
        }

        String pos = featureMembers.get(0)
                .path("GeoObject")
                .path("Point")
                .path("pos")
                .asText();

        if (pos == null || pos.isBlank()) {
            throw new RuntimeException("В ответе Яндекса нет Point.pos");
        }

        String[] parts = pos.split(" ");

        if (parts.length != 2) {
            throw new RuntimeException("Некорректный формат координат");
        }

        BigDecimal longitude = new BigDecimal(parts[0]);
        BigDecimal latitude = new BigDecimal(parts[1]);

        return new GeoCoordinates(latitude, longitude);
    }
}
