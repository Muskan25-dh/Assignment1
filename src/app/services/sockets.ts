import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

export interface Member {
  id: string;
  socketId: string;
  username: string;
  role: string;
}


export interface ChatMessage {
  type: 'text' | 'image';
  sender: string;
  role: string;
  content: string;   
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SocketsService {
  private socket: Socket;

  private membersUpdated = new Subject<Member[]>();
  private userJoined = new Subject<Member>();
  private userLeft = new Subject<Member>();
  private promotionResult = new Subject<{ success: boolean; message: string }>();
  private messageReceived = new Subject<ChatMessage>();
  private messageHistory = new Subject<ChatMessage[]>();

  constructor() {
    this.socket = io('http://localhost:3000');

    // Member events
    this.socket.on('membersUpdate', (members: Member[]) => this.membersUpdated.next(members));
    this.socket.on('userJoined', (user: Member) => this.userJoined.next(user));
    this.socket.on('userLeft', (user: Member) => this.userLeft.next(user));
    this.socket.on('userPromoted', (data: { socketId: string; username: string }) => {
      this.promotionResult.next({ success: true, message: `${data.username} promoted` });
    });

    // Message events
    this.socket.on('newmsg', (msg: ChatMessage) => this.messageReceived.next(msg));
    this.socket.on('messageHistory', (msgs: ChatMessage[]) => this.messageHistory.next(msgs));

    // Admin / error events
    this.socket.on('kicked', () => alert('You were kicked from the room!'));
    this.socket.on('error', (err: any) => this.promotionResult.next({ success: false, message: err.message || err }));
  }

  // Join a room
  joinRoom(roomName: string, username: string, role: string) {
    this.socket.emit('joinRoom', { roomName, username, role });
  }

  // Send text message
  sendMessage(roomName: string, message: string) {
    this.socket.emit('newmsg', { room: roomName, message });
  }

  // Send image message
  sendImage(roomName: string, imageUrl: string) {
    this.socket.emit('sendImage', { room: roomName, imageUrl });
  }

  // Admin actions
  kickMember(targetSocketId: string) {
    this.socket.emit('kickMember', targetSocketId);
  }

  promoteToAdmin(targetSocketId: string) {
    this.socket.emit('promoteUser', { targetSocketId });
  }

  // Observables for components
  onMembersUpdated(): Observable<Member[]> { return this.membersUpdated.asObservable(); }
  onUserJoined(): Observable<Member> { return this.userJoined.asObservable(); }
  onUserLeft(): Observable<Member> { return this.userLeft.asObservable(); }
  onPromotionResult(): Observable<{ success: boolean; message: string }> { return this.promotionResult.asObservable(); }
  onMessage(): Observable<ChatMessage> { return this.messageReceived.asObservable(); }
  onMessageHistory(): Observable<ChatMessage[]> { return this.messageHistory.asObservable(); }
}
