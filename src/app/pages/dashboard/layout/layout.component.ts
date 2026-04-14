import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { LucideIconComponent, LayoutDashboard, Calendar, Users, Scissors, Settings, LogOut, Menu } from '../../../shared/lucide-icon.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideIconComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class DashboardLayoutComponent implements OnInit {
  isSidebarOpen = signal(true);
  businessName = signal('Cargando...');
  
  menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', route: '/dashboard/home' },
    { icon: Calendar, label: 'Citas', route: '/dashboard/appointments' },
    { icon: Users, label: 'Barberos', route: '/dashboard/barbers' },
    { icon: Scissors, label: 'Servicios', route: '/dashboard/services' },
    { icon: Settings, label: 'Configuración', route: '/dashboard/settings' },
  ];

  // Iconos principales para uso en la plantilla HTML sueltos
  readonly LogOut = LogOut;
  readonly Menu = Menu;

  constructor(private supabase: SupabaseService, private router: Router) {}

  async ngOnInit() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        const { data: profile } = await this.supabase.client
          .from('usuarios_perfiles')
          .select('negocio_id')
          .eq('id', user.id)
          .single();
          
        if (profile?.negocio_id) {
          const { data: negocio } = await this.supabase.client
            .from('negocios')
            .select('nombre')
            .eq('id', profile.negocio_id)
            .single();
            
          if (negocio) {
            this.businessName.set(negocio.nombre);
          }
        }
      }
    } catch(err) {
      this.businessName.set('Tu Negocio STYLII');
    }
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  async logout() {
    await this.supabase.auth.signOut();
    this.router.navigate(['/auth/login']);
  }
}
