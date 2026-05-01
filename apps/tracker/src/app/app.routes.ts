import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'study-plan', pathMatch: 'full' },
  {
    path: 'study-plan',
    loadComponent: () =>
      import('./features/study-plan/study-plan.component').then(
        (m) => m.StudyPlanComponent,
      ),
  },
  {
    path: 'architecture',
    loadComponent: () =>
      import('./features/architecture/architecture.component').then(
        (m) => m.ArchitectureComponent,
      ),
  },
  // remaining tabs added as features are implemented
  { path: '**', redirectTo: 'study-plan' },
];
