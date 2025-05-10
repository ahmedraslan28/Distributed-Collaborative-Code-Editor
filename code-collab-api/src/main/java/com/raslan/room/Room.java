package com.raslan.room;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
public class Room {
    private String id;
    private Set<String> activeUsers;
    public Room(){
        this.id = UUID.randomUUID().toString();
        this.activeUsers = new HashSet<>() ;
    }
    public void addUser(String username) {
        this.activeUsers.add(username);
    }
}
