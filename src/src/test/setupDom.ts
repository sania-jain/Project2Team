// Gives node:test a browser-like global scope for React component tests.
// Import this BEFORE @testing-library/react or any component.
import { JSDOM } from "jsdom";

const { window } = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

const globals: Record<string, unknown> = {
  window,
  document: window.document,
  navigator: window.navigator,
  HTMLElement: window.HTMLElement,
  HTMLDialogElement: window.HTMLDialogElement,
  HTMLIFrameElement: window.HTMLIFrameElement,
  Element: window.Element,
  Node: window.Node,
  // AddEventModal calls new FormData(form); Node's own FormData rejects a form.
  FormData: window.FormData,
  MutationObserver: window.MutationObserver,
  getComputedStyle: window.getComputedStyle.bind(window),
};
for (const [name, value] of Object.entries(globals)) {
  // defineProperty because Node exposes `navigator` as a getter-only global.
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

// Modal.tsx uses the native dialog API, which jsdom may not implement.
const dialog = window.HTMLDialogElement.prototype;
dialog.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
dialog.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute("open");
};
