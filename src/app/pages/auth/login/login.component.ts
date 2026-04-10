import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  loading = signal(false);
  errorMessage = signal('');

  constructor(private supabase: SupabaseService, private router: Router) {}

  async handleLogin() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: this.email(),
        password: this.password()
      });

      if (error) throw error;
      
      // Redirigir al dashboard tras login exitoso
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al iniciar sesión');
    } finally {
      this.loading.set(false);
    }
  }
}
