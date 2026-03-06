package com.uber.location_service.location_service.service;

import com.uber.location_service.location_service.configs.RedisGeo;
import com.uber.location_service.location_service.dto.DriverLocationDto;
import com.uber.entity.repository.DriverRepository;
import com.uber.entity.models.Driver;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.geo.Point;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class LocationServiceImpl implements LocationService {
    
    private RedisGeo redisGeo;
    private DriverRepository driverRepository;

    @Override
    public Boolean updateDriverLocation(DriverLocationDto driverLocationDto) {
        Point point = new Point(driverLocationDto.getLongitude(), driverLocationDto.getLatitude());
        redisGeo.setGeo(point, driverLocationDto.getDriverId());
        return Boolean.TRUE;
    }

    @Override
    public Optional<DriverLocationDto> getDriverLocation(String driverId) {
        return redisGeo.getDriverLocation(driverId);
    }

    @Override
    public List<DriverLocationDto> searchNearBy(double longitude, double latitude) {
        return redisGeo.nearBy(longitude, latitude);
    }

    @Override
    public Boolean deleteDriverLocation(String driverId) {
        return redisGeo.deleteDriverLocation(driverId);
    }

    @Override
    public List<DriverLocationDto> randomizeDriversNearLocation(double latitude, double longitude, int minDrivers, int maxDrivers, double radiusKm) {
        try {
            // Get all drivers from database
            List<Driver> allDrivers = driverRepository.findAll();
            
            if (allDrivers.isEmpty()) {
                log.warn("No drivers found in database");
                return List.of();
            }

            // Determine how many drivers to place (random between min and max)
            Random random = new Random();
            int numDriversToPlace = Math.min(
                random.nextInt(maxDrivers - minDrivers + 1) + minDrivers,
                allDrivers.size()
            );

            // Shuffle and take random drivers
            List<Driver> selectedDrivers = allDrivers.stream()
                .collect(Collectors.toList());
            
            // Shuffle the list
            java.util.Collections.shuffle(selectedDrivers);
            
            // Take first N drivers
            selectedDrivers = selectedDrivers.subList(0, Math.min(numDriversToPlace, selectedDrivers.size()));

            log.info("Randomizing {} drivers near location ({}, {})", selectedDrivers.size(), latitude, longitude);

            List<DriverLocationDto> placedDrivers = selectedDrivers.stream()
                .map(driver -> {
                    // Generate random location within radius
                    // Using simple random offset (not perfect circle, but good enough for demo)
                    double angle = random.nextDouble() * 2 * Math.PI;
                    double distance = random.nextDouble() * radiusKm; // Random distance up to radius
                    
                    // Convert km to degrees (approximate: 1km ≈ 0.009 degrees)
                    double offsetLat = (distance * Math.cos(angle)) * 0.009;
                    double offsetLon = (distance * Math.sin(angle)) * 0.009 / Math.cos(Math.toRadians(latitude));
                    
                    double randomLat = latitude + offsetLat;
                    double randomLon = longitude + offsetLon;

                    // Create driver location DTO
                    DriverLocationDto driverLocation = DriverLocationDto.builder()
                        .driverId(driver.getId().toString())
                        .latitude(randomLat)
                        .longitude(randomLon)
                        .build();

                    // Update location in Redis
                    Point point = new Point(randomLon, randomLat);
                    redisGeo.setGeo(point, driver.getId().toString());

                    log.debug("Placed driver {} at ({}, {})", driver.getId(), randomLat, randomLon);
                    
                    return driverLocation;
                })
                .collect(Collectors.toList());

            log.info("Successfully placed {} drivers near user location", placedDrivers.size());
            return placedDrivers;
            
        } catch (Exception e) {
            log.error("Error randomizing drivers: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to randomize drivers: " + e.getMessage(), e);
        }
    }
}
