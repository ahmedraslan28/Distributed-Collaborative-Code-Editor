package com.raslan.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.raslan.room.dto.WebSocketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisPublisher {
    private final RedisTemplate<String, Object> redisTemplate ;
    private final ObjectMapper objectMapper ;
    public void publish(String channel, Object message) {
        redisTemplate.convertAndSend(channel, message) ;
        Map<String, Object> payload = (Map<String, Object>) message;
        log.info("connected users from publisher {}", payload.get("users"));
        WebSocketMessage msg = (WebSocketMessage) payload.get("message");
        log.info("{} message published to pub/sub from room {}", msg.getEvent(), msg.getRoomId());
    }
}
