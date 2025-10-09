import { Routes } from '@angular/router';
import { Login } from './login/login';
import { ChatComponent } from './chat/chat';
import { HomeComponent } from './home/home';
export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    title: 'Log in'
  },
  {
    path: 'chat',
    component: ChatComponent,
    title: 'Chats'
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
