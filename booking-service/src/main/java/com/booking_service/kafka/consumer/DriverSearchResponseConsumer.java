package com.booking_service.kafka.consumer;

import com.booking_service.dto.CreateBookingRequestDto;
import com.booking_service.kafka.dto.DriverLocationMessage;
import com.booking_service.kafka.dto.DriverSearchResponseMessage;
import com.booking_service.service.BookingService;
import com.booking_service.service.RideRequestService;
import com.booking_service.repository.BookingRepository;
import com.booking_service.repository.DriverRepository;
import com.uber.entity.models.Booking;
import com.uber.entity.models.BookingStatus;
import com.uber.entity.models.Driver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.sql.Date;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
@RequiredArgsConstructor
public class DriverSearchResponseConsumer {

    private final BookingRepository bookingRepository;
    private final DriverRepository driverRepository;
    private final RideRequestService rideRequestService;
    private final BookingService bookingService;
    private final RestTemplate restTemplate;
    
    @Value("${socket.service.url:http://socket-service:8080}")
    private String socketServiceUrl; // Not final - injected via @Value

    @KafkaListener(topics = "${kafka.topic.driver-search-response}", groupId = "${spring.kafka.consumer.group-id}", containerFactory = "kafkaListenerContainerFactory")
    public void consumeDriverSearchResponse(DriverSearchResponseMessage message) {
        // Handle three scenarios:
        // 1. Initial driver search result (requestId present, bookingId null, multiple drivers) -> Store drivers
        // 2. Driver acceptance (requestId present, bookingId null, single driver, drivers already stored) -> Create booking
        // 3. Driver acceptance (bookingId present) -> Create/update booking
        
        if (message.getRequestId() != null && message.getBookingId() == null) {
            // Check if this is an acceptance (single driver and drivers already stored for this request)
            if (message.getDrivers() != null && message.getDrivers().size() == 1) {
                // Check if drivers were already stored for this request (indicates acceptance)
                // We check by trying to get stored drivers - if they exist, this is an acceptance
                List<com.booking_service.kafka.dto.DriverLocationMessage> storedDrivers = 
                    rideRequestService.getStoredDriversForRequest(message.getRequestId());
                
                log.debug("Checking acceptance: requestId={}, messageDriversCount=1, storedDrivers={}", 
                        message.getRequestId(), storedDrivers != null ? storedDrivers.size() : 0);
                
                if (storedDrivers != null && !storedDrivers.isEmpty()) {
                    // Drivers were already stored, so this single driver is an acceptance
                    log.info("✅ Detected driver acceptance: requestId={}, driverId={}, storedDriversCount={}", 
                            message.getRequestId(), message.getDrivers().get(0).getDriverId(), storedDrivers.size());
                    handleDriverAcceptance(message);
                    return; // IMPORTANT: Return here to prevent falling through to handleDriverSearchResult
                } else {
                    log.debug("Not an acceptance - no stored drivers found for requestId: {}", message.getRequestId());
                }
            }
            // Scenario 1: Initial driver search - store drivers for requestId
            log.debug("Processing as initial driver search result: requestId={}, driversCount={}", 
                    message.getRequestId(), message.getDrivers() != null ? message.getDrivers().size() : 0);
            handleDriverSearchResult(message);
        } else if (message.getDrivers() != null && !message.getDrivers().isEmpty()) {
            // Scenario 2: Driver accepted - create booking (bookingId present or other case)
            handleDriverAcceptance(message);
        } else {
            log.warn("Received empty driver list or invalid message: requestId={}, bookingId={}", 
                    message.getRequestId(), message.getBookingId());
        }
    }
    
    private void handleDriverSearchResult(DriverSearchResponseMessage message) {
        log.info("Received driver search result for requestId: {}, driversFound={}", 
                message.getRequestId(), message.getDrivers() != null ? message.getDrivers().size() : 0);
        
        // Double-check: if this is a single driver and drivers are already stored, it's an acceptance, not a search result
        if (message.getDrivers() != null && message.getDrivers().size() == 1) {
            List<com.booking_service.kafka.dto.DriverLocationMessage> storedDrivers = 
                rideRequestService.getStoredDriversForRequest(message.getRequestId());
            if (storedDrivers != null && !storedDrivers.isEmpty()) {
                log.warn("⚠️ Single driver message received but drivers already stored - treating as acceptance: requestId={}", 
                        message.getRequestId());
                handleDriverAcceptance(message);
                return;
            }
        }
        
        if (message.getDrivers() != null && !message.getDrivers().isEmpty()) {
            // Store drivers for this request
            rideRequestService.storeDriversForRequest(message.getRequestId(), message.getDrivers());
            
            log.info("Stored {} drivers for requestId: {}", message.getDrivers().size(), message.getRequestId());
            // Notify socket service to send WebSocket notification to client
            notifySocketService(message.getRequestId(), "Found " + message.getDrivers().size() + " nearby drivers. Waiting for acceptance...");
        } else {
            // Check if drivers were already stored (means this is a timeout, not initial "no drivers found")
            com.booking_service.dto.RideRequestDto rideRequest = rideRequestService.getRideRequest(message.getRequestId());
            if (rideRequest != null) {
                // Drivers were found earlier but request timed out
                log.warn("Ride request timed out for requestId: {} - no driver accepted", message.getRequestId());
                notifySocketService(message.getRequestId(), "Request timed out - no driver accepted. Please try again.");
                // Remove the timed out request
                rideRequestService.removeRideRequest(message.getRequestId());
            } else {
                // No drivers found initially
                log.warn("No drivers found for requestId: {}", message.getRequestId());
                notifySocketService(message.getRequestId(), "No nearby drivers found. Please try again later.");
            }
        }
    }
    
