package com.uber.location_service.location_service.service;

import com.uber.location_service.location_service.dto.DriverLocationDto;

import java.util.List;
import java.util.Optional;

public interface LocationService {
    Boolean updateDriverLocation(DriverLocationDto driverLocationDto);
    Optional<DriverLocationDto> getDriverLocation(String driverId);
    List<DriverLocationDto> searchNearBy(double longitude, double latitude);
    Boolean deleteDriverLocation(String driverId);
}
