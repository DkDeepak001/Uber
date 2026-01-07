package com.booking_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.uber.entity.models.Driver;

@Repository
public interface DriverRepository extends JpaRepository<Driver,Long> {
  
}
