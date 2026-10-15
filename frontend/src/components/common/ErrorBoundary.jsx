import { Component } from 'react';

import { ROUTES } from '../../constants/routes.js';

// Shows a fallback instead of a blank page when a component crashes while rendering.
// Logging happens in the root's onCaughtError handler (see utils/errorLogger.js).
// Changing `resetKey` (e.g. the current route) clears the error.
class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey === state.resetKey ? null : { error: null, resetKey: props.resetKey };
  }

  handleRetry = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="error-message" role="alert">
        <p>Something went wrong while showing this page.</p>
        <button type="button" className="button" onClick={this.handleRetry}>
          Try again
        </button>{' '}
        {/* Plain link with a full reload: the router itself may be what failed */}
        <a className="button" href={ROUTES.HOME}>
          Go to dashboard
        </a>
      </div>
    );
  }
}

export default ErrorBoundary;
