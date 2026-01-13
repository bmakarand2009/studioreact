import { useMemo } from 'react';

export type SidebarPayload<T = unknown> = { name: string; open: boolean; data?: T };
type SidebarListener = (payload: SidebarPayload) => void;

class SidebarController {
  private listeners = new Map<string, Set<SidebarListener>>();
  private states = new Map<string, boolean>();
  private payloads = new Map<string, unknown>();

  open<T = unknown>(name: string, data?: T) {
    this.setState(name, true, data);
  }

  close(name: string) {
    this.setState(name, false);
  }

  toggle<T = unknown>(name: string, data?: T) {
    const next = !this.states.get(name);
    this.setState(name, next, data);
  }

  subscribe(name: string, fn: SidebarListener) {
    const set = this.listeners.get(name) ?? new Set<SidebarListener>();
    set.add(fn);
    this.listeners.set(name, set);
    fn({
      name,
      open: this.states.get(name) ?? false,
      data: this.payloads.get(name),
    });
    return () => {
      const existing = this.listeners.get(name);
      existing?.delete(fn);
      if (existing && existing.size === 0) {
        this.listeners.delete(name);
      }
    };
  }

  private setState<T = unknown>(name: string, open: boolean, data?: T) {
    const hasProvidedData = typeof data !== 'undefined';
    if (hasProvidedData) {
      this.payloads.set(name, data);
    }

    this.states.set(name, open);
    const payload: SidebarPayload = {
      name,
      open,
      data: hasProvidedData ? data : this.payloads.get(name),
    };
    this.listeners.get(name)?.forEach((fn) => fn(payload));
    this.broadcastLayout(payload);

    if (!open) {
      this.payloads.delete(name);
    }
  }

  private broadcastLayout(payload: SidebarPayload) {
    if (typeof window === 'undefined') {
      return;
    }
    window.dispatchEvent(
      new CustomEvent<SidebarPayload>('sidebar:layout-change', {
        detail: payload,
      }),
    );
  }
}

export const sidebarController = new SidebarController();

export const useSidebarController = () => {
  return useMemo(() => sidebarController, []);
};


