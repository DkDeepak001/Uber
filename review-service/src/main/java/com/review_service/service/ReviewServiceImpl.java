package com.review_service.service;

import com.review_service.dto.CreateReviewRequestDto;
import com.review_service.dto.ReviewResponseDto;
import com.review_service.dto.UpdateReviewRequestDto;
import com.review_service.repository.ReviewRepository;
import com.review_service.repository.BookingRepository;
import com.uber.entity.models.Booking;
import com.uber.entity.models.Review;
import com.uber.entity.models.BookingStatus;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private ReviewRepository reviewRepository;
    private BookingRepository bookingRepository;

    @Override
    public ReviewResponseDto createReview(CreateReviewRequestDto createReviewRequestDto) {
        Booking booking = bookingRepository.findById(createReviewRequestDto.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        // Check if booking is completed
        if (booking.getBookingStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot review a booking that is not completed");
        }
        
        // Check if review already exists for this booking
        Optional<Review> existingReview = reviewRepository.findByBookingId(createReviewRequestDto.getBookingId());
        if (existingReview.isPresent()) {
            throw new RuntimeException("Review already exists for this booking");
        }
        
        Review review = Review.builder()
                .booking(booking)
                .rating(createReviewRequestDto.getRating())
                .comment(createReviewRequestDto.getComment())
                .build();
        
        return ReviewResponseDto.from(reviewRepository.save(review));
    }

    @Override
    public Optional<ReviewResponseDto> getReviewById(Long reviewId) {
        Optional<Review> review = reviewRepository.findById(reviewId);
        if (review.isPresent()) {
            return Optional.of(ReviewResponseDto.from(review.get()));
        }
        return Optional.empty();
    }

    @Override
    public Optional<ReviewResponseDto> getReviewByBookingId(Long bookingId) {
        Optional<Review> review = reviewRepository.findByBookingId(bookingId);
        if (review.isPresent()) {
            return Optional.of(ReviewResponseDto.from(review.get()));
        }
        return Optional.empty();
    }

    @Override
    public List<ReviewResponseDto> getAllReviewsByBookingId(Long bookingId) {
        List<Review> reviews = reviewRepository.findAllByBookingId(bookingId);
        return reviews.stream()
                .map(ReviewResponseDto::from)
                .collect(Collectors.toList());
    }

    @Override
    public Boolean updateReview(Long reviewId, UpdateReviewRequestDto updateReviewRequestDto) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        
        review.setRating(updateReviewRequestDto.getRating());
        review.setComment(updateReviewRequestDto.getComment());
        reviewRepository.save(review);
        return Boolean.TRUE;
    }

    @Override
    public Boolean deleteReview(Long reviewId) {
        if (reviewRepository.existsById(reviewId)) {
            reviewRepository.deleteById(reviewId);
            return Boolean.TRUE;
        }
        return Boolean.FALSE;
    }
}

