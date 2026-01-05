package com.uber.location_service.location_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;

@SpringBootApplication
@EntityScan("com.uber.entity")
public class LocationServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(LocationServiceApplication.class, args);
	}

}
