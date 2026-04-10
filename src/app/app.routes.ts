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
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' }
];
