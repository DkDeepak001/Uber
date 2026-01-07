package com.review_service.controller;

import com.review_service.dto.CreateReviewRequestDto;
import com.review_service.dto.ReviewResponseDto;
import com.review_service.dto.UpdateReviewRequestDto;
import com.review_service.service.ReviewService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/review")
@AllArgsConstructor
public class ReviewController {

    private ReviewService reviewService;

    @PostMapping("/")
    public ResponseEntity<ReviewResponseDto> createReview(@RequestBody CreateReviewRequestDto createReviewRequestDto) {
        try {
            ReviewResponseDto review = reviewService.createReview(createReviewRequestDto);
            return new ResponseEntity<>(review, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewResponseDto> getReviewById(@PathVariable Long reviewId) {
        try {
            Optional<ReviewResponseDto> review = reviewService.getReviewById(reviewId);
            if (review.isPresent()) {
                return new ResponseEntity<>(review.get(), HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ReviewResponseDto> getReviewByBookingId(@PathVariable Long bookingId) {
        try {
            Optional<ReviewResponseDto> review = reviewService.getReviewByBookingId(bookingId);
            if (review.isPresent()) {
                return new ResponseEntity<>(review.get(), HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/booking/{bookingId}/all")
    public ResponseEntity<List<ReviewResponseDto>> getAllReviewsByBookingId(@PathVariable Long bookingId) {
        try {
            List<ReviewResponseDto> reviews = reviewService.getAllReviewsByBookingId(bookingId);
            return new ResponseEntity<>(reviews, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<Boolean> updateReview(@PathVariable Long reviewId, @RequestBody UpdateReviewRequestDto updateReviewRequestDto) {
        try {
            Boolean updated = reviewService.updateReview(reviewId, updateReviewRequestDto);
            if (updated) {
                return new ResponseEntity<>(HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Boolean> deleteReview(@PathVariable Long reviewId) {
        try {
            Boolean deleted = reviewService.deleteReview(reviewId);
            if (deleted) {
                return new ResponseEntity<>(HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

