package com.realty_app.listing_service.service.geo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.realty_app.listing_service.config.OverpassProperties;
import com.realty_app.listing_service.dto.geo.NearbyPlaceResponse;
import com.realty_app.listing_service.dto.geo.NearbyPlacesResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OverpassNearbyService {
    private final OverpassProperties overpassProperties;
    private final NearbyCacheService nearbyCacheService;
    private final ObjectMapper objectMapper;

    private final RestClient restClient = RestClient.create();

    public NearbyPlacesResponse getNearby(BigDecimal latitude, BigDecimal longitude) {
        int radiusMeters = overpassProperties.getRadiusMeters();

        return nearbyCacheService.get(latitude, longitude, radiusMeters)
                .orElseGet(() -> {
                    NearbyPlacesResponse response = requestOverpass(latitude, longitude, radiusMeters);
                    nearbyCacheService.save(latitude, longitude, radiusMeters, response);
                    return response;
                });
    }

    private NearbyPlacesResponse requestOverpass(
            BigDecimal latitude,
            BigDecimal longitude,
            int radiusMeters
    ) {
        String query = buildQuery(latitude, longitude, radiusMeters);

        RuntimeException lastException = null;

        for (String url : overpassProperties.getUrls()) {
            try {
                String response = restClient.post()
                        .uri(url)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body("data=" + query)
                        .retrieve()
                        .body(String.class);

                return parseResponse(response, latitude, longitude);
            } catch (Exception e) {
                lastException = new RuntimeException("Ошибка Overpass endpoint: " + url, e);
            }
        }

        throw lastException != null
                ? lastException
                : new RuntimeException("Не удалось получить POI из Overpass");
    }

    private String buildQuery(BigDecimal latitude, BigDecimal longitude, int radiusMeters) {
        String lat = latitude.toPlainString();
        String lon = longitude.toPlainString();

        return """
                [out:json][timeout:25];
                (
                  node["amenity"="school"](around:%s,%s,%s);
                  way["amenity"="school"](around:%s,%s,%s);
                
                  node["amenity"="kindergarten"](around:%s,%s,%s);
                  way["amenity"="kindergarten"](around:%s,%s,%s);
                
                  node["amenity"="university"](around:%s,%s,%s);
                  way["amenity"="university"](around:%s,%s,%s);
                  node["amenity"="college"](around:%s,%s,%s);
                  way["amenity"="college"](around:%s,%s,%s);
                
                  node["amenity"="hospital"](around:%s,%s,%s);
                  way["amenity"="hospital"](around:%s,%s,%s);
                  node["amenity"="clinic"](around:%s,%s,%s);
                  way["amenity"="clinic"](around:%s,%s,%s);
                
                  node["amenity"="pharmacy"](around:%s,%s,%s);
                  way["amenity"="pharmacy"](around:%s,%s,%s);
                
                  node["shop"="supermarket"](around:%s,%s,%s);
                  way["shop"="supermarket"](around:%s,%s,%s);
                  node["shop"="convenience"](around:%s,%s,%s);
                  way["shop"="convenience"](around:%s,%s,%s);
                
                  node["highway"="bus_stop"](around:%s,%s,%s);
                  node["railway"="tram_stop"](around:%s,%s,%s);
                  node["railway"="subway_entrance"](around:%s,%s,%s);
                  node["railway"="station"](around:%s,%s,%s);
                
                  node["leisure"="park"](around:%s,%s,%s);
                  way["leisure"="park"](around:%s,%s,%s);
                  node["leisure"="garden"](around:%s,%s,%s);
                  way["leisure"="garden"](around:%s,%s,%s);
                
                  node["amenity"="cafe"](around:%s,%s,%s);
                  way["amenity"="cafe"](around:%s,%s,%s);
                  node["amenity"="restaurant"](around:%s,%s,%s);
                  way["amenity"="restaurant"](around:%s,%s,%s);
                  node["amenity"="bar"](around:%s,%s,%s);
                  way["amenity"="bar"](around:%s,%s,%s);
                );
                out center tags;
                """.formatted(
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,

                radiusMeters, lat, lon,
                radiusMeters, lat, lon,

                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,

                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,

                radiusMeters, lat, lon,
                radiusMeters, lat, lon,

                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,

                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,

                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,

                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon,
                radiusMeters, lat, lon
        );
    }

    private NearbyPlacesResponse parseResponse(
            String response,
            BigDecimal sourceLatitude,
            BigDecimal sourceLongitude
    ) throws Exception {
        List<NearbyPlaceResponse> schools = new ArrayList<>();
        List<NearbyPlaceResponse> kindergartens = new ArrayList<>();
        List<NearbyPlaceResponse> universities = new ArrayList<>();
        List<NearbyPlaceResponse> hospitals = new ArrayList<>();
        List<NearbyPlaceResponse> pharmacies = new ArrayList<>();
        List<NearbyPlaceResponse> shops = new ArrayList<>();
        List<NearbyPlaceResponse> transport = new ArrayList<>();
        List<NearbyPlaceResponse> parks = new ArrayList<>();
        List<NearbyPlaceResponse> food = new ArrayList<>();

        JsonNode root = objectMapper.readTree(response);
        JsonNode elements = root.path("elements");

        if (!elements.isArray()) {
            return emptyResponse();
        }

        double srcLat = sourceLatitude.doubleValue();
        double srcLon = sourceLongitude.doubleValue();

        for (JsonNode element : elements) {
            NearbyPlaceResponse place = toPlace(element, srcLat, srcLon);

            if (place == null) {
                continue;
            }

            switch (place.getCategory()) {
                case "SCHOOL" -> schools.add(place);
                case "KINDERGARTEN" -> kindergartens.add(place);
                case "UNIVERSITY", "COLLEGE" -> universities.add(place);
                case "HOSPITAL", "CLINIC" -> hospitals.add(place);
                case "PHARMACY" -> pharmacies.add(place);
                case "SUPERMARKET", "CONVENIENCE" -> shops.add(place);
                case "BUS_STOP", "TRAM_STOP", "SUBWAY", "TRAIN_STATION" -> transport.add(place);
                case "PARK", "GARDEN" -> parks.add(place);
                case "CAFE", "RESTAURANT", "BAR" -> food.add(place);
            }
        }

        sortAndLimit(schools);
        sortAndLimit(kindergartens);
        sortAndLimit(universities);
        sortAndLimit(hospitals);
        sortAndLimit(pharmacies);
        sortAndLimit(shops);
        sortAndLimit(transport);
        sortAndLimit(parks);
        sortAndLimit(food);

        return NearbyPlacesResponse.builder()
                .schools(schools)
                .kindergartens(kindergartens)
                .universities(universities)
                .hospitals(hospitals)
                .pharmacies(pharmacies)
                .shops(shops)
                .transport(transport)
                .parks(parks)
                .food(food)
                .build();
    }

    private NearbyPlaceResponse toPlace(JsonNode element, double sourceLat, double sourceLon) {
        JsonNode tags = element.path("tags");

        String category = resolveCategory(tags);

        if (category == null) {
            return null;
        }

        Double lat = getLatitude(element);
        Double lon = getLongitude(element);

        if (lat == null || lon == null) {
            return null;
        }

        String name = tags.path("name").asText();

        if (name == null || name.isBlank()) {
            name = defaultName(category);
        }

        int distance = calculateDistanceMeters(sourceLat, sourceLon, lat, lon);

        return NearbyPlaceResponse.builder()
                .name(name)
                .category(category)
                .osmType(element.path("type").asText())
                .osmId(element.path("id").asLong())
                .latitude(BigDecimal.valueOf(lat))
                .longitude(BigDecimal.valueOf(lon))
                .distanceMeters(distance)
                .build();
    }

    private String resolveCategory(JsonNode tags) {
        String amenity = tags.path("amenity").asText();
        String shop = tags.path("shop").asText();
        String highway = tags.path("highway").asText();
        String railway = tags.path("railway").asText();
        String station = tags.path("station").asText();
        String leisure = tags.path("leisure").asText();

        if ("school".equals(amenity)) return "SCHOOL";
        if ("kindergarten".equals(amenity)) return "KINDERGARTEN";
        if ("university".equals(amenity)) return "UNIVERSITY";
        if ("college".equals(amenity)) return "COLLEGE";
        if ("hospital".equals(amenity)) return "HOSPITAL";
        if ("clinic".equals(amenity)) return "CLINIC";
        if ("pharmacy".equals(amenity)) return "PHARMACY";

        if ("supermarket".equals(shop)) return "SUPERMARKET";
        if ("convenience".equals(shop)) return "CONVENIENCE";

        if ("bus_stop".equals(highway)) return "BUS_STOP";
        if ("tram_stop".equals(railway)) return "TRAM_STOP";
        if ("subway_entrance".equals(railway)) return "SUBWAY";
        if ("station".equals(railway) && "subway".equals(station)) return "SUBWAY";
        if ("station".equals(railway)) return "TRAIN_STATION";

        if ("park".equals(leisure)) return "PARK";
        if ("garden".equals(leisure)) return "GARDEN";

        if ("cafe".equals(amenity)) return "CAFE";
        if ("restaurant".equals(amenity)) return "RESTAURANT";
        if ("bar".equals(amenity)) return "BAR";

        return null;
    }

    private Double getLatitude(JsonNode element) {
        if (element.has("lat")) {
            return element.path("lat").asDouble();
        }

        if (element.has("center")) {
            return element.path("center").path("lat").asDouble();
        }

        return null;
    }

    private Double getLongitude(JsonNode element) {
        if (element.has("lon")) {
            return element.path("lon").asDouble();
        }

        if (element.has("center")) {
            return element.path("center").path("lon").asDouble();
        }

        return null;
    }

    private void sortAndLimit(List<NearbyPlaceResponse> places) {
        places.sort(Comparator.comparing(NearbyPlaceResponse::getDistanceMeters));

        if (places.size() > 5) {
            places.subList(5, places.size()).clear();
        }
    }

    private NearbyPlacesResponse emptyResponse() {
        return NearbyPlacesResponse.builder()
                .schools(List.of())
                .kindergartens(List.of())
                .universities(List.of())
                .hospitals(List.of())
                .pharmacies(List.of())
                .shops(List.of())
                .transport(List.of())
                .parks(List.of())
                .food(List.of())
                .build();
    }

    private String defaultName(String category) {
        return switch (category) {
            case "SCHOOL" -> "Школа";
            case "KINDERGARTEN" -> "Детский сад";
            case "UNIVERSITY" -> "Университет";
            case "COLLEGE" -> "Колледж";
            case "HOSPITAL" -> "Больница";
            case "CLINIC" -> "Клиника";
            case "PHARMACY" -> "Аптека";
            case "SUPERMARKET" -> "Супермаркет";
            case "CONVENIENCE" -> "Магазин";
            case "BUS_STOP" -> "Остановка";
            case "TRAM_STOP" -> "Трамвайная остановка";
            case "SUBWAY" -> "Метро";
            case "TRAIN_STATION" -> "Станция";
            case "PARK" -> "Парк";
            case "GARDEN" -> "Сквер";
            case "CAFE" -> "Кафе";
            case "RESTAURANT" -> "Ресторан";
            case "BAR" -> "Бар";
            default -> "Место";
        };
    }

    private int calculateDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        final int earthRadiusMeters = 6371000;

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2)
                        * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return (int) Math.round(earthRadiusMeters * c);
    }
}
