package com.uber.entity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;

@SpringBootApplication
@EntityScan("com.uber.entity.models")
public class EntityApplication {

	public static void main(String[] args) {
		SpringApplication.run(EntityApplication.class, args);
	}

}
