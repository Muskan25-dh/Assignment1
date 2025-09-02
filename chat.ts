import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Sockets } from '../services/sockets';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']   
})
export class Chat implements OnInit {
  private socketService = inject(Sockets);

  // signal
  messageOut = signal("");
  messages = signal<string[]>([]);
  members = signal<{ id: string, username: string, role: string }[]>([]);
  joined = signal(false);

  // user info 
  username = localStorage.getItem('username') || 'guest';
  role = localStorage.getItem('role') || 'user';
  room = 'group1';

  ngOnInit() {
    console.log('Logged in role:', this.role);
  console.log('Logged in username:', this.username);
    // Joining the room
    this.socketService.joinRoom(this.room, this.username, this.role);

    // Listening to messages
    this.socketService.onMessage().subscribe(msg => {
      this.messages.update(old => [...old, msg]);
    });

    // Listen for user join/leave
    this.socketService.onUserJoined().subscribe(data => {
      this.messages.update(old => [...old, `${data.username} joined as ${data.role}`]);
      this.members.set(data.members); 
            console.log('Updated members:', data.members);

    });

    this.socketService.onUserLeft().subscribe(data => {
      this.messages.update(old => [...old, `${data.username} left`]);
      this.members.set(data.members); 
    });

    // Listen if kicked
    this.socketService.onKicked().subscribe(() => {
      alert('You were kicked!');
    });
  }

  send() {
    if (this.messageOut().trim()) {
      this.socketService.sendMessage(this.room, `${this.username}: ${this.messageOut()}`);
      this.messageOut.set('');
    }
  }

  kickMember(targetId: string) {
      console.log('Trying to kick member with ID:', targetId);
    if (this.role === 'superadmin' || this.role === 'groupadmin') {
      this.socketService.kickMember(targetId);
    } else {
      alert('No permission to kick members');
    }
  }

  joinRoom() {
    this.socketService.joinRoom(this.room, this.username, this.role);
    this.joined.set(true);
  }
}
