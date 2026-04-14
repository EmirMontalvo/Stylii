import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';

interface Stat {
  label: string;
  value: string;
  icon: string;
}

interface CitaProxima {
  id: number;
  cliente_nombre: string;
  fecha_hora_inicio: string;
  estado: string;
  empleado?: any;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class DashboardHomeComponent implements OnInit {
  stats = signal<Stat[]>([]);
  proximasCitas = signal<CitaProxima[]>([]);
  loading = signal(true);

  negocioId: number | null = null;

  constructor(private supabase: SupabaseService, private router: Router) {}

  async ngOnInit() {
    await this.loadContext();
    await this.loadDashboardData();
  }

  async loadContext() {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (user) {
      const { data: profile } = await this.supabase.client
        .from('usuarios_perfiles')
        .select('negocio_id')
        .eq('id', user.id)
        .single();
      if (profile) this.negocioId = profile.negocio_id;
    }
  }

  async loadDashboardData() {
    if (!this.negocioId) {
      this.stats.set([
        { label: 'Citas Hoy', value: '0', icon: '📅' },
        { label: 'Ingresos del Mes', value: '$0', icon: '💰' },
        { label: 'Barberos Activos', value: '0', icon: '💈' },
        { label: 'Servicios', value: '0', icon: '✂️' },
      ]);
      this.loading.set(false);
      return;
    }

    try {
      // Citas de hoy
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { data: citasHoy } = await this.supabase.client
        .from('citas')
        .select('id')
        .eq('negocio_id', this.negocioId)
        .gte('fecha_hora_inicio', startOfDay)
        .lt('fecha_hora_inicio', endOfDay);

      // Ingresos del mes
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const { data: citasMes } = await this.supabase.client
        .from('citas')
        .select('monto_total')
        .eq('negocio_id', this.negocioId)
        .eq('estado', 'completada')
        .gte('fecha_hora_inicio', startOfMonth);

      const ingresosMes = (citasMes || []).reduce((sum, c) => sum + (c.monto_total || 0), 0);

      // Barberos activos
      const { data: barberos } = await this.supabase.client
        .from('empleados')
        .select('id')
        .eq('negocio_id', this.negocioId)
        .eq('activo', true);

      // Total servicios
      const { data: servicios } = await this.supabase.client
        .from('servicios')
        .select('id')
        .eq('negocio_id', this.negocioId);

      this.stats.set([
        { label: 'Citas Hoy', value: String(citasHoy?.length || 0), icon: '📅' },
        { label: 'Ingresos del Mes', value: `$${ingresosMes.toLocaleString()}`, icon: '💰' },
        { label: 'Barberos Activos', value: String(barberos?.length || 0), icon: '💈' },
        { label: 'Servicios', value: String(servicios?.length || 0), icon: '✂️' },
      ]);

      // Próximas citas (futuras, ordenadas)
      const { data: proximas } = await this.supabase.client
        .from('citas')
        .select('id, cliente_nombre, fecha_hora_inicio, estado, empleado:empleados(nombre)')
        .eq('negocio_id', this.negocioId)
        .in('estado', ['pendiente', 'confirmada'])
        .gte('fecha_hora_inicio', new Date().toISOString())
        .order('fecha_hora_inicio', { ascending: true })
        .limit(5);

      if (proximas) this.proximasCitas.set(proximas as any);

    } catch {
      // Si falla, mostrar ceros
    }

    this.loading.set(false);
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-MX', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'badge-warning',
      confirmada: 'badge-info',
    };
    return map[estado] || '';
  }
}
