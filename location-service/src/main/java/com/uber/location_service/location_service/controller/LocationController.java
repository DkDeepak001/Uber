package com.uber.location_service.location_service.controller;

import com.uber.location_service.location_service.dto.DriverLocationDto;
import com.uber.location_service.location_service.service.LocationService;
import lombok.AllArgsConstructor;
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
    public ResponseEntity<Boolean> updateDriverLocation(@RequestBody DriverLocationDto driverLocationDto) {
        try {
            Boolean result = locationService.updateDriverLocation(driverLocationDto);
            return new ResponseEntity<>(result, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<DriverLocationDto>> searchNearbyDrivers(
            @RequestParam double latitude,
            @RequestParam double longitude) {
        try {
            List<DriverLocationDto> result = locationService.searchNearBy(longitude, latitude);
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
zz