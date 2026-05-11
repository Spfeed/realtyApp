package com.realty_app.user_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class MediaWebConfig implements WebMvcConfigurer {

    @Value("${media.upload-path}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absolutePath = Path.of(uploadPath).toAbsolutePath().toUri().toString();

        registry.addResourceHandler("/users/media/**")
                .addResourceLocations(absolutePath);
    }
}
