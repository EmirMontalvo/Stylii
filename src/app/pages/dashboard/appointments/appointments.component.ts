import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../services/supabase.service';

interface Cita {
  id?: number;
  negocio_id?: number;
  sucursal_id?: number;
  empleado_id?: number | null;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  estado: string;
  pagado?: boolean;
  monto_total: number;
  stripe_payment_id?: string;
  tipo_reserva: string;
  notas: string;
  created_at?: string;
  empleado?: any; // Supabase relation
}

interface Empleado {
  id: number;
  nombre: string;
}

interface Servicio {
  id: number;
  nombre: string;
  precio_base: number;
  duracion_minutos: number;
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.scss'
})
export class AppointmentsComponent implements OnInit {
  citas = signal<Cita[]>([]);
  empleados = signal<Empleado[]>([]);
  servicios = signal<Servicio[]>([]);
  loading = signal(true);
  showModal = signal(false);
  filterEstado = signal('todos');
  
  negocioId: number | null = null;
  sucursalId: number | null = null;

  // Formulario nueva cita
  form: Cita = {
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    fecha_hora_inicio: '',
    fecha_hora_fin: '',
    estado: 'pendiente',
    monto_total: 0,
    notas: '',
    tipo_reserva: 'manual',
    empleado_id: undefined
  };
  selectedServicios: number[] = [];

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.loadUserContext();
    await this.loadAll();
  }

  async loadUserContext() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (user) {
      const { data: profile } = await this.supabase.client
        .from('usuarios_perfiles')
        .select('negocio_id, sucursal_id')
        .eq('id', user.id)
        .single();
      if (profile) {
        this.negocioId = profile.negocio_id;
        // Si es owner (sucursal_id null), buscar la primera sucursal
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

  async loadAll() {
    this.loading.set(true);
    await Promise.all([this.loadCitas(), this.loadEmpleados(), this.loadServicios()]);
    this.loading.set(false);
  }

  async loadCitas() {
    if (!this.negocioId) return;
    const { data } = await this.supabase.client
      .from('citas')
      .select('*, empleado:empleados(nombre)')
      .eq('negocio_id', this.negocioId)
      .order('fecha_hora_inicio', { ascending: false });
    if (data) this.citas.set(data as any);
  }

  async loadEmpleados() {
    if (!this.negocioId) return;
    const { data } = await this.supabase.client
      .from('empleados')
      .select('id, nombre')
      .eq('negocio_id', this.negocioId)
      .eq('activo', true);
    if (data) this.empleados.set(data);
  }

  async loadServicios() {
    if (!this.negocioId) return;
    const { data } = await this.supabase.client
      .from('servicios')
      .select('id, nombre, precio_base, duracion_minutos')
      .eq('negocio_id', this.negocioId);
    if (data) this.servicios.set(data);
  }

  get filteredCitas(): Cita[] {
    if (this.filterEstado() === 'todos') return this.citas();
    return this.citas().filter(c => c.estado === this.filterEstado());
  }

  openModal() {
    this.resetForm();
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  resetForm() {
    this.form = {
      cliente_nombre: '',
      cliente_telefono: '',
      cliente_email: '',
      fecha_hora_inicio: '',
      fecha_hora_fin: '',
      estado: 'pendiente',
      monto_total: 0,
      notas: '',
      tipo_reserva: 'manual',
      empleado_id: undefined
    };
    this.selectedServicios = [];
  }

  toggleServicio(id: number) {
    const idx = this.selectedServicios.indexOf(id);
    if (idx > -1) {
      this.selectedServicios.splice(idx, 1);
    } else {
      this.selectedServicios.push(id);
    }
    this.calcTotal();
  }

  calcTotal() {
    const total = this.servicios()
      .filter(s => this.selectedServicios.includes(s.id))
      .reduce((sum, s) => sum + s.precio_base, 0);
    this.form.monto_total = total;
  }

  calcDuration(): number {
    return this.servicios()
      .filter(s => this.selectedServicios.includes(s.id))
      .reduce((sum, s) => sum + s.duracion_minutos, 0);
  }

  async saveCita() {
    if (!this.negocioId || !this.sucursalId) return;

    // Calcular fecha fin basada en duración
    const dur = this.calcDuration() || 30;
    const start = new Date(this.form.fecha_hora_inicio);
    const end = new Date(start.getTime() + dur * 60000);
    this.form.fecha_hora_fin = end.toISOString();

    const { data, error } = await this.supabase.client
      .from('citas')
      .insert([{
        negocio_id: this.negocioId,
        sucursal_id: this.sucursalId,
        empleado_id: this.form.empleado_id || null,
        cliente_nombre: this.form.cliente_nombre,
        cliente_telefono: this.form.cliente_telefono,
        cliente_email: this.form.cliente_email,
        fecha_hora_inicio: this.form.fecha_hora_inicio,
        fecha_hora_fin: this.form.fecha_hora_fin,
        estado: 'pendiente',
        monto_total: this.form.monto_total,
        notas: this.form.notas,
        tipo_reserva: 'manual'
      }])
      .select()
      .single();

    if (data && this.selectedServicios.length > 0) {
      const citaServicios = this.selectedServicios.map(sId => {
        const srv = this.servicios().find(s => s.id === sId);
        return { cita_id: data.id, servicio_id: sId, precio_cobrado: srv?.precio_base || 0 };
      });
      await this.supabase.client.from('cita_servicios').insert(citaServicios);
    }

    this.closeModal();
    await this.loadCitas();
  }

  async updateEstado(cita: Cita, nuevoEstado: string) {
    await this.supabase.client
      .from('citas')
      .update({ estado: nuevoEstado })
      .eq('id', cita.id);
    await this.loadCitas();
  }

  async deleteCita(cita: Cita) {
    if (!confirm('¿Eliminar esta cita?')) return;
    await this.supabase.client.from('citas').delete().eq('id', cita.id);
    await this.loadCitas();
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'badge-warning',
      confirmada: 'badge-info',
      completada: 'badge-success',
      cancelada: 'badge-danger'
    };
    return map[estado] || '';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
