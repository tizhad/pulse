import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'dutch',
    loadChildren: () =>
      import('./dutch/dutch.routes').then((m) => m.dutchRoutes),
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
