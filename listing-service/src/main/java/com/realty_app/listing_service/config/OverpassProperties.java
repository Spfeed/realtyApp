package com.realty_app.listing_service.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Data
@Component
@ConfigurationProperties(prefix = "overpass")
public class OverpassProperties {
    private List<String> urls;
    private int radiusMeters = 800;
}
