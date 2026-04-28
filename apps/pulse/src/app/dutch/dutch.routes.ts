import { Route } from '@angular/router';

export const dutchRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./components/deck-list/deck-list.component').then(
        (m) => m.DeckListComponent
      ),
  },
  {
    path: 'import',
    loadComponent: () =>
      import('./components/import-deck/import-deck.component').then(
        (m) => m.ImportDeckComponent
      ),
  },
  {
    path: 'study/:deckId',
    loadComponent: () =>
      import('./components/study-session/study-session.component').then(
        (m) => m.StudySessionComponent
      ),
  },
];
