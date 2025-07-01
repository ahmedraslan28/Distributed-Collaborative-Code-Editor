package com.raslan.ExecutionService.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisPublisher {
    private final RedisTemplate<String, Object> redisTemplate;

    public void publish(String channel, Object message) {
        redisTemplate.convertAndSend(channel, message);
        Map<String, Object> payload = (Map<String, Object>) message;
        Map<String, Object> msg = (Map<String, Object>) payload.get("message");
        log.info("{} message published to pub/sub from room {}", msg.get("event"), msg.get("roomId"));
    }
}
