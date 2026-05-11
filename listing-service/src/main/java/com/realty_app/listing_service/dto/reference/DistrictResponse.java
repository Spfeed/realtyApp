package com.realty_app.listing_service.dto.reference;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DistrictResponse {
    Long id;
    Long cityId;
    String name;
}
