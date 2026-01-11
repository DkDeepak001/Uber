package com.uber.location_service.location_service.kafka.consumer;

import com.uber.location_service.location_service.dto.DriverLocationDto;
import com.uber.location_service.location_service.service.LocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class DriverSearchRequestConsumer {

    private final LocationService locationService;
    private final RestTemplate restTemplate;
    
    @Value("${socket.service.url}")
    private String socketServiceUrl; // Not final - injected via @Value

    @KafkaListener(topics = "${kafka.topic.driver-search-request}", groupId = "${spring.kafka.consumer.group-id}", containerFactory = "kafkaListenerContainerFactory")
    public void consumeDriverSearchRequest(com.uber.location_service.location_service.kafka.dto.DriverSearchRequestMessage message) {
        String identifier = message.getRequestId() != null ? message.getRequestId() : 
                           (message.getBookingId() != null ? "bookingId:" + message.getBookingId() : "unknown");
        log.info("Received driver search request: {}", identifier);
        
        // Search for nearby drivers using existing service
        List<DriverLocationDto> nearbyDrivers = locationService.searchNearBy(
            message.getPickupLongitude(), 
            message.getPickupLatitude()
        );
        
        if (nearbyDrivers.isEmpty()) {
            log.warn("No drivers found near ({}, {}) for {}", 
                    message.getPickupLatitude(), message.getPickupLongitude(), identifier);
            // Send empty response via socket service (which will forward to Kafka)
            sendRideRequestsToSocketService(message, List.of(), List.of());
            return;
        }
        
        // Extract driver IDs and prepare driver info
        List<String> driverIds = nearbyDrivers.stream()
                .map(DriverLocationDto::getDriverId)
                .collect(Collectors.toList());
        
        log.info("Found {} nearby drivers for {}, sending ride requests via socket", 
                driverIds.size(), identifier);
        
        // Send ride requests to drivers via socket service (with full driver info)
        sendRideRequestsToSocketService(message, nearbyDrivers, driverIds);
    }
    
    private void sendRideRequestsToSocketService(
            com.uber.location_service.location_service.kafka.dto.DriverSearchRequestMessage message,
            List<DriverLocationDto> driverLocations,
            List<String> driverIds) {
        
        try {
            // Prepare ride request DTO for socket service
            Map<String, Object> rideRequest = new HashMap<>();
            rideRequest.put("bookingId", message.getBookingId());
            rideRequest.put("requestId", message.getRequestId());
            rideRequest.put("userId", message.getUserId());
            rideRequest.put("pickupLatitude", message.getPickupLatitude());
            rideRequest.put("pickupLongitude", message.getPickupLongitude());
            rideRequest.put("dropoffLatitude", message.getDropoffLatitude());
            rideRequest.put("dropoffLongitude", message.getDropoffLongitude());
            rideRequest.put("price", message.getPrice());
            rideRequest.put("timeoutSeconds", 30L);
            rideRequest.put("driverIds", driverIds);
            
            // Convert driver locations to map format for socket service
            List<Map<String, Object>> driverList = driverLocations.stream()
                    .map(driver -> {
                        Map<String, Object> driverMap = new HashMap<>();
                        driverMap.put("driverId", driver.getDriverId());
                        driverMap.put("latitude", driver.getLatitude());
                        driverMap.put("longitude", driver.getLongitude());
                        return driverMap;
                    })
                    .collect(Collectors.toList());
            rideRequest.put("drivers", driverList);
            
            // Call socket service REST endpoint
            String url = socketServiceUrl + "/api/ride-requests/send";
            String response = restTemplate.postForObject(url, rideRequest, String.class);
            String identifier = message.getRequestId() != null ? message.getRequestId() : 
                               (message.getBookingId() != null ? "bookingId:" + message.getBookingId() : "unknown");
            log.info("Sent ride requests to socket service for {}, drivers: {}, response: {}", 
                    identifier, driverIds.size(), response);
            
        } catch (Exception e) {
            String identifier = message.getRequestId() != null ? message.getRequestId() : 
                               (message.getBookingId() != null ? "bookingId:" + message.getBookingId() : "unknown");
            log.error("Failed to send ride requests to socket service for {}", identifier, e);
            // TODO: Consider sending error response to booking service
        }
    }
}
