import { Route } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const homeRoutes: Route[] = [
  { path: '', component: DashboardComponent },
];
