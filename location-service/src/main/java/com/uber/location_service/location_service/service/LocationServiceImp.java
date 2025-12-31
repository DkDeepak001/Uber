package com.uber.location_service.location_service.service;

import com.uber.location_service.location_service.configs.RedisGeo;
import com.uber.location_service.location_service.dto.DriverLocationDto;
import com.uber.location_service.location_service.dto.SearchDriverResponseDto;
import lombok.AllArgsConstructor;
import org.springframework.data.geo.Point;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class LocationServiceImp implements LocationService{
    private RedisGeo redisGeo;

    @Override
    public Boolean updateDriverLocation(DriverLocationDto driverLocationDto) {
        try {
            Point point = new Point(driverLocationDto.getLongitude(),driverLocationDto.getLatitude());
            redisGeo.setGeo(point,driverLocationDto.getDriverId());
            return true;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public List<DriverLocationDto> searchNearBy(double lon, double lat) {
         return redisGeo.nearBy(lon,lat);
    }
}
