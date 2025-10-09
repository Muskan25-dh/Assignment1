import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SocketsService, Member, ChatMessage } from '../services/sockets';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent implements OnInit {
  roomName = 'group1';
  username = 'Guest';
  role = 'user';
  members: Member[] = [];
  messages: ChatMessage[] = []; // store objects instead of strings
  newMessage = '';

  // For image upload
  selectedFile: File | null = null;

  constructor(private socketService: SocketsService, private http: HttpClient) {}

  ngOnInit(): void {
    this.username = localStorage.getItem('username') || 'Guest';
    this.role = localStorage.getItem('role') || 'user';

    this.socketService.joinRoom(this.roomName, this.username, this.role);

    this.socketService.onMembersUpdated().subscribe((members: Member[]) => {
      this.members = members;
    });

    this.socketService.onUserJoined().subscribe((user: Member) => {
      this.members.push(user);
      this.messages.push({
        type: 'text',
        sender: 'System',
        role: 'system',
        content: `${user.username} joined the room`,
        createdAt: new Date().toISOString()
      });
    });

    this.socketService.onUserLeft().subscribe((user: Member) => {
      this.members = this.members.filter(m => m.socketId !== user.socketId);
      this.messages.push({
        type: 'text',
        sender: 'System',
        role: 'system',
        content: `${user.username} left the room`,
        createdAt: new Date().toISOString()
      });
    });

    this.socketService.onMessage().subscribe((msg: ChatMessage) => {
      this.messages.push(msg);
    });

    this.socketService.onPromotionResult().subscribe(res => {
      if (res.success) {
        this.messages.push({
          type: 'text',
          sender: 'System',
          role: 'system',
          content: res.message,
          createdAt: new Date().toISOString()
        });
      } else alert(res.message);
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    this.socketService.sendMessage(this.roomName, this.newMessage);
    this.newMessage = '';
  }

  kickMember(member: Member): void {
    this.socketService.kickMember(member.socketId);
  }

  promoteMember(member: Member): void {
    this.socketService.promoteToAdmin(member.socketId);
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
  }

  sendImage(): void {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('image', this.selectedFile);

    this.http.post<{ success: boolean; imageUrl: string }>('http://localhost:3000/api/upload', formData)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.socketService.sendImage(this.roomName, res.imageUrl); // send structured message
          }
          this.selectedFile = null;
        },
        error: (err) => {
          console.error('Image upload error:', err);
          alert('Failed to upload image.');
        }
      });
  }

  isImage(msg: ChatMessage): boolean {
    return msg.type === 'image';
  }
}
