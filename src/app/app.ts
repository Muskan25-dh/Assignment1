import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SocketsService, ChatMessage } from './services/sockets';

@Component({
  selector: 'app-root',
  imports: [FormsModule, RouterModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  private socketService = inject(SocketsService);

  protected readonly title = signal('Assignment1');

  messageout = signal('');
  messages = signal<ChatMessage[]>([]); 

  ngOnInit() {
    this.socketService.onMessageHistory().subscribe((history: ChatMessage[]) => {
      this.messages.set(history);
    });

    // Listen for new messages
    this.socketService.onMessage().subscribe((msg: ChatMessage) => {
      this.messages.update((msgs) => [...msgs, msg]);
    });

    // Join room
    this.socketService.joinRoom('group1', 'Guest', 'user');
  }

  send() {
    if (!this.messageout()) return;
    this.socketService.sendMessage('group1', this.messageout());
    this.messageout.set('');
  }

  isImage(msg: ChatMessage): boolean {
    return msg.type === 'image';
  }
}
