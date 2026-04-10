import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  // Datos de Usuario
  email = signal('');
  password = signal('');
  fullName = signal('');
  
  // Datos del Negocio
  businessName = signal('');
  
  loading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  constructor(private supabase: SupabaseService, private router: Router) {}

  async handleRegister() {
    try {
      this.loading.set(true);
      this.errorMessage.set('');

      // 1. Registro en Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: this.email(),
        password: this.password(),
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // 2. Crear el Negocio (Tenant)
      const { data: businessData, error: businessError } = await this.supabase.client
        .from('negocios')
        .insert([{ nombre: this.businessName() }])
        .select()
        .single();

      if (businessError) throw businessError;

      // 3. Crear la Sucursal inicial por defecto
      const { data: branchData, error: branchError } = await this.supabase.client
        .from('sucursales')
        .insert([{ 
          negocio_id: businessData.id, 
          nombre: 'Sucursal Principal' 
        }])
        .select()
        .single();

      if (branchError) throw branchError;

      // 4. Crear Perfil de Usuario (Owner)
      const { error: profileError } = await this.supabase.client
        .from('usuarios_perfiles')
        .insert([{
          id: authData.user.id,
          negocio_id: businessData.id,
          sucursal_id: null, // El dueño es nivel negocio
          nombre_completo: this.fullName(),
          email: this.email(),
          rol: 'owner'
        }]);

      if (profileError) throw profileError;

      // Éxito: Redirigir al Dashboard
      this.router.navigate(['/dashboard']);
      
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error en el registro');
    } finally {
      this.loading.set(false);
    }
  }
}
