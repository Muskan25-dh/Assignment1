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

  this.httpService.login(this.email, this.pwd).subscribe(
    (res: any) => {
      if (res.success) {
        // Store the full user object
        localStorage.setItem('currentUser', JSON.stringify(res.user));

        // Store username and role separately for easy access
        localStorage.setItem('username', res.user.username);
        localStorage.setItem('role', res.user.role || 'user');

        // Navigate to chat page
        this.router.navigate(['/chat']);
      } else {
        this.errorMessage = 'Invalid email or password';
      }
    },
    () => {
      this.errorMessage = 'Error. Try again later.';
    }
  );
  }
}
