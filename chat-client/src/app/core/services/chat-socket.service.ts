import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ClientToServerEvents,
  ServerToClientEvents
} from "chat-shared/events";
import type { ChatMessage, Ack } from "chat-shared/models";

@Injectable({ providedIn: 'root' })
export class ChatSocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  private connected$ = new BehaviorSubject<boolean>(false);
  private socketId$ = new BehaviorSubject<string | null>(null);

  private message$ = new Subject<ChatMessage>();
  private error$ = new Subject<string>();

  connect(): void {
    if (this.socket) this.socket.disconnect();

    // Same-origin: Proxy routed /socket.io -> http://localhost:3000/socket.io
    this.socket = io({
      path: environment.socketPath,
      transports: ['websocket'],
      withCredentials: true,
    }); 
	
    this.socket.on('connect', () => {
		this.connected$.next(true);
		this.socketId$.next(this.socket?.id ?? null);
	});

    this.socket.on('disconnect', () => {
      this.connected$.next(false);
      this.socketId$.next(null);
    });

    this.socket.on('connect_error', (err: any) => {
      this.connected$.next(false);
      this.error$.next(err?.message ?? String(err));
    });

    this.socket.on('message:new', (msg) => {
      this.message$.next(msg);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
 
	joinConversation(conversationId: string): void {
		if (!this.socket) return;

		const id = conversationId.trim();
		this.socket.emit("conversation:join", id, (ack: Ack) => {
			if (!ack.ok) this.error$.next(ack.error);
		});
	}

	leaveConversation(conversationId: string): void {
		if (!this.socket) return;

		const id = conversationId.trim();
		this.socket.emit("conversation:leave", id, (ack: Ack) => {
			if (!ack.ok) this.error$.next(ack.error);
		});
	}

	sendMessage(conversationId: string, text: string): void {
		if (!this.socket) return;

		this.socket.emit("message:send", { conversationId, text }, (ack) => {
			if (!ack.ok) this.error$.next(ack.error);
		});
	}

  // Observables
  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  socketId(): Observable<string | null> {
    return this.socketId$.asObservable();
  }

  messages(): Observable<ChatMessage> {
    return this.message$.asObservable();
  }

  errors(): Observable<string> {
    return this.error$.asObservable();
  }
}