package com.review_service.dto;

import com.uber.entity.models.Review;
import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewResponseDto {
    private Long id;
    private Long bookingId;
    private Integer rating;
    private String comment;

    public static ReviewResponseDto from(Review review) {
        return ReviewResponseDto.builder()
                .id(review.getId())
                .bookingId(review.getBooking().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .build();
    }
}

