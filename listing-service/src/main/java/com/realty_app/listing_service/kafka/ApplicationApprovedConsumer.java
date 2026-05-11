package com.realty_app.listing_service.kafka;

import com.realty_app.listing_service.event.ApplicationApprovedEvent;
import com.realty_app.listing_service.service.ListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ApplicationApprovedConsumer {
    private final ListingService listingService;

    @KafkaListener(topics = "application-approved", groupId = "listing-service")
    public void handle(ApplicationApprovedEvent event){
        listingService.markAsRented(event.getListingId());

        System.out.println(
                "Объявление " + event.getListingId()
                        + " помечено как RENTED из заявки "
                        + event.getApplicationId()
        );
    }
}
