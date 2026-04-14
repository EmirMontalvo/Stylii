import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';

interface Empleado {
  id?: number;
  negocio_id?: number;
  sucursal_id?: number;
  nombre: string;
  especialidad: string;
  activo: boolean;
  created_at?: string;
}

@Component({
  selector: 'app-barbers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './barbers.component.html',
  styleUrl: './barbers.component.scss'
})
export class BarbersComponent implements OnInit {
  empleados = signal<Empleado[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingId = signal<number | null>(null);

  negocioId: number | null = null;
  sucursalId: number | null = null;

  form: Empleado = { nombre: '', especialidad: '', activo: true };

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.loadContext();
    await this.loadEmpleados();
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

  async loadEmpleados() {
    if (!this.negocioId) { this.loading.set(false); return; }
    this.loading.set(true);
    const { data } = await this.supabase.client
      .from('empleados')
      .select('*')
      .eq('negocio_id', this.negocioId)
      .order('created_at', { ascending: false });
    if (data) this.empleados.set(data);
    this.loading.set(false);
  }

  openModal(emp?: Empleado) {
    if (emp) {
      this.editingId.set(emp.id!);
      this.form = { ...emp };
    } else {
      this.editingId.set(null);
      this.form = { nombre: '', especialidad: '', activo: true };
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
        .from('empleados')
        .update({
          nombre: this.form.nombre,
          especialidad: this.form.especialidad,
          activo: this.form.activo
        })
        .eq('id', this.editingId());
    } else {
      await this.supabase.client
        .from('empleados')
        .insert([{
          negocio_id: this.negocioId,
          sucursal_id: this.sucursalId,
          nombre: this.form.nombre,
          especialidad: this.form.especialidad,
          activo: true
        }]);
    }
    this.closeModal();
    await this.loadEmpleados();
  }

  async toggleActivo(emp: Empleado) {
    await this.supabase.client
      .from('empleados')
      .update({ activo: !emp.activo })
      .eq('id', emp.id);
    await this.loadEmpleados();
  }

  async delete(emp: Empleado) {
    if (!confirm(`¿Eliminar al barbero "${emp.nombre}"?`)) return;
    await this.supabase.client.from('empleados').delete().eq('id', emp.id);
    await this.loadEmpleados();
  }

  get activeCount(): number {
    return this.empleados().filter(e => e.activo).length;
  }
}
