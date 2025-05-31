package com.raslan.room;

import com.raslan.room.Exeption.DuplicateResourceException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Slf4j
public class RoomService {

    private final RedisTemplate<String, Room> redisTemplate;
    private final String ROOM_PREFIX = "room:";

    public Room createRoom(String username, String roomId) {
        Room room = new Room();
        room.setId(roomId);
        room.addUser(username);
        redisTemplate.opsForValue().set(ROOM_PREFIX + room.getId(), room);
        log.info("Room {} created by user {}", room.getId(), username);
        return room;
    }

    public Room joinRoom(String username, String roomId) {
        Room room = getRoom(roomId) ;
        log.info("User {} joined room {}", username, roomId);
        return room;
    }

    public Room getRoom(String roomId) {
        if (!isRoomExists(roomId)) {
            throw new RuntimeException("Room not found");
        }

        return redisTemplate.opsForValue().get(ROOM_PREFIX + roomId);
    }

    public Room joinOrCreate(String username, String roomId){
        if(!isRoomExists(roomId)) {
            return this.createRoom(username, roomId);
        }
        Room room = getRoom(roomId) ;
        if (room.getActiveUsers().contains(username)) {
            throw new DuplicateResourceException("user name is already taken");
        }
        room.addUser(username);
        redisTemplate.opsForValue().set(ROOM_PREFIX + roomId, room);
        return room ;
    }
    public Room leaveRoom(String roomId, String username) {
        Room room = getRoom(roomId);
        if (!room.getActiveUsers().contains(username)) {
            throw new RuntimeException("User not found in room");
        }
        room.getActiveUsers().remove(username);
        if (room.getActiveUsers().isEmpty()) {
            redisTemplate.delete(ROOM_PREFIX + roomId);
            log.info("Room {} deleted as it is empty", roomId);
        } else {
            redisTemplate.opsForValue().set(ROOM_PREFIX + roomId, room);
            log.info("User {} left room {}", username, roomId);
        }
        return room;
    }

    public boolean isRoomExists(String roomId) {
        return redisTemplate.hasKey(ROOM_PREFIX + roomId);
    }
}
