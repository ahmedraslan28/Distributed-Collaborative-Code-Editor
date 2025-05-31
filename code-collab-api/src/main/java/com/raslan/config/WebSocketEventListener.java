package com.raslan.config;

import com.raslan.room.Room;
import com.raslan.room.RoomService;
import com.raslan.shared.WebSocketMessage;
import com.raslan.shared.WebsocketEvents;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
@Data
public class WebSocketEventListener {


    private final RoomService roomService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        log.info("New connection established: " + sessionId);
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        if(headerAccessor.getSessionAttributes().get("explicitLeave") != null) return;


        String sessionId = headerAccessor.getSessionId();
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");
        log.info("User Disconnected: " + username + " from room " + roomId + " (Session: " + sessionId + ")");


        WebSocketMessage message = WebSocketMessage.builder()
                .roomId(roomId)
                .username(username)
                .event(WebsocketEvents.LEAVE_ROOM)
                .message(username + " has left the room.")
                .build();
        roomService.leaveRoom(roomId, username);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, Map.of("message", message));
    }
}
