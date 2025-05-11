// src/app/editor/editor.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// Import monaco-editor directly
import * as monaco from 'monaco-editor';

import { EditorService } from '../../services/editor.service';
import { RoomService } from '../../services/room.service';
import { CollaborationService } from '../../services/collaboration.service';
import { ExecutionService } from '../../services/execution.service';

import { User } from '../../models/user.model';
import { Room,SupportedLanguage } from '../../models/room.model';
import { Message } from '../../models/message.model';
import { CodeExecution } from '../../models/code-execution.model';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chatContainer') private chatContainer?: ElementRef;
  @ViewChild('editorContainer') private editorContainer?: ElementRef;

  // Monaco editor instance
  private editor?: monaco.editor.IStandaloneCodeEditor;

  // Room and user information
  roomId: string = '';
  currentUser: User | null = null;
  roomUsers: User[] = [];

  // Editor configuration
  editorOptions: any;
  code: string = '// Start coding here\n\n';
  selectedLanguage = new FormControl<SupportedLanguage>(SupportedLanguage.JavaScript);
  languages = [
    { id: SupportedLanguage.JavaScript, name: 'JavaScript' },
    { id: SupportedLanguage.Python, name: 'Python' },
    { id: SupportedLanguage.Java, name: 'Java' },
    { id: SupportedLanguage.Cpp, name: 'C++' }
  ];

  // Chat
  messages: Message[] = [];
  newMessage: FormControl = new FormControl('');

  // Code execution
  codeInput: FormControl = new FormControl('');
  execution: CodeExecution | null = null;
  isExecuting: boolean = false;

  // UI state
  connectionStatus: boolean = false;
  isLeftPanelOpen: boolean = true;
  isRightPanelOpen: boolean = true;

  // Subject for unsubscribing from observables
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private editorService: EditorService,
    private roomService: RoomService,
    private collaborationService: CollaborationService,
    private executionService: ExecutionService
  ) {
    // Get editor options from service
    this.editorOptions = this.editorService.editorOptions;
  }

  ngOnInit(): void {
    // Get room ID and username from route params
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const roomId = params.get('roomId');
      const username = params.get('username');

      if (!roomId || !username) {
        this.router.navigate(['/']);
        return;
      }

      this.roomId = roomId;

      // Get current user from session storage
      const storedUser = sessionStorage.getItem('currentUser');
      if (!storedUser) {
        this.router.navigate(['/']);
        return;
      }

      this.currentUser = JSON.parse(storedUser) as User;

      // Initialize room
      this.initializeRoom();
    });

    // Subscribe to editor language changes
    this.editorService.language$.pipe(takeUntil(this.destroy$)).subscribe(language => {
      this.selectedLanguage.setValue(language as SupportedLanguage); // avoid triggering valueChanges
      this.updateEditorLanguage(language);
    });

    // Subscribe to editor content changes
    this.editorService.codeContent$.pipe(takeUntil(this.destroy$)).subscribe(code => {
      this.code = code;
      this.updateEditorContent(code);
    });

    // Subscribe to connection status
    this.collaborationService.connectionStatus$.pipe(takeUntil(this.destroy$)).subscribe(status => {
      this.connectionStatus = status;
    });

    // Subscribe to chat messages
    this.collaborationService.chatMessage$.pipe(takeUntil(this.destroy$)).subscribe(message => {
      this.messages.push(message);
      this.scrollChatToBottom();
    });

    // Subscribe to user join events
    this.collaborationService.userJoin$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      const existingUserIndex = this.roomUsers.findIndex(u => u.name === user.name);
      if (existingUserIndex >= 0) {
        // Update existing user
        this.roomUsers[existingUserIndex] = { ...user };
      } else {
        // Add new user
        this.roomUsers.push(user);
      }

      // Update session storage
      sessionStorage.setItem('roomUsers', JSON.stringify(this.roomUsers));
    });

    // Subscribe to user leave events
    this.collaborationService.userLeave$.pipe(takeUntil(this.destroy$)).subscribe(username => {
      this.roomUsers = this.roomUsers.filter(u => u.name !== username);

      // Update session storage
      sessionStorage.setItem('roomUsers', JSON.stringify(this.roomUsers));
    });

    // Subscribe to language changes from the form control
    this.selectedLanguage.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(newLanguage => {
      if (newLanguage) {
        this.changeLanguage(newLanguage);
      }
    });
  }

  ngAfterViewInit(): void {
    this.scrollChatToBottom();
    // Initialize Monaco editor after view init
    this.initMonacoEditor();
  }

  // Initialize Monaco editor
  private initMonacoEditor(): void {
    if (this.editorContainer) {
      const element = this.editorContainer.nativeElement;

      this.editor = monaco.editor.create(element, {
        value: this.code,
        language: this.selectedLanguage.value,
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: {
          enabled: false
        },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        glyphMargin: true,
        folding: true,
        // Additional Monaco editor options from service
        ...this.editorOptions
      });

      // Register editor with service
      this.editorService.setEditorInstance(this.editor);

      // Add change event listener
      this.editor.onDidChangeModelContent(() => {
        const newCode = this.editor?.getValue() || '';
        // Only update if code has actually changed to prevent loops
        if (newCode !== this.code) {
          this.code = newCode;
          this.editorService.updateCodeContent(newCode);
        }
      });

      // Add cursor position change listener
      this.editor.onDidChangeCursorPosition(e => {
        if (this.currentUser) {
          const position = {
            lineNumber: e.position.lineNumber,
            column: e.position.column
          };
          this.collaborationService.updateCursorPosition(this.currentUser.name, position);
        }
      });

      // Add selection change listener
      this.editor.onDidChangeCursorSelection(e => {
        if (this.currentUser) {
          const selection = {
            startLineNumber: e.selection.startLineNumber,
            startColumn: e.selection.startColumn,
            endLineNumber: e.selection.endLineNumber,
            endColumn: e.selection.endColumn
          };
          this.collaborationService.updateSelectionRange(this.currentUser.name, selection);
        }
      });
    }
  }

  // Update editor content
  private updateEditorContent(code: string): void {
    if (this.editor && this.editor.getValue() !== code) {
      this.editor.setValue(code);
    }
  }

  // Update editor language
  private updateEditorLanguage(language: string): void {
    if (this.editor) {
      monaco.editor.setModelLanguage(this.editor.getModel()!, language);
    }
  }

  // Initialize the room and WebSocket connection
  private initializeRoom(): void {
    if (!this.currentUser || !this.roomId) return;

    // Get room details from service
    this.roomService.getRoomDetails(this.roomId).subscribe(room => {
      // Update code and language
      this.code = room.code;
      this.selectedLanguage.setValue(room.language);
      this.editorService.setLanguage(room.language);
      this.editorService.updateCodeContent(room.code);

      // Store users
      this.roomUsers = room.users;
      sessionStorage.setItem('roomUsers', JSON.stringify(this.roomUsers));

      // Initialize WebSocket connection
      this.initializeWebSocket(room);
    });
  }

  // Initialize WebSocket connection
  private initializeWebSocket(room: Room): void {
    if (!this.currentUser) return;

    this.collaborationService.initSocket(this.roomId, this.currentUser).subscribe(status => {
      console.log('WebSocket connection status:', status);
    });
  }

  // Change language
  changeLanguage(newLanguage: SupportedLanguage): void {
    this.editorService.setLanguage(newLanguage);

    // Update room language
    if (this.roomId) {
      const room : Room= {
        id: this.roomId,
        users: this.roomUsers,
        language: newLanguage,
        code: this.code
      } ;

      this.roomService.updateRoom(room).subscribe();
    }
  }

  // Send a chat message
  sendMessage(): void {
    const content = this.newMessage.value?.trim();
    if (!content || !this.currentUser) return;

    const message: Message = {
      userName: this.currentUser.name,
      content: content,
      timestamp: new Date(),
      type: 'text'
    };

    this.collaborationService.sendChatMessage(message);
    this.newMessage.setValue('');
  }

  // Execute code
  executeCode(): void {
    if (this.isExecuting) return;

    this.isExecuting = true;
    this.execution = {
      language: this.selectedLanguage.value!,
      code: this.code,
      input: this.codeInput.value || '',
      status: 'running'
    };

    // this.executionService.executeCode(this.execution).subscribe(result => {
    //   this.execution = result;
    //   this.isExecuting = false;
    // });
  }

  // Clear input
  clearInput(): void {
    this.codeInput.setValue('');
  }

  // Copy room ID to clipboard
  copyRoomId(): void {
    navigator.clipboard.writeText(this.roomId).then(() => {
      // Show toast or some feedback (could be implemented with a service)
      console.log('Room ID copied to clipboard');
    });
  }

  // Leave the room
  leaveRoom(): void {
    if (this.currentUser && this.roomId) {
      this.roomService.leaveRoom(this.roomId, this.currentUser.name).subscribe(() => {
        this.cleanup();
        this.router.navigate(['/']);
      });
    } else {
      this.cleanup();
      this.router.navigate(['/']);
    }
  }

  // Toggle left panel (chat)
  toggleLeftPanel(): void {
    this.isLeftPanelOpen = !this.isLeftPanelOpen;
  }

  // Toggle right panel (input/output/users)
  toggleRightPanel(): void {
    this.isRightPanelOpen = !this.isRightPanelOpen;
  }

  // Get user color for chat
  getUserColor(name: string): string {
    const user = this.roomUsers.find(u => u.name === name);
    return user?.color || '#cccccc';
  }

  // Compute connected users for template
  get connectedUsers(): User[] {
    return this.roomUsers.filter(user => user.status === 'active');
  }

  // Scroll chat to bottom
  private scrollChatToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  // Clean up before leaving
  private cleanup(): void {
    // Close WebSocket connection
    this.collaborationService.closeConnection();

    // Clear session storage
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentRoom');
    sessionStorage.removeItem('roomUsers');

    // Dispose editor resources
    if (this.editor) {
      this.editor.dispose();
    }
    this.editorService.dispose();
  }

  // Handle refresh or close
  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.cleanup();
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
