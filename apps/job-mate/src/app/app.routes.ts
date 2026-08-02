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
    path: 'portfolio',
    loadComponent: () =>
      import('./features/portfolio/portfolio.component').then(m => m.PortfolioComponent),
  },
  { path: 'about', redirectTo: 'portfolio' },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact.component').then(m => m.ContactComponent),
  },
  {
    path: 'starter-kit',
    loadComponent: () =>
      import('./features/starter-kit/starter-kit.component').then(m => m.StarterKitComponent),
  },
  {
    path: 'landing-samples',
    loadComponent: () =>
      import('./features/landing-samples/landing-samples.component').then(m => m.LandingSamplesComponent),
  },
  {
    path: 'landing-samples/saas',
    loadComponent: () =>
      import('./features/landing-samples/saas/saas-landing.component').then(m => m.SaasLandingComponent),
  },
  {
    path: 'landing-samples/fintech',
    loadComponent: () =>
      import('./features/landing-samples/fintech/fintech-landing.component').then(m => m.FintechLandingComponent),
  },
  {
    path: 'landing-samples/dev-tool',
    loadComponent: () =>
      import('./features/landing-samples/dev-tool/dev-tool-landing.component').then(m => m.DevToolLandingComponent),
  },
  {
    path: 'thank-you',
    loadComponent: () =>
      import('./features/thank-you/thank-you.component').then(m => m.ThankYouComponent),
  },
  {
    path: 'download',
    loadComponent: () =>
      import('./features/download/download.component').then(m => m.DownloadComponent),
  },
  { path: '**', redirectTo: '' },
];
