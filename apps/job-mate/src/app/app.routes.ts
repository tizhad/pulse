import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/auth.component').then(m => m.AuthComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'subjects',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/subjects/subjects.component').then(m => m.SubjectsComponent),
  },
  {
    path: 'subjects/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/subjects/subject-detail/subject-detail.component').then(
        m => m.SubjectDetailComponent,
      ),
  },
  {
    path: 'companies',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/companies/companies.component').then(m => m.CompaniesComponent),
  },
  {
    path: 'applications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/applications/applications.component').then(m => m.ApplicationsComponent),
  },
  {
    path: 'ask',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ask-ai/ask-ai.component').then(m => m.AskAiComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then(m => m.SettingsComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
