import { computed, effect, Injectable, signal, WritableSignal } from '@angular/core';
import { Subject } from 'rxjs';

export interface LayoutConfig {
  preset: string;
  primary: string;
  surface: string;
  darkTheme: boolean;
}
interface LayoutState {
  staticMenuDesktopInactive?: boolean;
  overlayMenuActive?: boolean;
  configSidebarVisible?: boolean;
  staticMenuMobileActive?: boolean;
  menuHoverActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LayoutSetting {
  private _config: LayoutConfig = {
    preset: 'aura',
    primary: 'blue',
    surface: 'light',
    darkTheme: window.matchMedia('(prefers-color-scheme: dark)').matches,
  };

  private _state: LayoutState = {
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
  };

  layoutConfig = signal<LayoutConfig>(this._config);
  layoutState = signal<LayoutState>(this._state);

  theme = computed(() => (this.layoutConfig().darkTheme ? 'dark' : 'light'));
  isDarkTheme = computed(() => this.layoutConfig().darkTheme);
  getPrimary = computed(() => this.layoutConfig().primary);
  getSurface = computed(() => this.layoutConfig().surface);

  transitionComplete = signal<boolean>(false);

  private initialized = false;

  constructor() {
    effect(() => {
      const config = this.layoutConfig();
      if (!this.initialized) {
        this.initialized = true;
        return;
      }
      this.handleDarkModeTransition(config);
    });
  }

  private handleDarkModeTransition(config: LayoutConfig): void {
    if ('startViewTransition' in document) {
      this.startViewTransition(config);
    } else {
      this.tooggleDarkTheme(config);
      this.onTransitionEnd();
    }
  }

  private startViewTransition(config: LayoutConfig): void {
    const transition = document.startViewTransition(() => {
      this.tooggleDarkTheme(config);
    });
    transition.ready.then(() => this.onTransitionEnd());
  }

  tooggleDarkTheme(config?: LayoutConfig): void {
    const _config = config || this.layoutConfig();
    if (_config.darkTheme) {
      document.documentElement.classList.add('app-dark');
    } else {
      document.documentElement.classList.remove('app-dark');
    }
  }

  private onTransitionEnd() {
    this.transitionComplete.set(true);
    setTimeout(() => {
      this.transitionComplete.set(false);
    });
  }

  onMenuToggle() {
    if (this.isDesktop()) {
      this.layoutState.update((prev) => ({
        ...prev,
        staticMenuDesktopInactive: !prev.staticMenuDesktopInactive,
      }));
    } else {
      this.layoutState.update((prev) => ({
        ...prev,
        staticMenuMobileActive: !prev.staticMenuMobileActive,
      }));
    }
  }

  isDesktop() {
    return window.innerWidth > 991;
  }

  isMobile() {
    return !this.isDesktop();
  }

  updateConfig(newConfig: Partial<LayoutConfig>) {
    this.layoutConfig.update((prev) => ({ ...prev, ...newConfig }));
  }

  updateState(newState: Partial<LayoutState>) {
    this.layoutState.update((prev) => ({ ...prev, ...newState }));
  }

  reset() {
    this.layoutConfig.set(this._config);
    this.layoutState.set(this._state);
  }
}
