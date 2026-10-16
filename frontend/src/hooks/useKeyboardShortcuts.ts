import { useEffect } from 'react';
import type { ViewMode } from '../components/layout/index.ts';

export interface ShortcutHandlers {
  onOpenCommandBar: () => void;
  onNewTask: () => void;
  onFocusSearch: () => void;
  onSwitchView: (view: ViewMode) => void;
  onCloseActiveModal: () => void;
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // 1. Global Cmd+K / Ctrl+K (works anywhere)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handlers.onOpenCommandBar();
        return;
      }

      // 2. Global Escape key to dismiss active overlays
      if (e.key === 'Escape') {
        handlers.onCloseActiveModal();
        return;
      }

      // If user is actively typing in an input/textarea, bypass single-character shortcuts
      if (isEditableElement(e.target)) {
        return;
      }

      // 3. Single-character shortcuts when not typing
      if (e.key === 'n' || e.key === 'c') {
        e.preventDefault();
        handlers.onNewTask();
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        handlers.onFocusSearch();
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        handlers.onSwitchView('list');
        return;
      }

      if (e.key === '2') {
        e.preventDefault();
        handlers.onSwitchView('matrix');
        return;
      }

      if (e.key === '3') {
        e.preventDefault();
        handlers.onSwitchView('kanban');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers]);
}
