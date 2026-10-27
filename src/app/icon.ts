import { Component, Input } from '@angular/core';
const paths: Record<string, string> = {
  shield: 'M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7l-9-4ZM12 7v11M7 10h10',
  home: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  user: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2ZM16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  settings:
    'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  plus: 'M12 5v14M5 12h14',
  check: 'm7 12 3 3 7-7M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  warning: 'm12 3 10 18H2L12 3ZM12 9v4m0 4h.01',
  gauge: 'M3 18a10 10 0 1 1 18 0M12 14l5-7M8 19h8M13 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  edit: 'm15 4 5 5M3 21l5-1L21 7a2 2 0 0 0-5-5L3 15v6Z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  close: 'm6 6 12 12M6 18 18 6',
  chevron: 'm9 5 7 7-7 7',
  down: 'm6 9 6 6 6-6',
  logout: 'M9 21H3V3h6m6 5 5 4-5 4M8 12h12',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  menu: 'M4 6h16M4 12h16M4 18h16',
  reset: 'M3 10a9 9 0 1 1 1 9M3 4v6h6',
  info: 'M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  arrow: 'm7 14 5-5 5 5M12 9v10M5 5h14',
};
@Component({
  selector: 'app-icon',
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path [attr.d]="path" />
  </svg>`,
  host: { 'aria-hidden': 'true' },
})
export class Icon {
  @Input() name = 'info';
  get path() {
    return paths[this.name] ?? paths['info'];
  }
}
