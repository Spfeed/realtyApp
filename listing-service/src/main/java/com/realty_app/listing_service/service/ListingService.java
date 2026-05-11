package com.realty_app.listing_service.service;

import com.realty_app.listing_service.dto.*;
import com.realty_app.listing_service.dto.geo.GeoCoordinates;
import com.realty_app.listing_service.model.*;
import com.realty_app.listing_service.repository.CityRepository;
import com.realty_app.listing_service.repository.DistrictRepository;
import com.realty_app.listing_service.repository.ListingRepository;
import com.realty_app.listing_service.repository.LivingRuleRepository;
import com.realty_app.listing_service.service.geo.AddressFormatter;
import com.realty_app.listing_service.service.geo.GeoCacheService;
import com.realty_app.listing_service.service.geo.YandexGeocodingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ListingService {
    private final ListingRepository listingRepository;
    private final CityRepository cityRepository;
    private final DistrictRepository districtRepository;
    private final LivingRuleRepository livingRuleRepository;
    private final AddressFormatter addressFormatter;
    private final YandexGeocodingService yandexGeocodingService;

    //Создание объявления
    public ListingResponse create(CreateListingRequest request, Long ownerId) {
        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new RuntimeException("Город с таким id не найден."));

        District district = null;

        if (request.getDistrictId() != null) {
            district = districtRepository.findByIdAndCityId(
                    request.getDistrictId(),
                    request.getCityId()
            ).orElseThrow(() -> new RuntimeException("Район в указанном городе не найден"));
        }

        List<LivingRule> rules = List.of();

        if(request.getLivingRuleIds() != null && !request.getLivingRuleIds().isEmpty()) {
            rules = livingRuleRepository.findAllByIdIn(request.getLivingRuleIds());

            if (rules.size() != request.getLivingRuleIds().size()) {
                throw new RuntimeException("Некоторые правила проживания не найдены.");
            }
        }

        String address = addressFormatter.format(
                city,
                district,
                request.getStreet(),
                request.getHouseNumber()
        );

        GeoCoordinates coordinates = yandexGeocodingService
                .geocode(address)
                .orElse(null);

        Listing listing = Listing.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .area(request.getArea())
                .price(request.getPrice())
                .utilitiesIncluded(request.getUtilitiesIncluded())
                .depositAmount(request.getDepositAmount())
                .ownerId(ownerId)
                .city(city)
                .district(district)
                .street(request.getStreet())
                .houseNumber(request.getHouseNumber())
                .livingRules(new HashSet<>(rules))
                .status(ListingStatus.ON_MODERATION)
                .latitude(coordinates != null ? coordinates.getLatitude() : null)
                .longitude(coordinates != null ? coordinates.getLongitude() : null)
                .floor(request.getFloor())
                .hasElevator(request.getHasElevator())
                .build();

        Listing saved = listingRepository.save(listing);

        return toResponse(saved);
    }

    public ListingResponse update(
            Long listingId,
            UpdateListingRequest request,
            Long currentUserId,
            String role
    ) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Объявление не найдено"
                ));

        checkCanManageListing(listing, currentUserId, role);

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Город с таким id не найден"
                ));

        District district = null;

        if (request.getDistrictId() != null) {
            district = districtRepository.findByIdAndCityId(
                    request.getDistrictId(),
                    request.getCityId()
            ).orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Район в указанном городе не найден"
            ));
        }

        List<LivingRule> rules = List.of();

        if (request.getLivingRuleIds() != null && !request.getLivingRuleIds().isEmpty()) {
            rules = livingRuleRepository.findAllByIdIn(request.getLivingRuleIds());

            if (rules.size() != request.getLivingRuleIds().size()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Некоторые правила проживания не найдены"
                );
            }
        }

        listing.setTitle(request.getTitle());
        listing.setDescription(request.getDescription());
        listing.setArea(request.getArea());
        listing.setPrice(request.getPrice());
        listing.setUtilitiesIncluded(request.getUtilitiesIncluded());
        listing.setDepositAmount(request.getDepositAmount());
        listing.setCity(city);
        listing.setDistrict(district);
        listing.setStreet(request.getStreet());
        listing.setHouseNumber(request.getHouseNumber());
        listing.setFloor(request.getFloor());
        listing.setHasElevator(request.getHasElevator());

        String address = addressFormatter.format(
                city,
                district,
                request.getStreet(),
                request.getHouseNumber()
        );

        GeoCoordinates coordinates = yandexGeocodingService
                .geocode(address)
                .orElse(null);

        if (coordinates != null) {
            listing.setLatitude(coordinates.getLatitude());
            listing.setLongitude(coordinates.getLongitude());
        }

        listing.setLivingRules(new HashSet<>(rules));

        if (listing.getStatus() == ListingStatus.REJECTED) {
            listing.setStatus(ListingStatus.ON_MODERATION);
            listing.setRejectionReason(null);
        }

        Listing saved = listingRepository.save(listing);

        return toResponse(saved);
    }

    public void delete(Long listingId, Long currentUserId, String role) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Объявление не найдено"
                ));

        checkCanManageListing(listing, currentUserId, role);

        listingRepository.delete(listing);
    }

    //Поиск объявления по его id
    public ListingResponse getById(Long id, Long currentUserId, String role) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Объявление с таким id не найдено"
                ));

        boolean isPublic = isPublicStatus(listing.getStatus());
        boolean isOwner = currentUserId != null && listing.getOwnerId().equals(currentUserId);
        boolean isStaff = isModeratorOrAdmin(role);

        if (!isPublic && !isOwner && !isStaff) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Объявление недоступно"
            );
        }

        return toResponse(listing);
    }

    //Все объявления
    public List<ListingResponse> getAll() {
        return listingRepository.findByStatusIn(List.of(
                        ListingStatus.ACTIVE,
                        ListingStatus.RENTED
                ))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    //Все объявления владельца с указанным id
    public List<ListingResponse> getByOwnerId(Long ownerId) {
        return listingRepository.findByOwnerIdAndStatusNot(ownerId, ListingStatus.DELETED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public Listing getEntityById(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Объявление не найдено"
                ));
    }

    //Объявления по фильтрам: цена, город, район, площадь, ЖКХ, залог.
    public List<ListingResponse> filter(ListingFilterRequest filter) {
        Specification<Listing> spec = (root, query, cb) -> cb.conjunction();

        spec = spec.and((root, query, cb) ->
                root.get("status").in(ListingStatus.ACTIVE, ListingStatus.RENTED)
        );

        if (filter.getDistrictId() != null && filter.getCityId() == null) {
            throw new RuntimeException("Для фильтрации по району нужно выбрать город.");
        }

        if (filter.getCityId() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("city").get("id"), filter.getCityId())
            );
        }

        if (filter.getDistrictId() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("district").get("id"), filter.getDistrictId())
            );
        }

        if (filter.getMinPrice() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("price"), filter.getMinPrice())
            );
        }

        if (filter.getMaxPrice() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("price"), filter.getMaxPrice())
            );
        }

        if (filter.getMinArea() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("area"), filter.getMinArea())
            );
        }

        if (filter.getMaxArea() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("area"), filter.getMaxArea())
            );
        }

        if (filter.getUtilitiesIncluded() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("utilitiesIncluded"), filter.getUtilitiesIncluded())
            );
        }

        if (filter.getMaxDepositAmount() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("depositAmount"), filter.getMaxDepositAmount())
            );
        }

        if (filter.getMinFloor() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("floor"), filter.getMinFloor())
            );
        }

        if (filter.getMaxFloor() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("floor"), filter.getMaxFloor())
            );
        }

        if (filter.getHasElevator() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("hasElevator"), filter.getHasElevator())
            );
        }

        return listingRepository.findAll(spec)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public void markAsRented(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Объявление с таким id не найдено."));

        listing.setStatus(ListingStatus.RENTED);

        listingRepository.save(listing);
    }

    public List<ListingResponse> getListingsForModeration() {
        return listingRepository.findByStatus(ListingStatus.ON_MODERATION)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ListingResponse approve(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Объявление не найдено"
                ));

        listing.setStatus(ListingStatus.ACTIVE);
        listing.setRejectionReason(null);

        return toResponse(listingRepository.save(listing));
    }

    public ListingResponse reject(Long listingId, RejectListingRequest request) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Объявление не найдено"
                ));

        listing.setStatus(ListingStatus.REJECTED);
        listing.setRejectionReason(request.getReason().trim());

        return toResponse(listingRepository.save(listing));
    }

    public ListingOwnerResponse getListingOwner(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Объявление не найдено"
                ));

        return new ListingOwnerResponse(listing.getId(), listing.getOwnerId());
    }

    public List<MlListingResponse> getAllForMl() {
        return listingRepository.findAll()
                .stream()
                .map(listing -> MlListingResponse.builder()
                        .id(listing.getId())
                        .title(listing.getTitle())
                        .description(listing.getDescription())
                        .ownerId(listing.getOwnerId())
                        .cityId(listing.getCity().getId())
                        .districtId(
                                listing.getDistrict() != null
                                        ? listing.getDistrict().getId()
                                        : null
                        )
                        .price(listing.getPrice().doubleValue())
                        .area(listing.getArea().doubleValue())
                        .floor(listing.getFloor())
                        .hasElevator(listing.getHasElevator())
                        .utilitiesIncluded(listing.getUtilitiesIncluded())
                        .depositAmount(listing.getDepositAmount().doubleValue())
                        .status(listing.getStatus().name())
                        .livingRules(
                                listing.getLivingRules()
                                        .stream()
                                        .map(LivingRule::getName)
                                        .toList()
                        )
                        .build())
                .toList();
    }

    private boolean isModeratorOrAdmin(String role) {
        return "ADMIN".equals(role) || "MODERATOR".equals(role);
    }

    private boolean isPublicStatus(ListingStatus status) {
        return status == ListingStatus.ACTIVE || status == ListingStatus.RENTED;
    }

    private void checkCanManageListing(Listing listing, Long currentUserId, String role) {
        if (!listing.getOwnerId().equals(currentUserId) && !isModeratorOrAdmin(role)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "У вас нет прав на управление этим объявлением"
            );
        }
    }

    //Служебный метод, переводящий сущность из приложения в DTO-формат ListingResponse ответа от сервера
    private ListingResponse toResponse(Listing listing) {
        return ListingResponse.builder()
                .id(listing.getId())
                .title(listing.getTitle())
                .description(listing.getDescription())
                .area(listing.getArea())
                .price(listing.getPrice())
                .utilitiesIncluded(listing.getUtilitiesIncluded())
                .depositAmount(listing.getDepositAmount())
                .floor(listing.getFloor())
                .hasElevator(listing.getHasElevator())
                .ownerId(listing.getOwnerId())
                .cityId(listing.getCity().getId())
                .cityName(listing.getCity().getName())
                .districtId(listing.getDistrict() != null ? listing.getDistrict().getId() : null)
                .districtName(listing.getDistrict() != null ? listing.getDistrict().getName() : null)
                .street(listing.getStreet())
                .houseNumber(listing.getHouseNumber())
                .livingRules(
                        listing.getLivingRules()
                                .stream()
                                .map(LivingRule::getName)
                                .toList()
                )
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .status(listing.getStatus())
                .rejectionReason(listing.getRejectionReason())
                .latitude(listing.getLatitude())
                .longitude(listing.getLongitude())
                .build();

    }
}
