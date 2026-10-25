(function () {
  'use strict';

  // Disable context menu
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  }, false);

  // Block inspection and source keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    const isMac = navigator.platform && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (modifier && e.shiftKey) {
      const key = (e.key || '').toLowerCase();
      if (key === 'i' || key === 'j' || key === 'c' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67) {
        e.preventDefault();
        return false;
      }
    }

    // Ctrl+U (View Source) or Ctrl+S (Save Page)
    if (modifier && !e.shiftKey && !e.altKey) {
      const key = (e.key || '').toLowerCase();
      if (key === 'u' || key === 's' || e.keyCode === 85 || e.keyCode === 83) {
        e.preventDefault();
        return false;
      }
    }
  }, false);

  // Friendly console warning
  try {
    console.log(
      '%cWait!',
      'color:#ef4444;font-size:32px;font-weight:bold;-webkit-text-stroke:1px black;'
    );
    console.log(
      '%cThis browser feature is intended for developers.',
      'font-size:14px;color:#a1a1aa;'
    );
  } catch (_) {}
})();
