package com.socket_service.controller;

import com.socket_service.dto.SendMessageRequestDTO;
import com.socket_service.dto.SendMessageResponseDTO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Slf4j
@Controller
@AllArgsConstructor
public class SocketController {

    private SimpMessagingTemplate simpMessagingTemplate;

    @MessageMapping("/messages/send")
    public void sendMessage(SendMessageRequestDTO requestDTO) {
        log.info("================================================");
        log.info("📨 Message Received!");
        log.info("Room ID: {}", requestDTO.getRoomId());
        log.info("Sender: {}", requestDTO.getSender());
        log.info("Content: {}", requestDTO.getContent());
        log.info("Sending to topic: /topic/messages/{}", requestDTO.getRoomId());
        log.info("================================================");
        
        SendMessageResponseDTO responseDTO = SendMessageResponseDTO
                .builder()
                .content("Message received successfully from " + requestDTO.getSender() + ": " + requestDTO.getContent())
                .sender(requestDTO.getSender())
                .build();
        
        String topic = "/topic/messages/" + requestDTO.getRoomId();
        simpMessagingTemplate.convertAndSend(topic, responseDTO);
        
        log.info("✅ Message sent to topic: {}", topic);
    }
}
