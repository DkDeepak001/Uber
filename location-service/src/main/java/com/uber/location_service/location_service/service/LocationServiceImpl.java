package com.uber.location_service.location_service.service;

import com.uber.location_service.location_service.configs.RedisGeo;
import com.uber.location_service.location_service.dto.DriverLocationDto;
import lombok.AllArgsConstructor;
import org.springframework.data.geo.Point;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class LocationServiceImpl implements LocationService {
    
    private RedisGeo redisGeo;

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
}
