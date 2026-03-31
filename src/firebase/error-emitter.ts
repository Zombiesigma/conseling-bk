'use client';

type ErrorCallback = (error: any) => void;

class ErrorEmitter {
  private listeners: { [event: string]: ErrorCallback[] } = {};

  on(event: string, callback: ErrorCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    };
  }

  emit(event: string, error: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(error));
    }
  }
}

export const errorEmitter = new ErrorEmitter();
