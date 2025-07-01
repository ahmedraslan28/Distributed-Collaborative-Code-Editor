package com.raslan.messaging.subscribers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class ExecutionResultSubscriber implements MessageListener {
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String json = new String(message.getBody());
        Map<String, Object> payload;
        try {
            payload = objectMapper.readValue(json, new TypeReference<>(){});
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
        Map<String, Object> msg = (Map<String, Object>) payload.get("message");
        log.info("Received {} message from pub/sub for room {}", msg.get("event"), msg.get("roomId"));
        messagingTemplate.convertAndSend("/topic/room/" + msg.get("roomId"), payload);
    }
}
