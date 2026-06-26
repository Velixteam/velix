import type { ErrorComponent, NotFoundComponent } from '../types.js';

export function defineError(component: ErrorComponent): ErrorComponent {
  return component;
}

export function defineNotFound(component: NotFoundComponent): NotFoundComponent {
  return component;
}
