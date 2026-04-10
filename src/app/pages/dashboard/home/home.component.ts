import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class DashboardHomeComponent {
  stats = signal([
    { label: 'Citas Hoy', value: '12', icon: '📅', trend: '+15%' },
    { label: 'Ingresos Mensuales', value: '$24,500', icon: '💰', trend: '+8%' },
    { label: 'Nuevos Clientes', value: '45', icon: '👤', trend: '+22%' },
    { label: 'Calificación Media', value: '4.9', icon: '⭐', trend: 'stable' },
  ]);
}
