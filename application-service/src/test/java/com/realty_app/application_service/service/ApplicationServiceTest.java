package com.realty_app.application_service.service;

import com.realty_app.application_service.client.ListingClient;
import com.realty_app.application_service.dto.ApplicationResponse;
import com.realty_app.application_service.dto.CreateApplicationRequest;
import com.realty_app.application_service.dto.ListingOwnerResponse;
import com.realty_app.application_service.kafka.ApplicationEventProducer;
import com.realty_app.application_service.model.ApplicationStatus;
import com.realty_app.application_service.model.RentalApplication;
import com.realty_app.application_service.repository.RentalApplicationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private RentalApplicationRepository applicationRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ApplicationEventProducer applicationEventProducer;

    @Mock
    private ListingClient listingClient;

    @InjectMocks
    private ApplicationService applicationService;

    @Test
    void create_shouldCreateApplication_whenDataIsValid() {
        CreateApplicationRequest request = new CreateApplicationRequest();
        request.setListingId(10L);

        ListingOwnerResponse listingOwner = new ListingOwnerResponse();
        listingOwner.setListingId(10L);
        listingOwner.setOwnerId(5L);

        when(listingClient.getListingOwner(10L)).thenReturn(listingOwner);
        when(applicationRepository.existsByUserIdAndListingId(2L, 10L)).thenReturn(false);

        when(applicationRepository.save(any(RentalApplication.class))).thenAnswer(invocation -> {
            RentalApplication application = invocation.getArgument(0);
            application.setId(1L);
            return application;
        });

        ApplicationResponse response = applicationService.create(request, 2L);

        assertEquals(1L, response.getId());
        assertEquals(2L, response.getUserId());
        assertEquals(10L, response.getListingId());
        assertEquals(ApplicationStatus.PENDING, response.getStatus());

        verify(applicationRepository).save(any(RentalApplication.class));
        verify(applicationEventProducer).sendApplicationCreated(any());
    }

    @Test
    void create_shouldThrowException_whenUserTriesToApplyOwnListing() {
        CreateApplicationRequest request = new CreateApplicationRequest();
        request.setListingId(10L);

        ListingOwnerResponse listingOwner = new ListingOwnerResponse();
        listingOwner.setListingId(10L);
        listingOwner.setOwnerId(2L);

        when(listingClient.getListingOwner(10L)).thenReturn(listingOwner);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> applicationService.create(request, 2L)
        );

        assertEquals("Нельзя бронировать собственные объявления.", exception.getMessage());

        verify(applicationRepository, never()).save(any());
        verify(applicationEventProducer, never()).sendApplicationCreated(any());
    }

    @Test
    void create_shouldThrowException_whenApplicationAlreadyExists() {
        CreateApplicationRequest request = new CreateApplicationRequest();
        request.setListingId(10L);

        ListingOwnerResponse listingOwner = new ListingOwnerResponse();
        listingOwner.setListingId(10L);
        listingOwner.setOwnerId(5L);

        when(listingClient.getListingOwner(10L)).thenReturn(listingOwner);
        when(applicationRepository.existsByUserIdAndListingId(2L, 10L)).thenReturn(true);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> applicationService.create(request, 2L)
        );

        assertEquals("Такая заявка уже существует.", exception.getMessage());

        verify(applicationRepository, never()).save(any());
        verify(applicationEventProducer, never()).sendApplicationCreated(any());
    }

    @Test
    void approve_shouldApproveApplicationAndRejectOtherPendingApplications() {
        RentalApplication application = RentalApplication.builder()
                .id(1L)
                .userId(2L)
                .listingId(10L)
                .status(ApplicationStatus.PENDING)
                .build();

        RentalApplication otherApplication = RentalApplication.builder()
                .id(2L)
                .userId(3L)
                .listingId(10L)
                .status(ApplicationStatus.PENDING)
                .build();

        ListingOwnerResponse listingOwner = new ListingOwnerResponse();
        listingOwner.setListingId(10L);
        listingOwner.setOwnerId(5L);

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
        when(listingClient.getListingOwner(10L)).thenReturn(listingOwner);
        when(applicationRepository.save(application)).thenReturn(application);
        when(applicationRepository.findByListingIdAndIdNotAndStatus(
                10L,
                1L,
                ApplicationStatus.PENDING
        )).thenReturn(List.of(otherApplication));

        ApplicationResponse response = applicationService.approve(1L, 5L);

        assertEquals(ApplicationStatus.APPROVED, response.getStatus());
        assertEquals(ApplicationStatus.REJECTED, otherApplication.getStatus());

        verify(applicationRepository).save(application);
        verify(applicationRepository).saveAll(List.of(otherApplication));
        verify(applicationEventProducer).sendApplicationApproved(any());
    }

    @Test
    void approve_shouldThrowException_whenCurrentUserIsNotListingOwner() {
        RentalApplication application = RentalApplication.builder()
                .id(1L)
                .userId(2L)
                .listingId(10L)
                .status(ApplicationStatus.PENDING)
                .build();

        ListingOwnerResponse listingOwner = new ListingOwnerResponse();
        listingOwner.setListingId(10L);
        listingOwner.setOwnerId(5L);

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
        when(listingClient.getListingOwner(10L)).thenReturn(listingOwner);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> applicationService.approve(1L, 99L)
        );

        assertEquals("Только владелец объявления может управлять заявками.", exception.getMessage());

        verify(applicationRepository, never()).save(any());
        verify(applicationEventProducer, never()).sendApplicationApproved(any());
    }

    @Test
    void cancel_shouldDeleteApplication_whenApplicationBelongsToUserAndStatusIsPending() {
        RentalApplication application = RentalApplication.builder()
                .id(1L)
                .userId(2L)
                .listingId(10L)
                .status(ApplicationStatus.PENDING)
                .build();

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));

        applicationService.cancel(1L, 2L);

        verify(applicationRepository).delete(application);
    }

    @Test
    void cancel_shouldThrowException_whenUserTriesToCancelForeignApplication() {
        RentalApplication application = RentalApplication.builder()
                .id(1L)
                .userId(2L)
                .listingId(10L)
                .status(ApplicationStatus.PENDING)
                .build();

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> applicationService.cancel(1L, 99L)
        );

        assertEquals("Нельзя удалить чужую заявку", exception.getMessage());

        verify(applicationRepository, never()).delete(any());
    }
}