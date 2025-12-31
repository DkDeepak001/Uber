package com.uber.location_service.location_service.Controller;


import com.uber.location_service.location_service.configs.RedisValue;
import com.uber.location_service.location_service.dto.DriverLocationDto;
import com.uber.location_service.location_service.dto.SearchDriverRequestDto;
import com.uber.location_service.location_service.dto.SearchDriverResponseDto;
import com.uber.location_service.location_service.service.LocationService;
import lombok.AllArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/location")
@AllArgsConstructor
public class LocationController {

    private LocationService locationService;
    @PostMapping("/update")
    public ResponseEntity<Boolean> updateDriverLocation(@RequestBody DriverLocationDto driverLocationDto){
        Boolean res = locationService.updateDriverLocation(driverLocationDto);
        return new ResponseEntity<>(res,HttpStatus.CREATED);

    }

    @GetMapping("/searchDriver")
    public ResponseEntity<?> search(@RequestBody  SearchDriverRequestDto searchDriverRequestDto){
        List<DriverLocationDto> result = locationService.searchNearBy(searchDriverRequestDto.getLongitude(),searchDriverRequestDto.getLatitude());
        return new ResponseEntity<>(result, HttpStatus.OK);
    }
 }
