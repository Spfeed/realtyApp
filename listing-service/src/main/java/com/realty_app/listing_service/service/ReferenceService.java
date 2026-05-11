package com.realty_app.listing_service.service;

import com.realty_app.listing_service.dto.reference.*;
import com.realty_app.listing_service.model.City;
import com.realty_app.listing_service.model.District;
import com.realty_app.listing_service.model.LivingRule;
import com.realty_app.listing_service.repository.CityRepository;
import com.realty_app.listing_service.repository.DistrictRepository;
import com.realty_app.listing_service.repository.LivingRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReferenceService {
    private final LivingRuleRepository livingRuleRepository;
    private final CityRepository cityRepository;
    private final DistrictRepository districtRepository;

    public CityResponse createCity(ReferenceNameRequest request) {
        City city = City.builder()
                .name(request.getName().trim())
                .build();

        return toCityResponse(cityRepository.save(city));
    }

    public CityResponse updateCity(Long cityId, ReferenceNameRequest request) {
        City city = cityRepository.findById(cityId)
                .orElseThrow(() -> new RuntimeException("Город не найден"));

        city.setName(request.getName().trim());

        return toCityResponse(cityRepository.save(city));
    }

    public void deleteCity(Long cityId) {
        cityRepository.deleteById(cityId);
    }

    public DistrictResponse createDistrict(DistrictRequest request) {
        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new RuntimeException("Город не найден"));

        District district = District.builder()
                .city(city)
                .name(request.getName().trim())
                .build();

        return toDistrictResponse(districtRepository.save(district));
    }

    public DistrictResponse updateDistrict(Long districtId, DistrictRequest request) {
        District district = districtRepository.findById(districtId)
                .orElseThrow(() -> new RuntimeException("Район не найден"));

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new RuntimeException("Город не найден"));

        district.setCity(city);
        district.setName(request.getName().trim());

        return toDistrictResponse(districtRepository.save(district));
    }

    public void deleteDistrict(Long districtId) {
        districtRepository.deleteById(districtId);
    }

    public LivingRuleResponse createLivingRule(ReferenceNameRequest request) {
        LivingRule rule = LivingRule.builder()
                .name(request.getName().trim())
                .build();

        return toLivingRuleResponse(livingRuleRepository.save(rule));
    }

    public LivingRuleResponse updateLivingRule(Long ruleId, ReferenceNameRequest request) {
        LivingRule rule = livingRuleRepository.findById(ruleId)
                .orElseThrow(() -> new RuntimeException("Правило не найдено"));

        rule.setName(request.getName().trim());

        return toLivingRuleResponse(livingRuleRepository.save(rule));
    }

    public void deleteLivingRule(Long ruleId) {
        livingRuleRepository.deleteById(ruleId);
    }

    public List<CityResponse> getCities() {
        return cityRepository.findAll()
                .stream()
                .map(this::toCityResponse)
                .toList();
    }

    public List<DistrictResponse> getDistrictsByCity(Long cityId) {
        return districtRepository.findByCityId(cityId)
                .stream()
                .map(this::toDistrictResponse)
                .toList();
    }

    public List<LivingRuleResponse> getLivingRules() {
        return livingRuleRepository.findAll()
                .stream()
                .map(this::toLivingRuleResponse)
                .toList();
    }

    private CityResponse toCityResponse(City city) {
        return new CityResponse(
                city.getId(),
                city.getName()
        );
    }

    private DistrictResponse toDistrictResponse(District district) {
        return new DistrictResponse(
                district.getId(),
                district.getCity().getId(),
                district.getName()
        );
    }

    private LivingRuleResponse toLivingRuleResponse(LivingRule livingRule) {
        return new LivingRuleResponse(
                livingRule.getId(),
                livingRule.getName()
        );
    }
}
