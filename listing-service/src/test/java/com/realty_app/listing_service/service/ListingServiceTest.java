package com.realty_app.listing_service.service;

import com.realty_app.listing_service.dto.CreateListingRequest;
import com.realty_app.listing_service.dto.ListingResponse;
import com.realty_app.listing_service.dto.UpdateListingRequest;
import com.realty_app.listing_service.dto.geo.GeoCoordinates;
import com.realty_app.listing_service.model.*;
import com.realty_app.listing_service.repository.CityRepository;
import com.realty_app.listing_service.repository.DistrictRepository;
import com.realty_app.listing_service.repository.ListingRepository;
import com.realty_app.listing_service.repository.LivingRuleRepository;
import com.realty_app.listing_service.service.geo.AddressFormatter;
import com.realty_app.listing_service.service.geo.YandexGeocodingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private CityRepository cityRepository;

    @Mock
    private DistrictRepository districtRepository;

    @Mock
    private LivingRuleRepository livingRuleRepository;

    @Mock
    private AddressFormatter addressFormatter;

    @Mock
    private YandexGeocodingService yandexGeocodingService;

    @InjectMocks
    private ListingService listingService;

    @Test
    void create_shouldCreateListingWithOnModerationStatus() {
        CreateListingRequest request = createRequest();

        City city = createCity();
        District district = createDistrict(city);
        LivingRule rule = createLivingRule();

        when(cityRepository.findById(1L)).thenReturn(Optional.of(city));
        when(districtRepository.findByIdAndCityId(10L, 1L)).thenReturn(Optional.of(district));
        when(livingRuleRepository.findAllByIdIn(List.of(100L))).thenReturn(List.of(rule));
        when(addressFormatter.format(city, district, "Ленина", "10"))
                .thenReturn("Москва, Центральный, Ленина, 10");
        when(yandexGeocodingService.geocode(anyString()))
                .thenReturn(Optional.of(new GeoCoordinates(
                        BigDecimal.valueOf(55.7558),
                        BigDecimal.valueOf(37.6173)
                )));

        when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> {
            Listing listing = invocation.getArgument(0);
            listing.setId(1L);
            return listing;
        });

        ListingResponse response = listingService.create(request, 5L);

        assertEquals(1L, response.getId());
        assertEquals("Квартира", response.getTitle());
        assertEquals(5L, response.getOwnerId());
        assertEquals(ListingStatus.ON_MODERATION, response.getStatus());
        assertEquals(BigDecimal.valueOf(55.7558), response.getLatitude());
        assertEquals(BigDecimal.valueOf(37.6173), response.getLongitude());

        ArgumentCaptor<Listing> captor = ArgumentCaptor.forClass(Listing.class);
        verify(listingRepository).save(captor.capture());

        Listing saved = captor.getValue();

        assertEquals(city, saved.getCity());
        assertEquals(district, saved.getDistrict());
        assertEquals(1, saved.getLivingRules().size());
    }

    @Test
    void create_shouldThrowException_whenDistrictDoesNotBelongToCity() {
        CreateListingRequest request = createRequest();

        City city = createCity();

        when(cityRepository.findById(1L)).thenReturn(Optional.of(city));
        when(districtRepository.findByIdAndCityId(10L, 1L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> listingService.create(request, 5L)
        );

        assertEquals("Район в указанном городе не найден", exception.getMessage());

        verify(listingRepository, never()).save(any());
    }

    @Test
    void update_shouldUpdateListing_whenUserIsOwner() {
        UpdateListingRequest request = updateRequest();

        City oldCity = createCity();
        District oldDistrict = createDistrict(oldCity);

        Listing listing = createListing(1L, 5L, oldCity, oldDistrict, ListingStatus.ACTIVE);

        City newCity = createCity();
        District newDistrict = createDistrict(newCity);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));
        when(cityRepository.findById(1L)).thenReturn(Optional.of(newCity));
        when(districtRepository.findByIdAndCityId(10L, 1L)).thenReturn(Optional.of(newDistrict));
        when(addressFormatter.format(newCity, newDistrict, "Пушкина", "20"))
                .thenReturn("Москва, Центральный, Пушкина, 20");
        when(yandexGeocodingService.geocode(anyString())).thenReturn(Optional.empty());
        when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ListingResponse response = listingService.update(1L, request, 5L, "USER");

        assertEquals("Обновленная квартира", response.getTitle());
        assertEquals(BigDecimal.valueOf(50000), response.getPrice());
        assertEquals("Пушкина", response.getStreet());

        verify(listingRepository).save(listing);
    }

    @Test
    void update_shouldThrowForbidden_whenUserIsNotOwner() {
        UpdateListingRequest request = updateRequest();

        City city = createCity();
        District district = createDistrict(city);

        Listing listing = createListing(1L, 5L, city, district, ListingStatus.ACTIVE);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> listingService.update(1L, request, 99L, "USER")
        );

        assertEquals(403, exception.getStatusCode().value());

        verify(listingRepository, never()).save(any());
    }

    @Test
    void getById_shouldThrowForbidden_whenListingIsNotPublicAndUserIsNotOwner() {
        City city = createCity();
        District district = createDistrict(city);

        Listing listing = createListing(1L, 5L, city, district, ListingStatus.ON_MODERATION);

        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> listingService.getById(1L, 99L, "USER")
        );

        assertEquals(403, exception.getStatusCode().value());
    }

    private CreateListingRequest createRequest() {
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Квартира");
        request.setDescription("Описание");
        request.setArea(BigDecimal.valueOf(45));
        request.setPrice(BigDecimal.valueOf(40000));
        request.setUtilitiesIncluded(true);
        request.setDepositAmount(BigDecimal.valueOf(20000));
        request.setCityId(1L);
        request.setDistrictId(10L);
        request.setStreet("Ленина");
        request.setHouseNumber("10");
        request.setFloor(3);
        request.setHasElevator(true);
        request.setLivingRuleIds(List.of(100L));
        return request;
    }

    private UpdateListingRequest updateRequest() {
        UpdateListingRequest request = new UpdateListingRequest();
        request.setTitle("Обновленная квартира");
        request.setDescription("Новое описание");
        request.setArea(BigDecimal.valueOf(50));
        request.setPrice(BigDecimal.valueOf(50000));
        request.setUtilitiesIncluded(false);
        request.setDepositAmount(BigDecimal.valueOf(25000));
        request.setCityId(1L);
        request.setDistrictId(10L);
        request.setStreet("Пушкина");
        request.setHouseNumber("20");
        request.setFloor(4);
        request.setHasElevator(true);
        request.setLivingRuleIds(List.of());
        return request;
    }

    private Listing createListing(
            Long id,
            Long ownerId,
            City city,
            District district,
            ListingStatus status
    ) {
        return Listing.builder()
                .id(id)
                .title("Старая квартира")
                .description("Старое описание")
                .area(BigDecimal.valueOf(40))
                .price(BigDecimal.valueOf(30000))
                .utilitiesIncluded(true)
                .depositAmount(BigDecimal.valueOf(10000))
                .ownerId(ownerId)
                .city(city)
                .district(district)
                .street("Старая")
                .houseNumber("1")
                .floor(2)
                .hasElevator(false)
                .livingRules(new java.util.HashSet<>())
                .status(status)
                .build();
    }

    private City createCity() {
        City city = new City();
        city.setId(1L);
        city.setName("Москва");
        return city;
    }

    private District createDistrict(City city) {
        District district = new District();
        district.setId(10L);
        district.setName("Центральный");
        district.setCity(city);
        return district;
    }

    private LivingRule createLivingRule() {
        LivingRule rule = new LivingRule();
        rule.setId(100L);
        rule.setName("Можно с животными");
        return rule;
    }
}