import { useEffect, useCallback } from 'react';

const useKeyboardShortcuts = (shortcuts = {}) => {
  const handleKeyPress = useCallback((event) => {
    // Don't trigger shortcuts when typing in input fields
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.contentEditable === 'true'
    );

    // Skip if we're typing in an input field, unless it's a global shortcut
    if (isInputFocused && !event.ctrlKey && !event.metaKey && !event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();
    const ctrlKey = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd
    const shiftKey = event.shiftKey;
    const altKey = event.altKey;

    // Build shortcut key combination
    let shortcutKey = '';
    if (ctrlKey) shortcutKey += 'ctrl+';
    if (shiftKey) shortcutKey += 'shift+';
    if (altKey) shortcutKey += 'alt+';
    shortcutKey += key;

    // Also check for single key shortcuts
    const singleKey = key;

    // Find and execute matching shortcut
    const shortcut = shortcuts[shortcutKey] || shortcuts[singleKey];
    if (shortcut) {
      event.preventDefault();
      shortcut(event);
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return null;
};

export default useKeyboardShortcuts;