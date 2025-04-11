import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeKey = 'music-player-theme';
  private readonly darkModeClass = 'dark';
  private readonly lightModeClass = 'light';
  private readonly platformId = inject(PLATFORM_ID);
  
  public isDarkMode = signal<boolean>(true); // Default to dark mode
  
  constructor() {
    // Only run browser code when in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.loadSavedTheme();
    }
  }
  
  toggleTheme(): void {
    this.isDarkMode.update(current => !current);
    this.applyTheme();
    this.saveTheme();
  }
  
  private loadSavedTheme(): void {
    const savedTheme = localStorage.getItem(this.themeKey);
    if (savedTheme) {
      this.isDarkMode.set(savedTheme === 'dark');
    } else {
      // Check system preference if no saved theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(prefersDark);
    }
    this.applyTheme();
  }
  
  private saveTheme(): void {
    localStorage.setItem(this.themeKey, this.isDarkMode() ? 'dark' : 'light');
  }
  
  private applyTheme(): void {
    if (this.isDarkMode()) {
      document.documentElement.classList.add(this.darkModeClass);
      document.documentElement.classList.remove(this.lightModeClass);
    } else {
      document.documentElement.classList.add(this.lightModeClass);
      document.documentElement.classList.remove(this.darkModeClass);
    }
  }
}