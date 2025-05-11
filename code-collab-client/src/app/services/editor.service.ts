import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CollaborationService } from './collaboration.service';
import * as monaco from 'monaco-editor';

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  // Monaco editor instance
  private editorInstance: any = null;

  // User decorations in editor (cursors and selections)
  private userDecorations: Map<string, string[]> = new Map();

  // Current language
  private languageSubject = new BehaviorSubject<string>('javascript');
  public language$ = this.languageSubject.asObservable();

  // Current code content
  private codeContentSubject = new BehaviorSubject<string>('// Start coding here\n\n');
  public codeContent$ = this.codeContentSubject.asObservable();

  // Editor is ready
  private editorReadySubject = new BehaviorSubject<boolean>(false);
  public editorReady$ = this.editorReadySubject.asObservable();

  // Editor options
  public editorOptions = {
    theme: 'vs-dark',
    language: 'javascript',
    fontSize: 14,
    automaticLayout: true,
    wordWrap: 'on',
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    tabSize: 2,
    renderWhitespace: 'none',
    fixedOverflowWidgets: true
  };

  // Content change timer for debouncing
  private contentChangeTimeout: any = null;

  // Flag to avoid triggering change events during programmatic changes
  private suppressEvents = false;

  constructor(private collaborationService: CollaborationService) {
    // Subscribe to code changes from other users
    this.collaborationService.codeChange$.subscribe(code => {
      this.updateCodeContent(code, true);
    });

    // Subscribe to cursor position changes from other users
    this.collaborationService.cursorChange$.subscribe(data => {
      this.updateUserCursor(data.username, data.position);
    });

    // Subscribe to selection range changes from other users
    this.collaborationService.selectionChange$.subscribe(data => {
      this.updateUserSelection(data.username, data.range);
    });
  }

  // Initialize editor instance
  setEditorInstance(editor: any): void {
    this.editorInstance = editor;
    this.editorReadySubject.next(true);

    // Setup editor event listeners
    this.setupEventListeners();
  }

  // Get editor instance
  getEditorInstance(): any {
    return this.editorInstance;
  }

  // Update editor language mode
  setLanguage(language: string): void {
    if (!this.editorInstance) return;

    // Map to Monaco language identifiers
    let monacoLanguage: string;
    switch (language) {
      case 'python':
        monacoLanguage = 'python';
        break;
      case 'cpp':
        monacoLanguage = 'cpp';
        break;
      case 'java':
        monacoLanguage = 'java';
        break;
      case 'javascript':
      default:
        monacoLanguage = 'javascript';
        break;
    }

    // Update model language
    monaco.editor.setModelLanguage(this.editorInstance.getModel(), monacoLanguage);
    this.languageSubject.next(language);
  }

  // Update code content programmatically
  updateCodeContent(code: string, fromRemote: boolean = false): void {
    // Update subject
    this.codeContentSubject.next(code);

    // Update editor if it exists
    if (this.editorInstance) {
      this.suppressEvents = true;
      this.editorInstance.setValue(code);
      this.suppressEvents = false;
    }
  }

  // Setup editor event listeners
  private setupEventListeners(): void {
    if (!this.editorInstance) return;

    // Content change event
    this.editorInstance.onDidChangeModelContent((e: any) => {
      if (this.suppressEvents) return;

      // Get current content and update subject
      const code = this.editorInstance.getValue();
      this.codeContentSubject.next(code);

      // Debounce sending changes to others
      if (this.contentChangeTimeout) {
        clearTimeout(this.contentChangeTimeout);
      }

      this.contentChangeTimeout = setTimeout(() => {
        this.collaborationService.sendCodeChange(code);
      }, 300);
    });

    // Cursor position change event
    this.editorInstance.onDidChangeCursorPosition((e: any) => {
      if (this.suppressEvents) return;

      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
      if (!currentUser.id) return;

      const position = e.position;

      // Send cursor position to other users
      this.collaborationService.updateCursorPosition(currentUser.id, position);
    });

    // Selection change event
    this.editorInstance.onDidChangeCursorSelection((e: any) => {
      if (this.suppressEvents) return;

      const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
      if (!currentUser.id) return;

      const selection = e.selection;

      // Only send if there's an actual selection (not just cursor)
      if (selection.startLineNumber !== selection.endLineNumber ||
          selection.startColumn !== selection.endColumn) {
        this.collaborationService.updateSelectionRange(currentUser.id, selection);
      }
    });
  }

  // Update user cursor position in editor
  updateUserCursor(username: string, position: any): void {
    if (!this.editorInstance) return;

    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (username === currentUser.name) return; // Don't show own cursor

    const users = JSON.parse(sessionStorage.getItem('roomUsers') || '[]');
    const user = users.find((u: any) => u.name === username);

    if (!user) return;

    // Remove old decorations for this user
    const oldDecorations = this.userDecorations.get(username) || [];
    this.editorInstance.deltaDecorations(oldDecorations, []);

    // Create new decorations
    const newDecorations = this.editorInstance.deltaDecorations([], [{
      range: new monaco.Range(
        position.lineNumber,
        position.column,
        position.lineNumber,
        position.column
      ),
      options: {
        className: 'cursor-decoration',
        hoverMessage: { value: user.name },
        beforeContentClassName: `cursor-decoration-before cursor-${user.name}`,
        zIndex: 100
      }
    }]);

    // Store new decorations
    this.userDecorations.set(username, newDecorations);

    // Add dynamic style for this user's cursor if not already added
    this.addCursorStyle(username, user.color);
  }

  // Update user text selection in editor
  updateUserSelection(username: string, range: any): void {
    if (!this.editorInstance) return;

    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (username === currentUser.name) return; // Don't show own selection

    const users = JSON.parse(sessionStorage.getItem('roomUsers') || '[]');
    const user = users.find((u: any) => u.name === username);

    if (!user) return;

    // Remove old decorations for this user
    const oldDecorations = this.userDecorations.get(username) || [];
    this.editorInstance.deltaDecorations(oldDecorations, []);

    // Create new decoration for selection
    const newDecorations = this.editorInstance.deltaDecorations([], [{
      range: new monaco.Range(
        range.startLineNumber,
        range.startColumn,
        range.endLineNumber,
        range.endColumn
      ),
      options: {
        className: `selection-decoration selection-${username}`,
        hoverMessage: { value: user.name },
        zIndex: 90
      }
    }]);

    // Store new decorations
    this.userDecorations.set(username, newDecorations);

    // Add dynamic style for this user's selection if not already added
    this.addSelectionStyle(username, user.color);
  }

  // Add CSS for cursor style dynamically
  private addCursorStyle(username: string, color: string): void {
    const styleId = `cursor-style-${username}`;
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .cursor-${username} {
        position: absolute;
        border-left: 2px solid ${color};
        width: 0 !important;
        height: 18px !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Add CSS for selection style dynamically
  private addSelectionStyle(username: string, color: string): void {
    const styleId = `selection-style-${username}`;
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .selection-${username} {
        background-color: ${color}40; /* 25% opacity */
      }
    `;
    document.head.appendChild(style);
  }

  // Clean up resources
  dispose(): void {
    if (this.contentChangeTimeout) {
      clearTimeout(this.contentChangeTimeout);
    }

    // Remove all dynamic styles
    document.querySelectorAll('[id^="cursor-style-"], [id^="selection-style-"]').forEach(el => {
      el.remove();
    });
  }
}
