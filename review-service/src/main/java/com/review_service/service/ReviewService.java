package com.review_service.service;

import com.review_service.dto.CreateReviewRequestDto;
import com.review_service.dto.ReviewResponseDto;
import com.review_service.dto.UpdateReviewRequestDto;

import java.util.List;
import java.util.Optional;

public interface ReviewService {
    ReviewResponseDto createReview(CreateReviewRequestDto createReviewRequestDto);
    Optional<ReviewResponseDto> getReviewById(Long reviewId);
    Optional<ReviewResponseDto> getReviewByBookingId(Long bookingId);
    List<ReviewResponseDto> getAllReviewsByBookingId(Long bookingId);
    Boolean updateReview(Long reviewId, UpdateReviewRequestDto updateReviewRequestDto);
    Boolean deleteReview(Long reviewId);
}

