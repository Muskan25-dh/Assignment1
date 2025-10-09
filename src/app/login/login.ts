import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpService } from '../services/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  private httpService = inject(HttpService);
  private router = inject(Router);

  email: string = '';
  pwd: string = '';
  errorMessage: string = '';

  login(event: Event) {
    event.preventDefault();

    this.httpService.login(this.email, this.pwd).subscribe({
      next: (res: any) => {
        console.log('Login response:', res);

        if (res.success && res.user) {
          localStorage.setItem('currentUser', JSON.stringify(res.user));
          localStorage.setItem('username', res.user.username || res.user.name || '');
          localStorage.setItem('role', res.user.role || 'user');

          this.router.navigate(['/chat']);
        } else {
          this.errorMessage = res.message || 'Invalid credentials';
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.errorMessage = 'Wrong Credentials. Try again later.';
      }
    });
  }
}
