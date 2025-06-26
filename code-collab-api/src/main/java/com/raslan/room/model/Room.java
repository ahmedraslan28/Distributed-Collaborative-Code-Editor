package com.raslan.room.model;

import lombok.Data;

import java.util.*;

@Data
public class Room {
    private String id;
    private Set<String> activeUsers;
    private String code ;
    private String input ;
    private String output ;
    private com.raslan.room.model.language language;
    private List<Map<String, String>> chatMessages;
    public Room(){
        this.id = UUID.randomUUID().toString();
        this.activeUsers = new HashSet<>() ;
        this.chatMessages = new ArrayList<>() ;
        this.input = "" ;
        this.output = "" ;
        this.language = com.raslan.room.model.language.JAVASCRIPT ;
        this.code = """
                // Welcome to the Collaborative Code Editor
                // Start coding here...

                function helloWorld() {
                  console.log("Hello, world!");
                }

                helloWorld();""";
    }
    public void addChatMessage(Map<String, String> message) {
        this.chatMessages.add(message);
    }
    public void addUser(String username) {
        this.activeUsers.add(username);
    }
}
