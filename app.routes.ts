import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Chat } from './chat/chat';
import { HomeComponent } from './home/home';
export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    title: 'Log in'
  },
  {
    path: 'chat',
    component: Chat,
    title: 'Chats'
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
