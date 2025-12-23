import { Injectable } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'chat.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private mode: ThemeMode = 'dark';

  init(): void {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null);
    this.set(saved ?? 'dark');
  }

  get current(): ThemeMode {
    return this.mode;
  }

  toggle(): void {
    this.set(this.mode === 'dark' ? 'light' : 'dark');
  }

  set(mode: ThemeMode): void {
    this.mode = mode;

    // We use html element to avoid specificity problems
    const root = document.documentElement; // <html>
    if (mode === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');

    localStorage.setItem(STORAGE_KEY, mode);
  }
}