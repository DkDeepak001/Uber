package com.socket_service.dto;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SendMessageRequestDTO {
    private String content;
    private String sender;
    private String roomId;

}
