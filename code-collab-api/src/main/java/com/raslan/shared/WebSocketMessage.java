package com.raslan.shared;

import com.raslan.room.Room;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebSocketMessage {
    private String event ;
    private String roomId ;
    private String username ;
    private String message ;
}
