package com.realty_app.listing_service;

import com.realty_app.listing_service.model.City;
import com.realty_app.listing_service.model.District;
import com.realty_app.listing_service.repository.CityRepository;
import com.realty_app.listing_service.repository.DistrictRepository;
import com.realty_app.listing_service.repository.ListingRepository;
import com.realty_app.listing_service.security.UserPrincipal;
import com.realty_app.listing_service.service.geo.OverpassNearbyService;
import com.realty_app.listing_service.service.geo.YandexGeocodingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Principal;
import java.util.Optional;

import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class ListingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private DistrictRepository districtRepository;

    @Autowired
    private ListingRepository listingRepository;

    @MockitoBean
    private YandexGeocodingService yandexGeocodingService;

    @MockitoBean
    private OverpassNearbyService overpassNearbyService;

    private City city;
    private District district;

    @BeforeEach
    void setUp() {
        listingRepository.deleteAll();
        districtRepository.deleteAll();
        cityRepository.deleteAll();

        city = cityRepository.save(
                City.builder()
                        .name("Москва")
                        .build()
        );

        district = districtRepository.save(
                District.builder()
                        .name("Центральный")
                        .city(city)
                        .build()
        );
    }

    @Test
    void create_shouldCreateListingThroughController() throws Exception {
        when(yandexGeocodingService.geocode(anyString()))
                .thenReturn(Optional.empty());

        String json = """
                {
                  "title": "Тестовая квартира",
                  "description": "Описание квартиры",
                  "area": 45.5,
                  "price": 40000,
                  "utilitiesIncluded": true,
                  "depositAmount": 20000,
                  "cityId": %d,
                  "districtId": %d,
                  "street": "Ленина",
                  "houseNumber": "10",
                  "floor": 3,
                  "hasElevator": true,
                  "livingRuleIds": []
                }
                """.formatted(city.getId(), district.getId());

        mockMvc.perform(post("/listings")
                        .principal(authentication(5L, "USER"))
                        .contentType(APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title").value("Тестовая квартира"))
                .andExpect(jsonPath("$.ownerId").value(5))
                .andExpect(jsonPath("$.cityName").value("Москва"))
                .andExpect(jsonPath("$.districtName").value("Центральный"))
                .andExpect(jsonPath("$.status").value("ON_MODERATION"));
    }

    @Test
    void getById_shouldReturnCreatedListingForOwner() throws Exception {
        when(yandexGeocodingService.geocode(anyString()))
                .thenReturn(Optional.empty());

        String json = """
                {
                  "title": "Квартира для получения",
                  "description": "Описание квартиры",
                  "area": 50,
                  "price": 45000,
                  "utilitiesIncluded": false,
                  "depositAmount": 15000,
                  "cityId": %d,
                  "districtId": %d,
                  "street": "Пушкина",
                  "houseNumber": "20",
                  "floor": 4,
                  "hasElevator": true,
                  "livingRuleIds": []
                }
                """.formatted(city.getId(), district.getId());

        String responseBody = mockMvc.perform(post("/listings")
                        .principal(authentication(5L, "USER"))
                        .contentType(APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long listingId = Long.valueOf(
                responseBody.replaceAll(".*\"id\":(\\d+).*", "$1")
        );

        mockMvc.perform(get("/listings/" + listingId)
                        .principal(authentication(5L, "USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(listingId))
                .andExpect(jsonPath("$.title").value("Квартира для получения"))
                .andExpect(jsonPath("$.ownerId").value(5));
    }

    private Principal authentication(Long userId, String role) {
        UserPrincipal principal = mock(UserPrincipal.class);

        when(principal.getUserId()).thenReturn(userId);
        when(principal.getRole()).thenReturn(role);

        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                java.util.List.of()
        );
    }
}