import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/dashboard/layout/layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/dashboard/home/home.component').then(m => m.DashboardHomeComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./pages/dashboard/appointments/appointments.component').then(m => m.AppointmentsComponent)
      },
      {
        path: 'barbers',
        loadComponent: () => import('./pages/dashboard/barbers/barbers.component').then(m => m.BarbersComponent)
      },
      {
        path: 'services',
        loadComponent: () => import('./pages/dashboard/services/services.component').then(m => m.ServicesComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/dashboard/settings/settings.component').then(m => m.SettingsComponent)
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' }
];
