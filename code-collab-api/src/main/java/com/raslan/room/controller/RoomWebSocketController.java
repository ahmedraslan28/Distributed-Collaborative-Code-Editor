package com.raslan.room.controller;

import com.raslan.room.Room;
import com.raslan.room.RoomService;
import com.raslan.shared.WebSocketMessage;
import com.raslan.shared.WebsocketEvents;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class RoomWebSocketController {
    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;

    @MessageMapping("/room/join")
    public void handleJoinRoom(@Payload Map<String, String> request, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        String roomId = request.get("roomId");
        String username = request.get("username");

        log.info(" roomId: " + roomId + " username: " + username);

        // Store the username in the session attributes
        headerAccessor.getSessionAttributes().put("username", username);
        headerAccessor.getSessionAttributes().put("roomId", roomId);

        WebSocketMessage message = new WebSocketMessage();
        message.setUsername(username);
        message.setRoomId(roomId);
        Room room;

        try {
            room = roomService.joinRoom(username, roomId);
            message.setEvent(WebsocketEvents.JOIN_ROOM);
            message.setMessage("User " + username + " joined room");
            messagingTemplate.convertAndSend("/topic/room/" + roomId, Map.of("message", message, "users", room.getActiveUsers()));
        } catch (Exception ex) {
            log.info("Error joining room: " + ex.getMessage());
            message.setEvent("ERROR");
            message.setMessage("Unexpected error: " + ex.getMessage());
            messagingTemplate.convertAndSend("/queue/errors/" + username, message);
        }

    }


    @MessageMapping("/room/leave")
    public void handleLeaveRoom(SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");

        log.info("User " + username + " is leaving room " + roomId);

        headerAccessor.getSessionAttributes().put("explicitLeave", true);

        // Notify other users in the room
        WebSocketMessage message = WebSocketMessage.builder()
                .roomId(roomId)
                .username(username)
                .event(WebsocketEvents.LEAVE_ROOM)
                .message(username + " has left the room.")
                .build();
        Room room = roomService.leaveRoom(roomId, username);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, Map.of("message", message, "users", room.getActiveUsers()));
    }


    @MessageMapping("/room/languageChange")
    public void handleLanguageChange(@Payload Map<String, String> request,SimpMessageHeaderAccessor headerAccessor) {
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");
        WebSocketMessage message = WebSocketMessage.builder().event(WebsocketEvents.LANGUAGE_CHANGE).build();
        messagingTemplate.convertAndSend("/topic/room/" + roomId, Map.of("message", message, "language", request.get("language")));
    }

    @MessageMapping("/room/inputChange")
    public void handleInputChange(@Payload Map<String, String> request,SimpMessageHeaderAccessor headerAccessor) {
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");
        WebSocketMessage message = WebSocketMessage.builder().event(WebsocketEvents.INPUT_CHANGE).build();
        messagingTemplate.convertAndSend("/topic/room/" + roomId, Map.of("message", message, "input", request.get("input")));
    }

    @MessageMapping("/room/chatMessage")
    public void handleMessage(@Payload Map<String, Object> request,SimpMessageHeaderAccessor headerAccessor) {
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");
        WebSocketMessage message = WebSocketMessage.builder().event(WebsocketEvents.CHAT_MESSAGE).build();
        messagingTemplate.convertAndSend("/topic/room/" + roomId, Map.of("message", message, "chatMessage", request.get("chatMessage")));
    }
}
