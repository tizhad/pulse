import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'subjects',
    loadComponent: () =>
      import('./features/subjects/subjects.component').then(m => m.SubjectsComponent),
  },
  {
    path: 'subjects/:id',
    loadComponent: () =>
      import('./features/subjects/subject-detail/subject-detail.component').then(m => m.SubjectDetailComponent),
  },
  {
    path: 'companies',
    loadComponent: () =>
      import('./features/companies/companies.component').then(m => m.CompaniesComponent),
  },
  {
    path: 'applications',
    loadComponent: () =>
      import('./features/applications/applications.component').then(m => m.ApplicationsComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(m => m.SettingsComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
