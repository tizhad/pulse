import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  { path: 'auth', redirectTo: '' },
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
      import('./features/subjects/subject-detail/subject-detail.component').then(
        m => m.SubjectDetailComponent,
      ),
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
    path: 'ask',
    loadComponent: () =>
      import('./features/ask-ai/ask-ai.component').then(m => m.AskAiComponent),
  },
  {
    path: 'resume',
    loadComponent: () =>
      import('./features/resume/resume.component').then(m => m.ResumeComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(m => m.SettingsComponent),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./features/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact.component').then(m => m.ContactComponent),
  },
  { path: '**', redirectTo: '' },
];
