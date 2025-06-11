import '@testing-library/jest-dom';

// Mock global functions for tests
global.scrollTo = jest.fn();
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock Web APIs that are not available in jsdom
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Notification API
global.Notification = class Notification {
  constructor() {}
  static permission = 'granted';
  static requestPermission = jest.fn();
}; 
