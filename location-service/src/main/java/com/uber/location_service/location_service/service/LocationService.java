package com.uber.location_service.location_service.service;

import com.uber.location_service.location_service.dto.DriverLocationDto;
import com.uber.location_service.location_service.dto.SearchDriverResponseDto;

import java.util.List;

public interface LocationService {
    public Boolean updateDriverLocation(DriverLocationDto driverLocationDto);
    public List<DriverLocationDto> searchNearBy(double lon, double lat);
}
