import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';

interface Negocio {
  id: number;
  nombre: string;
}

interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
}

interface UserProfile {
  id: string;
  nombre_completo: string;
  email: string;
  rol: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');

  negocio: Negocio = { id: 0, nombre: '' };
  sucursal: Sucursal = { id: 0, nombre: '', direccion: '', telefono: '' };
  profile: UserProfile = { id: '', nombre_completo: '', email: '', rol: '' };

  negocioId: number | null = null;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.loadAll();
  }

  async loadAll() {
    this.loading.set(true);
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      // Cargar perfil
      const { data: prof } = await this.supabase.client
        .from('usuarios_perfiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) {
        this.profile = {
          id: prof.id,
          nombre_completo: prof.nombre_completo || '',
          email: prof.email || '',
          rol: prof.rol || ''
        };
        this.negocioId = prof.negocio_id;

        // Cargar negocio
        if (prof.negocio_id) {
          const { data: neg } = await this.supabase.client
            .from('negocios')
            .select('*')
            .eq('id', prof.negocio_id)
            .single();
          if (neg) this.negocio = { id: neg.id, nombre: neg.nombre };
        }

        // Cargar sucursal
        const sucursalId = prof.sucursal_id;
        if (sucursalId) {
          const { data: suc } = await this.supabase.client
            .from('sucursales')
            .select('*')
            .eq('id', sucursalId)
            .single();
          if (suc) this.sucursal = { id: suc.id, nombre: suc.nombre, direccion: suc.direccion || '', telefono: suc.telefono || '' };
        } else if (prof.negocio_id) {
          // Owner: cargar primera sucursal
          const { data: suc } = await this.supabase.client
            .from('sucursales')
            .select('*')
            .eq('negocio_id', prof.negocio_id)
            .limit(1)
            .single();
          if (suc) this.sucursal = { id: suc.id, nombre: suc.nombre, direccion: suc.direccion || '', telefono: suc.telefono || '' };
        }
      }
    } finally {
      this.loading.set(false);
    }
  }

  async saveNegocio() {
    this.saving.set(true);
    const { error } = await this.supabase.client
      .from('negocios')
      .update({ nombre: this.negocio.nombre })
      .eq('id', this.negocio.id);
    this.showMessage(error ? 'Error al guardar negocio' : '¡Negocio actualizado!', error ? 'error' : 'success');
    this.saving.set(false);
  }

  async saveSucursal() {
    this.saving.set(true);
    const { error } = await this.supabase.client
      .from('sucursales')
      .update({
        nombre: this.sucursal.nombre,
        direccion: this.sucursal.direccion,
        telefono: this.sucursal.telefono
      })
      .eq('id', this.sucursal.id);
    this.showMessage(error ? 'Error al guardar sucursal' : '¡Sucursal actualizada!', error ? 'error' : 'success');
    this.saving.set(false);
  }

  async saveProfile() {
    this.saving.set(true);
    const { error } = await this.supabase.client
      .from('usuarios_perfiles')
      .update({
        nombre_completo: this.profile.nombre_completo,
        email: this.profile.email
      })
      .eq('id', this.profile.id);
    this.showMessage(error ? 'Error al guardar perfil' : '¡Perfil actualizado!', error ? 'error' : 'success');
    this.saving.set(false);
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message.set(msg);
    this.messageType.set(type);
    setTimeout(() => this.message.set(''), 3000);
  }

  getRolLabel(rol: string): string {
    const map: Record<string, string> = {
      owner: 'Dueño / Propietario',
      branch: 'Encargado de Sucursal',
      admin: 'Administrador'
    };
    return map[rol] || rol;
  }
}