    private void handleDriverAcceptance(DriverSearchResponseMessage message) {
        String requestId = message.getRequestId();
        List<DriverLocationMessage> drivers = message.getDrivers();
        
        if (drivers == null || drivers.isEmpty()) {
            log.warn("No driver in acceptance message: requestId={}", requestId);
            return;
        }
        
        // Get the accepted driver (should be single driver in acceptance)
        DriverLocationMessage acceptedDriver = drivers.get(0);
        log.info("✅ Processing driver acceptance: driverId={}, requestId={}, messageDriversCount={}", 
                acceptedDriver.getDriverId(), requestId, drivers.size());
        
        // Get ride request details
        com.booking_service.dto.RideRequestDto rideRequest = rideRequestService.getRideRequest(requestId);
        if (rideRequest == null) {
            log.error("Ride request not found for requestId: {}", requestId);
            return;
        }
        
        // Get driver entity
        Optional<Driver> driverOptional = driverRepository.findById(Long.parseLong(acceptedDriver.getDriverId()));
        if (driverOptional.isEmpty()) {
            log.error("Driver not found in database: {}", acceptedDriver.getDriverId());
            return;
        }
        
            // Create booking from ride request
            try {
                CreateBookingRequestDto createBookingRequest = CreateBookingRequestDto.builder()
                    .userId(rideRequest.getUserId())
                    .pickupLatitude(rideRequest.getPickupLatitude())
                    .pickupLongitude(rideRequest.getPickupLongitude())
                    .dropoffLatitude(rideRequest.getDropoffLatitude())
                    .dropoffLongitude(rideRequest.getDropoffLongitude())
                    .pickupTime(rideRequest.getPickupTime() != null ? rideRequest.getPickupTime() : 
                        new Date(Instant.now().toEpochMilli()))
                    .build();
            
            // Create booking with the accepted driver
            com.booking_service.dto.CreateBookingResponseDto bookingResponse = 
                bookingService.createBookingWithDriver(
                    createBookingRequest, 
                    Long.parseLong(acceptedDriver.getDriverId()), 
                    rideRequest.getEstimatedPrice()
                );
            
            log.info("Booking created from ride request: bookingId={}, requestId={}, driverId={}", 
                    bookingResponse.getBookingId(), requestId, acceptedDriver.getDriverId());
            
            // Remove ride request
            rideRequestService.removeRideRequest(requestId);
            
            // Notify socket service to send WebSocket notification to client with booking details
            notifySocketServiceWithBooking(requestId, bookingResponse.getBookingId(), acceptedDriver.getDriverId());
            
        } catch (Exception e) {
            log.error("Failed to create booking from ride request: requestId={}", requestId, e);
        }
    }
    
    private void notifySocketService(String requestId, String message) {
        try {
            // Notify socket service to send WebSocket message to client
            String url = socketServiceUrl + "/api/notifications/send";
            java.util.Map<String, Object> notification = new java.util.HashMap<>();
            notification.put("roomId", "user/" + requestId + "/ride-status");
            notification.put("content", message);
            notification.put("sender", "booking-service");
            restTemplate.postForObject(url, notification, String.class);
            log.debug("Notified socket service for requestId: {}", requestId);
        } catch (Exception e) {
            log.warn("Failed to notify socket service for requestId: {}", requestId, e);
        }
    }
    
    private void notifySocketServiceWithBooking(String requestId, Long bookingId, String driverId) {
        try {
            // Notify socket service to send WebSocket message to client with booking details
            String url = socketServiceUrl + "/api/notifications/send";
            java.util.Map<String, Object> notification = new java.util.HashMap<>();
            notification.put("roomId", "user/" + requestId + "/ride-status");
            
            // Create structured message with booking details
            java.util.Map<String, Object> messageData = new java.util.HashMap<>();
            messageData.put("type", "BOOKING_CONFIRMED");
            messageData.put("requestId", requestId);
            messageData.put("bookingId", bookingId);
            messageData.put("driverId", driverId);
            messageData.put("status", "CONFIRMED");
            messageData.put("content", "Ride confirmed! Booking ID: " + bookingId + ", Driver: " + driverId);
            
            notification.put("content", messageData);
            notification.put("sender", "booking-service");
            
            log.info("Sending booking confirmation notification: requestId={}, bookingId={}, driverId={}, messageData={}", 
                    requestId, bookingId, driverId, messageData);
            
            String response = restTemplate.postForObject(url, notification, String.class);
            log.info("Notified socket service with booking details: requestId={}, bookingId={}, driverId={}, response={}", 
                    requestId, bookingId, driverId, response);
        } catch (Exception e) {
            log.error("Failed to notify socket service with booking for requestId: {}", requestId, e);
        }
    }
}
