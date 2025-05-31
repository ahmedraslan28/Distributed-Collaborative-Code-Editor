package com.raslan.room.controller;


import com.raslan.room.Room;
import com.raslan.room.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class RoomController {
    private final RoomService roomService  ;
    @PostMapping
    public Room canJoinRoom(@RequestBody Map<String, String> request){
        return roomService.joinOrCreate(request.get("username"), request.get("roomId")) ;
    }
}
