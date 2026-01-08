package com.socket_service.controller;

import com.socket_service.dto.SendMessageRequestDTO;
import com.socket_service.dto.SendMessageResponseDTO;
import lombok.AllArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Controller
@AllArgsConstructor
public class SocketController {

    private  SimpMessagingTemplate simpMessagingTemplate;

    @MessageMapping("/messages/send")
    public void sendMessage(SendMessageRequestDTO requestDTO) {

        SendMessageResponseDTO responseDTO = SendMessageResponseDTO
                .builder()
                .content("Message received successfully from " + requestDTO.getSender() + ": " + requestDTO.getContent())
                .sender(requestDTO.getSender())
                .build();
        simpMessagingTemplate.convertAndSend("/topic/messages/"+requestDTO.getRoomId(), responseDTO);
    }


}
