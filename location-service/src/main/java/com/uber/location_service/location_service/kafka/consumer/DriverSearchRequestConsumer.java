package com.uber.location_service.location_service.kafka.consumer;

import com.uber.location_service.location_service.dto.DriverLocationDto;
import com.uber.location_service.location_service.kafka.dto.DriverLocationMessage;
import com.uber.location_service.location_service.kafka.dto.DriverSearchRequestMessage;
import com.uber.location_service.location_service.kafka.dto.DriverSearchResponseMessage;
import com.uber.location_service.location_service.kafka.producer.DriverSearchResponseProducer;
import com.uber.location_service.location_service.service.LocationService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@AllArgsConstructor
@Slf4j
public class DriverSearchRequestConsumer {

    private final LocationService locationService;
    private final DriverSearchResponseProducer responseProducer;

    @KafkaListener(topics = "${kafka.topic.driver-search-request}", groupId = "${spring.kafka.consumer.group-id}", containerFactory = "kafkaListenerContainerFactory")
    public void consumeDriverSearchRequest(DriverSearchRequestMessage message) {
        log.info("Received driver search request for bookingId: {}", message.getBookingId());
        
        // Search for nearby drivers using existing service
        List<DriverLocationDto> nearbyDrivers = locationService.searchNearBy(
            message.getPickupLongitude(), 
            message.getPickupLatitude()
        );
        
        // Convert to response message format
        List<DriverLocationMessage> driverMessages = nearbyDrivers.stream()
            .map(dto -> DriverLocationMessage.builder()
                .driverId(dto.getDriverId())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .build())
            .collect(Collectors.toList());
        
        // Build and send response
        DriverSearchResponseMessage response = DriverSearchResponseMessage.builder()
            .bookingId(message.getBookingId())
            .userId(message.getUserId())
            .drivers(driverMessages)
            .build();
        
        responseProducer.sendDriverSearchResponse(response);
        log.info("Sent driver search response with {} drivers for bookingId: {}", 
            driverMessages.size(), message.getBookingId());
    }
}
