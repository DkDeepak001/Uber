package com.uber.location_service.location_service.dto;

import lombok.*;

import java.util.Optional;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SearchDriverResponseDto {
    private String userId;
    private Optional<DriverLocationDto> drivers;
}
