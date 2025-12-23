import { Component, ElementRef, ViewChild, OnDestroy, OnInit, ChangeDetectorRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ChatSocketService } from '../../../../core/services/chat-socket.service';
import { ThemeService } from '../../../../core/services/theme.service'; 
import type { ChatMessage } from '../../../../shared/models/chat.models';

import { CHAT_ROOMS, DEFAULT_ROOM, type ChatRoomId } from "chat-shared/rooms";

type UiMessage = {
  id: string;
  text: string;
  isMe: boolean;
  label: string;
  time: string;
};

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chat-page.component.html',
})
export class ChatPageComponent implements OnInit, OnDestroy {
  connected = false;
  socketId: string | null = null;

  displayName = '';
  composer = '';
  logs: { kind: string; time: string; text: string }[] = [];
  messages: UiMessage[] = [];

  @ViewChild('scrollHost') scrollHost?: ElementRef<HTMLDivElement>;

  rooms = CHAT_ROOMS;
  conversationId: ChatRoomId = DEFAULT_ROOM;
  private joinedConversationId: string | null = null;
  
  private sub = new Subscription();

  constructor(
	public chat: ChatSocketService, 
	public theme: ThemeService,
	private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.chat.connect();

    this.sub.add(this.chat.isConnected().subscribe(v => {
		this.connected = v;
		
		if (v) { 
			this.join(this.conversationId);
		} else {
			this.joinedConversationId = null;
		}		
		
		this.cdr.detectChanges();   // oder markForCheck()
	}));
	
    this.sub.add(this.chat.socketId().subscribe(id => {
		this.socketId = id;
		this.cdr.detectChanges();
	}));
	
    this.sub.add(this.chat.errors().subscribe(e => {
		this.log('error', e)
		this.cdr.detectChanges();
	}));

    this.sub.add(this.chat.messages().subscribe((m: ChatMessage) => {
		const isMe = !!this.socketId && m.from === this.socketId;
		const label = isMe ? (this.displayName.trim() || 'You') : 'Other';
		this.messages.push({
			id: m.id,
			text: m.text,
			isMe,
			label,
			time: new Date(m.ts).toLocaleTimeString(),
		});
		this.scrollToBottom();
		this.cdr.detectChanges();
    }));

    this.log('client', 'connected via proxy (/socket.io)');
  }
  
	selectRoom(r: ChatRoomId): void {
	  this.conversationId = r;
	  this.join(r);
	}

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

	send(): void {
		this.chat.sendMessage(this.conversationId, this.composer);
		this.composer = '';
	}
	
	join(id: string): void {
		const next = id.trim();
		if (!next) return;

		// alten Room verlassen
		if (this.joinedConversationId && this.joinedConversationId !== next) {
			this.chat.leaveConversation(this.joinedConversationId);
		}

		this.chat.joinConversation(next);
		this.joinedConversationId = next;

		// optional: UI leeren beim Roomwechsel
		this.messages = [];
		this.log('client', `joined room: ${next}`);
	}
	
	get activeRoomTitle(): string {
		return this.joinedConversationId ?? '—';
	}

  onEnter(e: Event): void {
	const ke = e as KeyboardEvent;

	if (ke.shiftKey) return;
	ke.preventDefault();
	this.send();
	}

  clear(): void {
    this.messages = [];
    this.logs = [];
    this.log('client', 'cleared');
  } 

  private log(kind: string, text: string): void {
    this.logs.push({ kind, time: new Date().toLocaleTimeString(), text });
    if (this.logs.length > 300) this.logs.shift();
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      const el = this.scrollHost?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}