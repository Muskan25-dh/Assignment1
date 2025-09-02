import { Component, OnInit, signal,inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Sockets } from './services/sockets';
import { RouterModule } from '@angular/router'; // <-- import this



@Component({
  selector: 'app-root',
  imports: [FormsModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private socketService = inject(Sockets);
  protected readonly title = signal('Assignment1');
  messageout = signal("");
  messagein = signal<string[]>([]);

  ngOnInit(){
    this.socketService.onMessage().subscribe(
      (msg)=>{
        this.messagein.update((msgs)=>[...msgs,msg])
      }
    );

  }
  send(){
    // Replace 'roomName' with the actual room variable or value
    this.socketService.sendMessage('roomName', this.messageout());
    this.messageout.set('');

  }
}