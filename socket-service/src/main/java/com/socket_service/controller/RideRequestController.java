package com.socket_service.controller;

import com.socket_service.dto.DriverLocationMessage;
import com.socket_service.dto.DriverRideRequestDTO;
import com.socket_service.dto.DriverSearchResponseMessage;
import com.socket_service.dto.RideRequestDTO;
import com.socket_service.dto.RideRequestResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/api/ride-requests")
@RequiredArgsConstructor
public class RideRequestController {

    private final SimpMessagingTemplate simpMessagingTemplate;
    private final KafkaTemplate<String, DriverSearchResponseMessage> kafkaTemplate;
    
    @Value("${kafka.topic.driver-search-response}")
    private String driverSearchResponseTopic; // Not final - injected via @Value
    
    // Store pending ride requests: requestId/bookingId -> RideRequestDTO (contains userId and other details)
    private final ConcurrentHashMap<String, RideRequestDTO> pendingRequests = new ConcurrentHashMap<>();
    
    // Store accepted requests: requestId/bookingId -> driverId
    private final ConcurrentHashMap<String, String> acceptedRequests = new ConcurrentHashMap<>();
    
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);

    /**
     * REST endpoint to send ride requests to multiple drivers
     * Called by location-service after finding nearby drivers
     */
    @PostMapping("/send")
    public ResponseEntity<String> sendRideRequests(
            @RequestBody Map<String, Object> requestBody) {
        
        // Extract ride request and driver IDs from request body
        RideRequestDTO rideRequest = RideRequestDTO.builder()
                .bookingId(requestBody.get("bookingId") != null ? 
                    Long.valueOf(requestBody.get("bookingId").toString()) : null)
                .requestId(requestBody.get("requestId") != null ? 
                    requestBody.get("requestId").toString() : null)
                .userId(requestBody.get("userId").toString())
                .pickupLatitude(Double.valueOf(requestBody.get("pickupLatitude").toString()))
                .pickupLongitude(Double.valueOf(requestBody.get("pickupLongitude").toString()))
                .dropoffLatitude(Double.valueOf(requestBody.get("dropoffLatitude").toString()))
                .dropoffLongitude(Double.valueOf(requestBody.get("dropoffLongitude").toString()))
                .price(Double.valueOf(requestBody.get("price").toString()))
                .timeoutSeconds(requestBody.get("timeoutSeconds") != null ?
                    Long.valueOf(requestBody.get("timeoutSeconds").toString()) : 60L)
                .build();
        
        @SuppressWarnings("unchecked")
        List<String> driverIds = (List<String>) requestBody.get("driverIds");
        
        if (driverIds == null || driverIds.isEmpty()) {
            String identifier = rideRequest.getRequestId() != null ? rideRequest.getRequestId() : 
                               (rideRequest.getBookingId() != null ? "bookingId:" + rideRequest.getBookingId() : "unknown");
            log.warn("No driver IDs provided for {}", identifier);
            // Send empty response to Kafka if no drivers found
            if (rideRequest.getRequestId() != null) {
                DriverSearchResponseMessage emptyResponse = DriverSearchResponseMessage.builder()
                        .bookingId(rideRequest.getBookingId())
                        .requestId(rideRequest.getRequestId())
                        .userId(rideRequest.getUserId())
                        .drivers(Collections.emptyList())
                        .build();
                kafkaTemplate.send(driverSearchResponseTopic, rideRequest.getRequestId(), emptyResponse);
                log.info("Sent empty response to booking service for requestId: {}", rideRequest.getRequestId());
            }
            return ResponseEntity.badRequest().body("No driver IDs provided");
        }
        
        String identifier = rideRequest.getRequestId() != null ? rideRequest.getRequestId() : 
                           (rideRequest.getBookingId() != null ? "bookingId:" + rideRequest.getBookingId() : "unknown");
        log.info("Sending ride request for {} to {} drivers", identifier, driverIds.size());
        
        long timeoutSeconds = rideRequest.getTimeoutSeconds() != null ? rideRequest.getTimeoutSeconds() : 60;
        long expiresAt = Instant.now().plusSeconds(timeoutSeconds).toEpochMilli(); // Use milliseconds for consistency with frontend
        
        // Store pending request with full details using requestId or bookingId as key
        String requestKey = rideRequest.getRequestId() != null ? rideRequest.getRequestId() : 
                           (rideRequest.getBookingId() != null ? rideRequest.getBookingId().toString() : null);
        if (requestKey != null) {
            pendingRequests.put(requestKey, rideRequest);
        }
        
        // Create driver-friendly request DTO
        DriverRideRequestDTO driverRequest = DriverRideRequestDTO.builder()
                .bookingId(rideRequest.getBookingId())
                .requestId(rideRequest.getRequestId())
                .userId(rideRequest.getUserId())
                .pickupLatitude(rideRequest.getPickupLatitude())
                .pickupLongitude(rideRequest.getPickupLongitude())
                .dropoffLatitude(rideRequest.getDropoffLatitude())
                .dropoffLongitude(rideRequest.getDropoffLongitude())
                .price(rideRequest.getPrice())
                .expiresAt(expiresAt)
                .message("New ride request available")
                .build();
        
        // Send to each driver via their personal topic
        for (String driverId : driverIds) {
            String topic = "/topic/driver/" + driverId + "/ride-requests";
            simpMessagingTemplate.convertAndSend(topic, driverRequest);
            log.info("Sent ride request to driver {} via topic: {}", driverId, topic);
        }
        
        // Send initial driver list to Kafka so booking service can store it
        if (rideRequest.getRequestId() != null) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> driversList = (List<Map<String, Object>>) requestBody.get("drivers");
            
            List<DriverLocationMessage> driverMessages = Collections.emptyList();
            if (driversList != null && !driversList.isEmpty()) {
                driverMessages = driversList.stream()
                        .map(driverMap -> DriverLocationMessage.builder()
                                .driverId(driverMap.get("driverId").toString())
                                .latitude(Double.valueOf(driverMap.get("latitude").toString()))
                                .longitude(Double.valueOf(driverMap.get("longitude").toString()))
                                .build())
                        .collect(java.util.stream.Collectors.toList());
            }
            
            DriverSearchResponseMessage initialResponse = DriverSearchResponseMessage.builder()
                    .bookingId(rideRequest.getBookingId())
                    .requestId(rideRequest.getRequestId())
                    .userId(rideRequest.getUserId())
                    .drivers(driverMessages)
                    .build();
            
            kafkaTemplate.send(driverSearchResponseTopic, rideRequest.getRequestId(), initialResponse);
            log.info("Sent initial driver list to booking service for requestId: {}, drivers: {}", 
                    rideRequest.getRequestId(), driverMessages.size());
        }
        
        // Schedule timeout task
        scheduler.schedule(() -> {
            String timeoutRequestKey = rideRequest.getRequestId() != null ? rideRequest.getRequestId() : 
                               (rideRequest.getBookingId() != null ? rideRequest.getBookingId().toString() : null);
            if (timeoutRequestKey != null && pendingRequests.containsKey(timeoutRequestKey) && 
                !acceptedRequests.containsKey(timeoutRequestKey)) {
                log.warn("Ride request for {} timed out - no driver accepted", timeoutRequestKey);
                RideRequestDTO timedOutRequest = pendingRequests.remove(timeoutRequestKey);
                
                // Send timeout response to booking service (empty drivers list indicates timeout)
                // Booking service will check if drivers were already stored to distinguish timeout from "no drivers found"
                DriverSearchResponseMessage timeoutResponse = DriverSearchResponseMessage.builder()
                        .bookingId(rideRequest.getBookingId())
                        .requestId(rideRequest.getRequestId())
                        .userId(rideRequest.getUserId())
                        .drivers(Collections.emptyList()) // Empty list indicates timeout (not initial "no drivers found")
                        .build();
                
                String kafkaKey = rideRequest.getRequestId() != null ? rideRequest.getRequestId() : 
                                 (rideRequest.getBookingId() != null ? rideRequest.getBookingId().toString() : "timeout");
                kafkaTemplate.send(driverSearchResponseTopic, kafkaKey, timeoutResponse);
                log.info("Sent timeout response to booking service for {}", timeoutRequestKey);
                
                // Also notify client via WebSocket about timeout
                String userTopic = "/topic/user/" + (rideRequest.getRequestId() != null ? rideRequest.getRequestId() : 
                                  (rideRequest.getBookingId() != null ? rideRequest.getBookingId().toString() : "unknown")) + "/ride-status";
                simpMessagingTemplate.convertAndSend(userTopic, 
                    "Request timed out - no driver accepted. Please try again.");
            }
        }, timeoutSeconds, TimeUnit.SECONDS);
        
        return ResponseEntity.ok("Ride requests sent to " + driverIds.size() + " drivers");
    }

    /**
     * Socket message handler for driver acceptance/rejection
     * Drivers send messages to /app/driver/ride-response
     */
    @org.springframework.messaging.handler.annotation.MessageMapping("/driver/ride-response")
    public void handleDriverResponse(@org.springframework.messaging.handler.annotation.Payload RideRequestResponseDTO response) {
        // response.getBookingId() or response.getRequestId() - check both
        String requestKey = response.getRequestId() != null ? response.getRequestId() : 
                           (response.getBookingId() != null ? response.getBookingId().toString() : null);
        
        if (requestKey == null) {
            log.warn("Received response without requestId or bookingId");
            return;
        }
        
        log.info("Received driver response: requestKey={}, driverId={}, action={}", 
                requestKey, response.getDriverId(), response.getAction());
        
        RideRequestDTO request = pendingRequests.get(requestKey);
        if (request == null) {
            log.warn("Received response for non-pending request: {}", requestKey);
            return;
        }
        
        if ("ACCEPT".equalsIgnoreCase(response.getAction())) {
            // Check if already accepted
            if (acceptedRequests.containsKey(requestKey)) {
                log.warn("Request {} already accepted by driver {}", 
                        requestKey, acceptedRequests.get(requestKey));
                return;
            }
            
            // Mark as accepted
            acceptedRequests.put(requestKey, response.getDriverId());
            pendingRequests.remove(requestKey);
            
            log.info("Driver {} accepted ride request for {}", response.getDriverId(), requestKey);
            
            // Send acceptance to booking service via Kafka
            DriverLocationMessage acceptedDriver = DriverLocationMessage.builder()
                    .driverId(response.getDriverId())
                    .latitude(0.0) // Location not needed for acceptance
                    .longitude(0.0)
                    .build();
            
            DriverSearchResponseMessage kafkaResponse = DriverSearchResponseMessage.builder()
                    .bookingId(request.getBookingId())
                    .requestId(request.getRequestId())
                    .userId(request.getUserId())
                    .drivers(Collections.singletonList(acceptedDriver))
                    .build();
            
            String kafkaKey = request.getRequestId() != null ? request.getRequestId() : 
                             (request.getBookingId() != null ? request.getBookingId().toString() : "accept");
            kafkaTemplate.send(driverSearchResponseTopic, kafkaKey, kafkaResponse);
            log.info("Sent driver acceptance to booking service for {}", requestKey);
            
            // Notify user that driver accepted (will be updated with bookingId by booking service)
            String userTopic = "/topic/user/" + (request.getRequestId() != null ? request.getRequestId() : 
                              (request.getBookingId() != null ? request.getBookingId().toString() : "unknown")) + "/ride-status";
            
            // Send structured message
            Map<String, Object> acceptanceMessage = new HashMap<>();
            acceptanceMessage.put("type", "DRIVER_ACCEPTED");
            acceptanceMessage.put("requestId", request.getRequestId());
            acceptanceMessage.put("driverId", response.getDriverId());
            acceptanceMessage.put("content", "Driver " + response.getDriverId() + " accepted your ride request");
            acceptanceMessage.put("status", "CONFIRMED");
            
            // Use String destination explicitly to avoid method ambiguity
            String destination = userTopic;
            simpMessagingTemplate.convertAndSend(destination, (Object) acceptanceMessage);
            log.info("Sent driver acceptance notification to user via topic: {}", userTopic);
            
        } else if ("REJECT".equalsIgnoreCase(response.getAction())) {
            log.info("Driver {} rejected ride request for {}", response.getDriverId(), requestKey);
            // Driver rejection doesn't need to be sent to booking service
            // Only when all drivers reject or timeout, we send empty list
        }
    }
    
    /**
     * Check if a booking has been accepted
     */
    @GetMapping("/status/{requestId}")
    public ResponseEntity<RideRequestResponseDTO> getRideStatus(@PathVariable String requestId) {
        if (acceptedRequests.containsKey(requestId)) {
            RideRequestDTO request = pendingRequests.get(requestId);
            RideRequestResponseDTO response = RideRequestResponseDTO.builder()
                    .requestId(requestId)
                    .bookingId(request != null ? request.getBookingId() : null)
                    .driverId(acceptedRequests.get(requestId))
                    .action("ACCEPT")
                    .message("Driver accepted")
                    .build();
            return ResponseEntity.ok(response);
        } else if (pendingRequests.containsKey(requestId)) {
            RideRequestDTO request = pendingRequests.get(requestId);
            return ResponseEntity.ok(RideRequestResponseDTO.builder()
                    .requestId(requestId)
                    .bookingId(request != null ? request.getBookingId() : null)
                    .action("PENDING")
                    .message("Waiting for driver response")
                    .build());
        } else {
            return ResponseEntity.ok(RideRequestResponseDTO.builder()
                    .requestId(requestId)
                    .action("TIMEOUT")
                    .message("No driver accepted")
                    .build());
        }
    }
    
}
