package com.realty_app.listing_service.service.geo;

import com.realty_app.listing_service.model.City;
import com.realty_app.listing_service.model.District;
import org.springframework.stereotype.Component;

@Component
public class AddressFormatter {

    public String format(City city, District district, String street, String houseNumber) {
        StringBuilder address = new StringBuilder();

        address.append(city.getName());

        if (district != null) {
            address.append(", ").append(district.getName());
        }

        address.append(", ").append(street);
        address.append(", ").append(houseNumber);

        return address.toString();
    }
}
