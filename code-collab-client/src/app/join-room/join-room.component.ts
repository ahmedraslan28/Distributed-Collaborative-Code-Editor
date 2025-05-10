// src/app/join-room/join-room.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RoomService } from '../services/room.service';
import { User } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';


@Component({
  selector: 'app-join-room',
  templateUrl: './join-room.component.html',
  styleUrls: ['./join-room.component.scss']
})
export class JoinRoomComponent implements OnInit {
  joinForm: FormGroup;
  isSubmitting = false;
  formError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private roomService: RoomService
  ) {
    this.joinForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      roomId: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(36)]]
    });
  }

  ngOnInit(): void {
    // Clear any stored session data when landing on join page
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentRoom');
  }

  generateRoomId(): void {
    // Generate a random alphanumeric room ID with 8 characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = uuidv4();

    this.joinForm.get('roomId')?.setValue(result);
  }

  validateForm(): boolean {
    this.formError = '';

    const usernameControl = this.joinForm.get('username');
    const roomIdControl = this.joinForm.get('roomId');

    if (!usernameControl?.value.trim()) {
      this.formError = 'Name is required';
      return false;
    }

    if (usernameControl.hasError('minlength')) {
      this.formError = 'Name must be at least 3 characters';
      return false;
    }

    if (usernameControl.hasError('maxlength')) {
      this.formError = 'Name must be less than 20 characters';
      return false;
    }

    if (!roomIdControl?.value.trim()) {
      this.formError = 'Room ID is required';
      return false;
    }

    if (roomIdControl.hasError('minlength')) {
      this.formError = 'Room ID must be at least 6 characters';
      return false;
    }

    if (roomIdControl.hasError('maxlength')) {
      this.formError = 'Room ID must be less than 12 characters';
      return false;
    }

    return true;
  }

  onSubmit(): void {
    if (!this.validateForm() || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const username = this.joinForm.get('username')?.value.trim();
    const roomId = this.joinForm.get('roomId')?.value.trim();

    // Store user info in session storage for persistence
    const userInfo : User = {
      id: this.generateUserId(),
      name: username,
      color: this.getRandomColor(),
      status: 'active',
    };

    sessionStorage.setItem('currentUser', JSON.stringify(userInfo));

    // Call service to join/create room
    this.roomService.joinRoom(roomId, userInfo).subscribe({
      next: (room) => {
        sessionStorage.setItem('currentRoom', JSON.stringify(room));
        this.router.navigate(['/editor', roomId, username]);
      },
      error: (error) => {
        this.formError = 'Failed to join room. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  private getRandomColor(): string {
    // Generate a random color but avoid very light colors
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}
