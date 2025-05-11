import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Room, SupportedLanguage } from '../models/room.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private apiUrl = 'api/rooms'; // This would point to your actual backend API

  // For development purpose, we'll use local storage to mock the API
  // This would be replaced with actual API calls in production

  // constructor(private http: HttpClient) { }
  constructor() {}

  joinRoom(roomId: string, user: User): Observable<Room> {
    // In a real implementation, this would be an HTTP request
    // For now, we'll mock the backend response

    // Check if room exists in localStorage
    const storedRoom = localStorage.getItem(`room_${roomId}`);
    let room: Room;

    if (storedRoom) {
      // Room exists, add user to it
      room = JSON.parse(storedRoom) as Room;

      // Check if user already exists in the room
      const existingUserIndex = room.users.findIndex((u) => u.name === user.name);
      if (existingUserIndex >= 0) {
        // Update existing user
        room.users[existingUserIndex] = { ...user, status: 'active' };
      } else {
        // Add new user
        room.users.push({ ...user, status: 'active' });
      }
    } else {
      // Create new room
      room = {
        id: roomId,
        users: [{ ...user, status: 'active' }],
        language: SupportedLanguage.JavaScript, // Default language
        code: '// Start coding here\n\n',
      };
    }

    // Save updated room to localStorage
    localStorage.setItem(`room_${roomId}`, JSON.stringify(room));

    // Return observable that emits the room
    return of(room).pipe(
      tap((_) => console.log(`User ${user.name} joined room ${roomId}`)),
      catchError(this.handleError<Room>('joinRoom'))
    );
  }

  getRoomDetails(roomId: string): Observable<Room> {
    // In a real implementation, this would be an HTTP request
    // For now, we'll mock the backend response

    const storedRoom = localStorage.getItem(`room_${roomId}`);
    if (!storedRoom) {
      return of({
        id: roomId,
        users: [],
        language: SupportedLanguage.JavaScript, // Default language
        code: '// Start coding here\n\n',
      }).pipe(
        catchError(this.handleError<Room>(`getRoomDetails id=${roomId}`))
      );
    }

    return of(JSON.parse(storedRoom)).pipe(
      tap((_) => console.log(`Fetched room ${roomId}`)),
      catchError(this.handleError<Room>(`getRoomDetails id=${roomId}`))
    );
  }

  updateRoom(room: Room): Observable<Room> {
    // In a real implementation, this would be an HTTP request
    // For now, we'll mock the backend response

    localStorage.setItem(`room_${room.id}`, JSON.stringify(room));

    return of(room).pipe(
      tap((_) => console.log(`Updated room ${room.id}`)),
      catchError(this.handleError<Room>('updateRoom'))
    );
  }

  leaveRoom(roomId: string, username: string): Observable<boolean> {
    // In a real implementation, this would be an HTTP request
    // For now, we'll mock the backend response

    const storedRoom = localStorage.getItem(`room_${roomId}`);
    if (storedRoom) {
      const room: Room = JSON.parse(storedRoom);

      // Remove user from room
      room.users = room.users.filter((u) => u.name !== username);

      // If room is empty, remove it from localStorage
      if (room.users.length === 0) {
        localStorage.removeItem(`room_${roomId}`);
      } else {
        // Otherwise, update room in localStorage
        localStorage.setItem(`room_${roomId}`, JSON.stringify(room));
      }
    }

    return of(true).pipe(
      tap((_) => console.log(`User ${userId} left room ${roomId}`)),
      catchError(this.handleError<boolean>('leaveRoom'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Return empty result to keep app running
      return of(result as T);
    };
  }
}
