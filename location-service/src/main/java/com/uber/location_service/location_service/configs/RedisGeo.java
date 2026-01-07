package com.uber.location_service.location_service.configs;

import com.uber.location_service.location_service.dto.DriverLocationDto;
import lombok.AllArgsConstructor;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;


@Component
@AllArgsConstructor
public class RedisGeo {
    private StringRedisTemplate redis;
    private final String PREFIX_KEY = "Location:Driver";

    public void setGeo( Point point, String driverId){
        System.out.println(point.toString());
        redis.opsForGeo().add(PREFIX_KEY,point,driverId);
    }

    public List<DriverLocationDto> nearBy(double lon, double lat){
        Distance distance = new Distance(5, Metrics.KILOMETERS);
        Point point = new Point(lon,lat);
        Circle circle = new Circle(point,distance);
        System.out.println(circle.toString());
        GeoResults<RedisGeoCommands.GeoLocation<String>> results =  redis.opsForGeo().radius(PREFIX_KEY,circle);
        return results
                .getContent()
                .stream()
                .map(r ->{
                    Point p = redis.opsForGeo().position(PREFIX_KEY,r.getContent().getName()).get(0);
                    return DriverLocationDto
                        .builder()
                        .driverId(r.getContent().getName())
                        .longitude(p.getX())
                        .latitude(p.getY())
                        .build();
                }
                )
                .toList();
    }

    public Optional<DriverLocationDto> getDriverLocation(String driverId) {
        try {
            Point point = redis.opsForGeo().position(PREFIX_KEY, driverId).get(0);
            if (point != null) {
                return Optional.of(DriverLocationDto.builder()
                        .driverId(driverId)
                        .longitude(point.getX())
                        .latitude(point.getY())
                        .build());
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public Boolean deleteDriverLocation(String driverId) {
        try {
            Long removed = redis.opsForGeo().remove(PREFIX_KEY, driverId);
            return removed > 0;
        } catch (Exception e) {
            return Boolean.FALSE;
        }
    }
}
