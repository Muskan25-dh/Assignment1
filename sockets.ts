import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Sockets {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // backend server
  }

  // Join a room
  joinRoom(room: string, username: string, role: string) {
    this.socket.emit('joinRoom', { roomName: room, username, role });
  }

  // Send a message to the room
  sendMessage(room: string, message: string) {
    this.socket.emit('newmsg', { room, message });
  }

  // Kick a member
  kickMember(targetId: string) {
    this.socket.emit('kickMember', targetId);
  }

  // --- Listeners ---

  // Listen for messages
  onMessage(): Observable<string> {
    return new Observable(observer => {
      this.socket.on('newmsg', (msg: string) => {
        observer.next(msg);
      });
    });
  }

  // Listen when user joins
  onUserJoined(): Observable<{ username: string; role: string; members: any[] }> {
    return new Observable(observer => {
      this.socket.on('userJoined', (data) => {
        observer.next(data);
      });
    });
  }

  // Listen when user leaves
  onUserLeft(): Observable<{ username: string; role: string; members: any[] }> {
    return new Observable(observer => {
      this.socket.on('userLeft', (data) => {
        observer.next(data);
      });
    });
  }

  // Listen when kicked
  onKicked(): Observable<void> {
    return new Observable(observer => {
      this.socket.on('kicked', () => {
        observer.next();
      });
    });
  }
}
