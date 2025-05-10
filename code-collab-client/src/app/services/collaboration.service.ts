// src/app/services/collaboration.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Client, Frame, Message as StompMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { User } from '../models/user.model';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private stompClient: Client | null = null;
  private readonly SUBSCRIBE_URL = '/topic/room';            // Where clients listen (Spring broadcasts here)
  private readonly SEND_URL = '/app/room';
  private readonly SOCKET_ENDPOINT = 'http://localhost:8080/ws'; // Spring Boot WebSocket endpoint
  private activeRoomId: string = '';
  private activeUser: User | null = null;

  // Subjects to broadcast events to components
  private codeChangeSubject = new Subject<string>();
  private cursorChangeSubject = new Subject<{userId: string, position: any}>();
  private selectionChangeSubject = new Subject<{userId: string, range: any}>();
  private userJoinSubject = new Subject<User>();
  private userLeaveSubject = new Subject<string>();
  private chatMessageSubject = new Subject<Message>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  // Observables that components can subscribe to
  public codeChange$ = this.codeChangeSubject.asObservable();
  public cursorChange$ = this.cursorChangeSubject.asObservable();
  public selectionChange$ = this.selectionChangeSubject.asObservable();
  public userJoin$ = this.userJoinSubject.asObservable();
  public userLeave$ = this.userLeaveSubject.asObservable();
  public chatMessage$ = this.chatMessageSubject.asObservable();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor() { }

  // Initialize STOMP WebSocket connection
  initSocket(roomId: string, user: User): Observable<boolean> {
    this.activeRoomId = roomId;
    this.activeUser = user;

    // Create STOMP client over SockJS
    const socket = new SockJS(this.SOCKET_ENDPOINT);
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    // Connect handlers
    this.stompClient.onConnect = (frame: Frame) => {
      console.log('Connected: ' + frame);
      this.connectionStatusSubject.next(true);

      // Subscribe to room-specific topics
      this.subscribeToRoom(roomId);

      // Send join message
      this.sendJoinNotification(user, roomId);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP error', frame);
      this.connectionStatusSubject.next(false);
    };

    this.stompClient.onWebSocketClose = () => {
      console.log('WebSocket connection closed');
      this.connectionStatusSubject.next(false);
    };

    // Activate the connection
    this.stompClient.activate();

    return this.connectionStatus$;
  }

  // Subscribe to all room topics
  private subscribeToRoom(roomId: string): void {
    if (!this.stompClient) return;

    // Subscribe to code changes
    this.stompClient.subscribe(`${this.SUBSCRIBE_URL}/${roomId}`, (message) => {
      const body = JSON.parse(message.body);
      this.codeChangeSubject.next(body.code);
    });

    // Subscribe to cursor changes
    this.stompClient.subscribe(`${this.SUBSCRIBE_URL}/${roomId}`, (message) => {
      const body = JSON.parse(message.body);
      this.cursorChangeSubject.next({
        userId: body.userId,
        position: body.position
      });
    });

    // Subscribe to selection changes
    this.stompClient.subscribe(`${this.SUBSCRIBE_URL}/${roomId}`, (message) => {
      const body = JSON.parse(message.body);
      this.selectionChangeSubject.next({
        userId: body.userId,
        range: body.range
      });
    });

    // Subscribe to user join events
    this.stompClient.subscribe(`${this.SUBSCRIBE_URL}/${roomId}`, (message) => {
      const user = JSON.parse(message.body);
      this.userJoinSubject.next(user);

      // Create system message for user join
      const joinMessage: Message = {
        userName: 'System',
        content: `${user.name} joined the room`,
        timestamp: new Date(),
        type: 'system'
      };

      this.chatMessageSubject.next(joinMessage);
    });

    // Subscribe to user leave events
    this.stompClient.subscribe(`${this.SUBSCRIBE_URL}/${roomId}`, (message) => {
      const data = JSON.parse(message.body);
      this.userLeaveSubject.next(data.userId);

      // Create system message for user leave
      const leaveMessage: Message = {
        userName: 'System',
        content: `${data.userName} left the room`,
        timestamp: new Date(),
        type: 'system'
      };

      this.chatMessageSubject.next(leaveMessage);
    });

    // Subscribe to chat messages
    this.stompClient.subscribe(`${this.SUBSCRIBE_URL}/${roomId}/chat`, (message) => {
      const chatMessage = JSON.parse(message.body);
      this.chatMessageSubject.next(chatMessage);
    });
  }

  // Send join notification
  private sendJoinNotification(user: User, roomId: string): void {
    if (!this.stompClient || !this.connectionStatusSubject.value) return;

    this.stompClient.publish({
      destination: `${this.SEND_URL}/join`,
      body: JSON.stringify(user)
    });
  }

  // Send code changes to server
  sendCodeChange(code: string): void {
    if (!this.stompClient || !this.connectionStatusSubject.value) return;

    this.stompClient.publish({
      destination: `/app/room/${this.activeRoomId}/code`,
      body: JSON.stringify({ code })
    });
  }

  // Update cursor position
  updateCursorPosition(userId: string, position: any): void {
    if (!this.stompClient || !this.connectionStatusSubject.value) return;

    this.stompClient.publish({
      destination: `/app/room/${this.activeRoomId}/cursor`,
      body: JSON.stringify({ userId, position })
    });
  }

  // Send selection range changes
  updateSelectionRange(userId: string, range: any): void {
    if (!this.stompClient || !this.connectionStatusSubject.value) return;

    this.stompClient.publish({
      destination: `/app/room/${this.activeRoomId}/selection`,
      body: JSON.stringify({ userId, range })
    });
  }

  // Send chat message
  sendChatMessage(message: Message): void {
    if (!this.stompClient || !this.connectionStatusSubject.value) return;

    this.stompClient.publish({
      destination: `/app/room/${this.activeRoomId}/chat`,
      body: JSON.stringify(message)
    });
  }

  // Send leave notification when user exits
  sendLeaveNotification(): void {
    if (!this.stompClient || !this.connectionStatusSubject.value || !this.activeUser) return;

    this.stompClient.publish({
      destination: `/app/room/${this.activeRoomId}/leave`,
      body: JSON.stringify({
        userName: this.activeUser.name
      })
    });
  }

  // For development/testing purposes only - to be removed in production
  simulateCodeChange(code: string): void {
    this.codeChangeSubject.next(code);
  }

  simulateCursorChange(userId: string, position: any): void {
    this.cursorChangeSubject.next({ userId, position });
  }

  simulateSelectionChange(userId: string, range: any): void {
    this.selectionChangeSubject.next({ userId, range });
  }

  simulateUserJoin(user: User): void {
    this.userJoinSubject.next(user);

    const joinMessage: Message = {
      userName: 'System',
      content: `${user.name} joined the room`,
      timestamp: new Date(),
      type: 'system'
    };

    this.chatMessageSubject.next(joinMessage);
  }

  simulateUserLeave(userId: string, userName: string): void {
    this.userLeaveSubject.next(userId);

    const leaveMessage: Message = {
      userName: 'System',
      content: `${userName} left the room`,
      timestamp: new Date(),
      type: 'system'
    };

    this.chatMessageSubject.next(leaveMessage);
  }

  // Close socket connection when leaving
  closeConnection(): void {
    console.log('Closing STOMP WebSocket connection');

    // Send leave notification before disconnecting
    if (this.activeUser) {
      this.sendLeaveNotification();
    }

    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }

    this.connectionStatusSubject.next(false);
    this.activeRoomId = '';
    this.activeUser = null;
  }
}
