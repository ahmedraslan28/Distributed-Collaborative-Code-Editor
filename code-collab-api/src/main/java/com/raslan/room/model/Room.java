package com.raslan.room.model;

import com.raslan.room.model.Languge;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Data
public class Room {
    private String id;
    private Set<String> activeUsers;
    private String code ;
    private String input ;
    private String output ;
    private Languge language;
    private String cursorPosition ;

    public Room(){
        this.id = UUID.randomUUID().toString();
        this.activeUsers = new HashSet<>() ;
        this.language = Languge.JAVASCRIPT ;
    }
    public void addUser(String username) {
        this.activeUsers.add(username);
    }
}
