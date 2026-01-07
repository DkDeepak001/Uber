package com.uber.location_service.location_service.service;

import com.uber.location_service.location_service.dto.DriverLocationDto;

import java.util.List;

public interface LocationService {
    Boolean updateDriverLocation(DriverLocationDto driverLocationDto);
    List<DriverLocationDto> searchNearBy(double longitude, double latitude);
}
