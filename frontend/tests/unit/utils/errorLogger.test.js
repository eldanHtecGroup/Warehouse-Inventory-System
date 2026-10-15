import { beforeEach, describe, expect, it, vi } from 'vitest';

import { installGlobalErrorHandlers, logError, rootErrorHandlers } from '../../../src/utils/errorLogger.js';

describe('errorLogger', () => {
  let consoleError;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('logs the message, context and original error', () => {
    const error = new Error('boom');
    logError(error, { source: 'test' });
    expect(consoleError).toHaveBeenCalledWith('[app error]', { message: 'boom', source: 'test' }, error);
  });

  it('logs values that are not errors', () => {
    logError('plain string');
    logError(undefined);
    expect(consoleError.mock.calls.map((call) => call[1].message)).toEqual(['plain string', 'undefined']);
  });

  it.each([
    ['onCaughtError', 'react'],
    ['onUncaughtError', 'react-uncaught'],
  ])('%s logs with the component stack', (handler, source) => {
    const error = new Error('render failed');
    rootErrorHandlers[handler](error, { componentStack: '\n    at Page' });
    expect(consoleError).toHaveBeenCalledWith(
      '[app error]',
      { message: 'render failed', source, componentStack: '\n    at Page' },
      error,
    );
  });

  describe('installGlobalErrorHandlers', () => {
    it('logs window errors and unhandled rejections until uninstalled', () => {
      const target = new EventTarget();
      const uninstall = installGlobalErrorHandlers(target);
      const error = new Error('handler failed');

      target.dispatchEvent(Object.assign(new Event('error'), { error }));
      target.dispatchEvent(Object.assign(new Event('error'), { error: null, message: 'Script error.' }));
      target.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'rejected' }));

      expect(consoleError.mock.calls.map((call) => call[1])).toEqual([
        { message: 'handler failed', source: 'window.error' },
        { message: 'Script error.', source: 'window.error' },
        { message: 'rejected', source: 'unhandledrejection' },
      ]);

      uninstall();
      target.dispatchEvent(Object.assign(new Event('error'), { error }));
      expect(consoleError).toHaveBeenCalledTimes(3);
    });

    it('listens on window by default', () => {
      const add = vi.spyOn(window, 'addEventListener');
      const uninstall = installGlobalErrorHandlers();
      expect(add.mock.calls.map((call) => call[0])).toEqual(['error', 'unhandledrejection']);
      uninstall();
    });
  });
});
