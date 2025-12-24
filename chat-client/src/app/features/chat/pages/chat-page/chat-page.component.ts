import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { ChatSocketService } from '../../../../core/services/chat-socket.service';
import { AuthService } from '../../../../core/services/auth.service';

import { CHAT_ROOMS, DEFAULT_ROOM, type ChatRoomId } from 'chat-shared/rooms';
import type { ChatMessage } from 'chat-shared/models';

type LogLine = { ts: number; tag: 'client' | 'socket' | 'server'; text: string };

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule], // ✅ genau 3 Imports
  templateUrl: './chat-page.component.html',
})
export class ChatPageComponent implements OnInit, OnDestroy {
  // ===== Rooms =====
  rooms = CHAT_ROOMS;
  conversationId: ChatRoomId = DEFAULT_ROOM;
  joinedConversationId: ChatRoomId | null = null;

  // ===== UI / State =====
  connected = false;
  socketId: string | null = null;

  // ===== Chat =====
  messages: ChatMessage[] = [];
  composer = '';

  // ===== Soft Login (wie vorher: displayName) =====
  displayName = '';

  // ===== Logs =====
  logs: LogLine[] = [];

  private sub = new Subscription();

  constructor(
    public chat: ChatSocketService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.log('client', 'chat page init');

    // Socket Status
    this.sub.add(
      this.chat.isConnected().subscribe((v: boolean) => {
        this.connected = v;
        this.log('socket', v ? 'connected' : 'disconnected');

        // Auto-join on reconnect, wenn wir schon einen Raum hatten
        if (v && this.joinedConversationId) {
          this.chat.joinConversation(this.joinedConversationId);
          this.log('socket', `re-join #${this.joinedConversationId}`);
        }
      })
    );

    this.sub.add(
      this.chat.socketId().subscribe((id: string | null) => {
        this.socketId = id;
      })
    );

    // Incoming messages
    this.sub.add(
      this.chat.messages().subscribe((m: ChatMessage) => {
        // Safety: nur anzeigen, wenn es der aktive Raum ist
        if (this.joinedConversationId && m.conversationId !== this.joinedConversationId) return;
        this.messages.push(m);
      })
    );

    // Start socket
    this.chat.connect();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // ===== Helpers =====
  get activeRoomTitle(): string {
    return this.joinedConversationId ?? this.conversationId ?? DEFAULT_ROOM;
  }

  private log(tag: LogLine['tag'], text: string): void {
    this.logs.unshift({ ts: Date.now(), tag, text });
    if (this.logs.length > 200) this.logs.length = 200;
  }

  // ===== Soft Login =====
  doLogin(): void {
    const ok = this.auth.login(this.displayName);
    if (!ok) {
      this.log('client', 'login failed (name too short?)');
      return;
    }

    this.displayName = '';
    this.log('client', 'login ok');

    // nach Login direkt in den Default/gewählten Raum
    this.selectRoom(this.conversationId);
  }

  logout(): void {
    this.auth.logout();
    this.joinedConversationId = null;
    this.messages = [];
    this.log('client', 'logout');
  }

  // ===== Rooms (Click = Join, kein Join-Button) =====
  selectRoom(r: ChatRoomId): void {
    this.conversationId = r;

    // leave previous
    if (this.joinedConversationId && this.joinedConversationId !== r) {
      this.chat.leaveConversation(this.joinedConversationId);
      this.log('socket', `leave #${this.joinedConversationId}`);
    }

    // join new
    this.chat.joinConversation(r);
    this.joinedConversationId = r;

    // optional: Messages beim Raumwechsel leeren (wie wir es öfter gemacht haben)
    this.messages = [];
    this.log('socket', `join #${r}`);
  }

  // ===== Messaging =====
  send(): void {
    const text = this.composer.trim();
    if (!text) return;
    if (!this.joinedConversationId) return;

    this.chat.sendMessage(this.joinedConversationId, text);
    this.composer = '';
  }

  onEnter(e: Event): void {
    const ke = e as KeyboardEvent;
    if (ke.shiftKey) return;
    ke.preventDefault();
    this.send();
  }

  // ===== UI Buttons =====
  clear(): void {
    this.messages = [];
    this.log('client', 'clear messages');
  }

  clearLogs(): void {
    this.logs = [];
  }
}
