package com.booking_service.service;

import com.booking_service.dto.CreateBookingRequestDto;
import com.booking_service.dto.RideRequestDto;
import com.booking_service.dto.RideRequestResponseDto;
import com.booking_service.kafka.dto.DriverLocationMessage;
import com.booking_service.kafka.dto.DriverSearchRequestMessage;
import com.booking_service.kafka.producer.DriverSearchProducer;
import com.booking_service.repository.DriverRepository;
import com.uber.entity.models.Driver;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class RideRequestService {

    private final DriverSearchProducer driverSearchProducer;
    private final DriverRepository driverRepository;
    
    // Store pending ride requests: requestId -> RideRequestDto
    private final Map<String, RideRequestDto> pendingRequests = new ConcurrentHashMap<>();
    
    // Store driver locations from search: requestId -> List<DriverLocationMessage>
    private final Map<String, List<DriverLocationMessage>> requestDrivers = new ConcurrentHashMap<>();
    
    private static final long REQUEST_TIMEOUT_SECONDS = 60; // 1 minute timeout

    /**
     * Initiate ride request - search for drivers and return immediately
     * Does NOT create booking yet
     */
    public RideRequestResponseDto initiateRideRequest(CreateBookingRequestDto createBookingRequestDto) {
        String requestId = UUID.randomUUID().toString();
        log.info("Initiating ride request: requestId={}, userId={}", requestId, createBookingRequestDto.getUserId());
        
        // Calculate estimated price (same logic as booking creation)
        double estimatedPrice = calculateEstimatedPrice(
            createBookingRequestDto.getPickupLatitude(),
            createBookingRequestDto.getPickupLongitude(),
            createBookingRequestDto.getDropoffLatitude(),
            createBookingRequestDto.getDropoffLongitude()
        );
        
        // Store pending request
        RideRequestDto rideRequest = RideRequestDto.builder()
                .requestId(requestId)
                .userId(createBookingRequestDto.getUserId())
                .pickupLatitude(createBookingRequestDto.getPickupLatitude())
                .pickupLongitude(createBookingRequestDto.getPickupLongitude())
                .dropoffLatitude(createBookingRequestDto.getDropoffLatitude())
                .dropoffLongitude(createBookingRequestDto.getDropoffLongitude())
                .pickupTime(createBookingRequestDto.getPickupTime())
                .estimatedPrice(estimatedPrice)
                .createdAt(Instant.now().getEpochSecond())
                .expiresAt(Instant.now().plusSeconds(REQUEST_TIMEOUT_SECONDS).getEpochSecond())
                .build();
        
        pendingRequests.put(requestId, rideRequest);
        
        // Send Kafka message to location service to search drivers
        // Using requestId as bookingId temporarily (will be replaced with actual bookingId later)
        DriverSearchRequestMessage searchRequest = DriverSearchRequestMessage.builder()
                .bookingId(null) // No booking yet
                .requestId(requestId) // Use requestId instead
                .userId(createBookingRequestDto.getUserId())
                .pickupLatitude(createBookingRequestDto.getPickupLatitude())
                .pickupLongitude(createBookingRequestDto.getPickupLongitude())
                .dropoffLatitude(createBookingRequestDto.getDropoffLatitude())
                .dropoffLongitude(createBookingRequestDto.getDropoffLongitude())
                .price(estimatedPrice)
                .build();
        
        try {
            driverSearchProducer.sendDriverSearchRequest(searchRequest);
            log.info("Driver search request sent for requestId: {}", requestId);
        } catch (Exception e) {
            log.error("Failed to send driver search request for requestId: {}", requestId, e);
            pendingRequests.remove(requestId);
            throw new RuntimeException("Failed to initiate ride request: " + e.getMessage(), e);
        }
        
        // Return immediate response with requestId
        // Drivers list will be empty initially, will be populated async
        return RideRequestResponseDto.builder()
                .requestId(requestId)
                .userId(createBookingRequestDto.getUserId())
                .nearbyDrivers(List.of()) // Empty initially, will be updated via WebSocket
                .status("SEARCHING")
                .message("Searching for nearby drivers...")
                .build();
    }
    
    /**
     * Get ride request status by requestId
     */
    public RideRequestResponseDto getRideRequestStatus(String requestId) {
        RideRequestDto rideRequest = pendingRequests.get(requestId);
        if (rideRequest == null) {
            return RideRequestResponseDto.builder()
                    .requestId(requestId)
                    .status("NOT_FOUND")
                    .message("Ride request not found or expired")
                    .build();
        }
        
        List<DriverLocationMessage> drivers = requestDrivers.get(requestId);
        List<RideRequestResponseDto.DriverInfoDto> driverInfoList = List.of();
        
        if (drivers != null && !drivers.isEmpty()) {
            driverInfoList = drivers.stream()
                    .map(driver -> {
                        // Fetch driver details from database
                        Driver driverEntity = driverRepository.findById(Long.parseLong(driver.getDriverId()))
                                .orElse(null);
                        
                        // Calculate distance
                        double distance = calculateDistance(
                            rideRequest.getPickupLatitude(),
                            rideRequest.getPickupLongitude(),
                            driver.getLatitude(),
                            driver.getLongitude()
                        );
                        
                        return RideRequestResponseDto.DriverInfoDto.builder()
                                .driverId(driver.getDriverId())
                                .driverName(driverEntity != null ? driverEntity.getName() : "Unknown")
                                .latitude(driver.getLatitude())
                                .longitude(driver.getLongitude())
                                .distance(distance)
                                .build();
                    })
                    .collect(Collectors.toList());
        }
        
        // Check if expired
        if (Instant.now().getEpochSecond() > rideRequest.getExpiresAt()) {
            pendingRequests.remove(requestId);
            requestDrivers.remove(requestId);
            return RideRequestResponseDto.builder()
                    .requestId(requestId)
                    .status("TIMEOUT")
                    .message("Ride request expired")
                    .build();
        }
        
        return RideRequestResponseDto.builder()
                .requestId(requestId)
                .userId(rideRequest.getUserId())
                .nearbyDrivers(driverInfoList)
                .status(driverInfoList.isEmpty() ? "SEARCHING" : "DRIVER_FOUND")
                .message(driverInfoList.isEmpty() ? "Searching for nearby drivers..." : "Drivers found, waiting for acceptance...")
                .build();
    }
    
    /**
     * Store drivers found for a request (called by consumer)
     */
    public void storeDriversForRequest(String requestId, List<DriverLocationMessage> drivers) {
        requestDrivers.put(requestId, drivers);
        log.info("Stored {} drivers for requestId: {}", drivers.size(), requestId);
    }
    
    /**
     * Get stored drivers for a request (to check if drivers were already found)
     */
    public List<DriverLocationMessage> getStoredDriversForRequest(String requestId) {
        return requestDrivers.get(requestId);
    }
    
    /**
     * Get ride request by requestId (for creating booking)
     */
    public RideRequestDto getRideRequest(String requestId) {
        return pendingRequests.get(requestId);
    }
    
    /**
     * Remove ride request after booking is created
     */
    public void removeRideRequest(String requestId) {
        pendingRequests.remove(requestId);
        requestDrivers.remove(requestId);
        log.info("Removed ride request: requestId={}", requestId);
    }
    
    private double calculateEstimatedPrice(double pickupLat, double pickupLon, 
                                          double dropoffLat, double dropoffLon) {
        // Simple distance-based calculation
        double distance = calculateDistance(pickupLat, pickupLon, dropoffLat, dropoffLon);
        double basePrice = 50.0;
        double pricePerKm = 10.0;
        return basePrice + (distance * pricePerKm);
    }
    
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Haversine formula for calculating distance between two coordinates
        final int R = 6371; // Earth's radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
