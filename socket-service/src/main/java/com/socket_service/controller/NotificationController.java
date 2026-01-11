package com.socket_service.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final SimpMessagingTemplate simpMessagingTemplate;

    /**
     * Endpoint for booking-service to send notifications to clients via WebSocket
     */
    @PostMapping("/send")
    public ResponseEntity<String> sendNotification(@RequestBody Map<String, Object> notification) {
        try {
            String roomId = notification.get("roomId").toString();
            Object contentObj = notification.get("content");
            String sender = notification.getOrDefault("sender", "system").toString();
            
            String topic = "/topic/" + roomId;
            
            // Handle both string and structured message formats
            Map<String, Object> message = new HashMap<>();
            if (contentObj instanceof Map) {
                // Structured message (from booking service)
                @SuppressWarnings("unchecked")
                Map<String, Object> contentMap = (Map<String, Object>) contentObj;
                message.putAll(contentMap);
            } else {
                // Simple string message
                message.put("content", contentObj.toString());
            }
            message.put("sender", sender);
            
            // Use String destination explicitly to avoid method ambiguity
            String destination = topic;
            simpMessagingTemplate.convertAndSend(destination, (Object) message);
            log.info("Sent notification to room: {}, message: {}", roomId, message);
            
            return ResponseEntity.ok("Notification sent");
        } catch (Exception e) {
            log.error("Failed to send notification", e);
            return ResponseEntity.status(500).body("Failed to send notification");
        }
    }
}
