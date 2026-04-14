import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';

interface Servicio {
  id?: number;
  negocio_id?: number;
  sucursal_id?: number;
  nombre: string;
  precio_base: number;
  duracion_minutos: number;
  imagen_url?: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent implements OnInit {
  servicios = signal<Servicio[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingId = signal<number | null>(null);

  negocioId: number | null = null;
  sucursalId: number | null = null;

  form: Servicio = { nombre: '', precio_base: 0, duracion_minutos: 30 };

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.loadContext();
    await this.loadServicios();
  }

  async loadContext() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (user) {
      const { data: profile } = await this.supabase.client
        .from('usuarios_perfiles')
        .select('negocio_id, sucursal_id')
        .eq('id', user.id)
        .single();
      if (profile) {
        this.negocioId = profile.negocio_id;
        if (profile.sucursal_id) {
          this.sucursalId = profile.sucursal_id;
        } else {
          const { data: suc } = await this.supabase.client
            .from('sucursales')
            .select('id')
            .eq('negocio_id', profile.negocio_id)
            .limit(1)
            .single();
          if (suc) this.sucursalId = suc.id;
        }
      }
    }
  }

  async loadServicios() {
    if (!this.negocioId) { this.loading.set(false); return; }
    this.loading.set(true);
    const { data } = await this.supabase.client
      .from('servicios')
      .select('*')
      .eq('negocio_id', this.negocioId)
      .order('created_at', { ascending: false });
    if (data) this.servicios.set(data);
    this.loading.set(false);
  }

  openModal(srv?: Servicio) {
    if (srv) {
      this.editingId.set(srv.id!);
      this.form = { ...srv };
    } else {
      this.editingId.set(null);
      this.form = { nombre: '', precio_base: 0, duracion_minutos: 30 };
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  async save() {
    if (!this.negocioId || !this.sucursalId) return;

    if (this.editingId()) {
      await this.supabase.client
        .from('servicios')
        .update({
          nombre: this.form.nombre,
          precio_base: this.form.precio_base,
          duracion_minutos: this.form.duracion_minutos
        })
        .eq('id', this.editingId());
    } else {
      await this.supabase.client
        .from('servicios')
        .insert([{
          negocio_id: this.negocioId,
          sucursal_id: this.sucursalId,
          nombre: this.form.nombre,
          precio_base: this.form.precio_base,
          duracion_minutos: this.form.duracion_minutos
        }]);
    }
    this.closeModal();
    await this.loadServicios();
  }

  async delete(srv: Servicio) {
    if (!confirm(`¿Eliminar el servicio "${srv.nombre}"?`)) return;
    await this.supabase.client.from('servicios').delete().eq('id', srv.id);
    await this.loadServicios();
  }

  formatDuration(min: number): string {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
}
