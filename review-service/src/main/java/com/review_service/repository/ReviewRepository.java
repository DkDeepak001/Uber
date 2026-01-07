package com.review_service.repository;

import com.uber.entity.models.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByBookingId(Long bookingId);
    List<Review> findAllByBookingId(Long bookingId);
    
    @Query("SELECT r FROM Review r WHERE r.booking.driver.id = :driverId")
    List<Review> findAllByBookingDriverId(@Param("driverId") Long driverId);
}

