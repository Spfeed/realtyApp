package com.realty_app.listing_service.controller;

import com.realty_app.listing_service.dto.reference.*;
import com.realty_app.listing_service.service.ReferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/references")
@RequiredArgsConstructor
public class ReferenceController {
    private final ReferenceService referenceService;

    @GetMapping("/cities")
    public List<CityResponse> getCities(){
        return referenceService.getCities();
    }

    @GetMapping("/cities/{cityId}/districts")
    public List<DistrictResponse> getDistricts(@PathVariable Long cityId){
        return referenceService.getDistrictsByCity(cityId);
    }

    @GetMapping("/living-rules")
    public List<LivingRuleResponse> getLivingRules(){
        return referenceService.getLivingRules();
    }

    @PostMapping("/admin/cities")
    @ResponseStatus(HttpStatus.CREATED)
    public CityResponse createCity(@Valid @RequestBody ReferenceNameRequest request) {
        return referenceService.createCity(request);
    }

    @PutMapping("/admin/cities/{cityId}")
    public CityResponse updateCity(
            @PathVariable Long cityId,
            @Valid @RequestBody ReferenceNameRequest request
    ) {
        return referenceService.updateCity(cityId, request);
    }

    @DeleteMapping("/admin/cities/{cityId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCity(@PathVariable Long cityId) {
        referenceService.deleteCity(cityId);
    }

    @PostMapping("/admin/districts")
    @ResponseStatus(HttpStatus.CREATED)
    public DistrictResponse createDistrict(@Valid @RequestBody DistrictRequest request) {
        return referenceService.createDistrict(request);
    }

    @PutMapping("/admin/districts/{districtId}")
    public DistrictResponse updateDistrict(
            @PathVariable Long districtId,
            @Valid @RequestBody DistrictRequest request
    ) {
        return referenceService.updateDistrict(districtId, request);
    }

    @DeleteMapping("/admin/districts/{districtId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDistrict(@PathVariable Long districtId) {
        referenceService.deleteDistrict(districtId);
    }

    @PostMapping("/admin/living-rules")
    @ResponseStatus(HttpStatus.CREATED)
    public LivingRuleResponse createLivingRule(@Valid @RequestBody ReferenceNameRequest request) {
        return referenceService.createLivingRule(request);
    }

    @PutMapping("/admin/living-rules/{ruleId}")
    public LivingRuleResponse updateLivingRule(
            @PathVariable Long ruleId,
            @Valid @RequestBody ReferenceNameRequest request
    ) {
        return referenceService.updateLivingRule(ruleId, request);
    }

    @DeleteMapping("/admin/living-rules/{ruleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLivingRule(@PathVariable Long ruleId) {
        referenceService.deleteLivingRule(ruleId);
    }
}
