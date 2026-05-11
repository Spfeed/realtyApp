package com.realty_app.application_service.service;

import com.realty_app.application_service.client.ListingClient;
import com.realty_app.application_service.dto.*;
import com.realty_app.application_service.event.ApplicationApprovedEvent;
import com.realty_app.application_service.kafka.ApplicationEventProducer;
import com.realty_app.application_service.model.ApplicationStatus;
import com.realty_app.application_service.model.RentalApplication;
import com.realty_app.application_service.repository.RentalApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private final RentalApplicationRepository applicationRepository;
    private final RestTemplate restTemplate;
    private final ApplicationEventProducer applicationEventProducer;
    private final ListingClient listingClient;

    //Создание заявки на аренду (id текущего пользователя)
    public ApplicationResponse create(
            CreateApplicationRequest request,
            Long currentUserId) {

        ListingOwnerResponse listingOwner = listingClient.getListingOwner(request.getListingId());

        if (listingOwner == null) {
            throw new RuntimeException("Объявление не найдено.");
        }

        if (listingOwner.getOwnerId().equals(currentUserId)) {
            throw new RuntimeException("Нельзя бронировать собственные объявления.");
        }

        if (applicationRepository.existsByUserIdAndListingId(currentUserId, request.getListingId())) {
            throw new RuntimeException("Такая заявка уже существует.");
        }

        RentalApplication application = RentalApplication.builder()
                .userId(currentUserId)
                .listingId(request.getListingId())
                .status(ApplicationStatus.PENDING)
                .build();

        RentalApplication saved = applicationRepository.save(application);

        applicationEventProducer.sendApplicationCreated(
                ApplicationCreatedEvent.builder()
                        .applicationId(saved.getId())
                        .listingId(saved.getListingId())
                        .ownerId(listingOwner.getOwnerId())
                        .applicantId(saved.getUserId())
                        .build()
        );

        return toResponse(saved);
    }

    //Просмотр собственных заявок
    public List<ApplicationResponse> getMyApplications(Long currentUserId) {
        return applicationRepository.findByUserId(currentUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    //Все заявки на объявление
    public List<ApplicationResponse> getByListingId(
            Long listingId,
            Long currentUserId
    ) {
        checkListingOwner(listingId, currentUserId);

        return applicationRepository.findByListingId(listingId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    //Подтверждение заявки
    public ApplicationResponse approve(
            Long applicationId,
            Long currentUserId
    ) {
        RentalApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Заявка не найдена"));

        checkListingOwner(application.getListingId(), currentUserId);

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new RuntimeException("Заявка уже обработана.");
        }

        //Одобрение выбранной заявки
        application.setStatus(ApplicationStatus.APPROVED);

        RentalApplication saved = applicationRepository.save(application);

        //Отклонение всех остальных заявок со статусом PENDING
        List<RentalApplication> otherPendingApplications =
                applicationRepository.findByListingIdAndIdNotAndStatus(
                        saved.getListingId(),
                        saved.getId(),
                        ApplicationStatus.PENDING
                );

        otherPendingApplications.forEach(other ->
                other.setStatus(ApplicationStatus.REJECTED)
        );

        applicationRepository.saveAll(otherPendingApplications);

        applicationEventProducer.sendApplicationApproved(
                ApplicationApprovedEvent.builder()
                        .applicationId(saved.getId())
                        .listingId(saved.getListingId())
                        .ownerId(currentUserId)
                        .applicantId(saved.getUserId())
                        .build()
        );

        return toResponse(saved);
    }

    //Отклонение заявки
    public ApplicationResponse reject(Long applicationId, Long currentUserId) {
        RentalApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Заявка не найдена"));

        checkListingOwner(application.getListingId(), currentUserId);

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new RuntimeException("Заявка уже обработана.");
        }

        application.setStatus(ApplicationStatus.REJECTED);

        return toResponse(applicationRepository.save(application));
    }

    //Есть ли заявка у пользователя на объект
    public ApplicationResponse getMyByListing(Long listingId, Long currentUserId) {
        return applicationRepository.findByUserIdAndListingId(currentUserId, listingId)
                .map(this::toResponse)
                .orElse(null);
    }

    public void cancel(Long applicationId, Long currentUserId) {

        RentalApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Заявка не найдена"));

        if (!application.getUserId().equals(currentUserId)) {
            throw new RuntimeException("Нельзя удалить чужую заявку");
        }

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new RuntimeException(
                    "Можно отменить только заявку в обработке"
            );
        }

        applicationRepository.delete(application);
    }

    //Проверка существования объявления и того, что статус меняет именно владалец
    private void checkListingOwner(Long listingId, Long currentUserId) {
        ListingOwnerResponse listingOwner = listingClient.getListingOwner(listingId);

        if (listingOwner == null) {
            throw new RuntimeException("Объявление с таким id не найдено");
        }

        if (!listingOwner.getOwnerId().equals(currentUserId)) {
            throw new RuntimeException("Только владелец объявления может управлять заявками.");
        }
    }

    //Служебный метод. Переводит сущность заявки в DTO.
    private ApplicationResponse toResponse(RentalApplication application) {
        return ApplicationResponse.builder()
                .id(application.getId())
                .userId(application.getUserId())
                .listingId(application.getListingId())
                .status(application.getStatus())
                .conversationId(application.getConversationId())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }
}
