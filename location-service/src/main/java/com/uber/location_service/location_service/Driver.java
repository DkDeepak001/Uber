package com.uber.location_service.location_service;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Driver {
    private Long id;
    private String Name;
    private String email;
    private String phoneNumber;
    private double rating;
    private  Boolean isAvailable;
}
