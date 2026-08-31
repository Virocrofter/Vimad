import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('[ErrorBoundary]', error, errorInfo);
    // TODO: send to Sentry / LogRocket / your analytics here
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={cn(
          'flex min-h-[50vh] flex-col items-center justify-center p-6',
          this.props.className
        )}>
          <div className="w-full max-w-lg rounded-xl border border-danger/20 bg-surface p-8 text-center shadow-lg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
              <AlertTriangle className="h-8 w-8 text-danger" />
            </div>

            <h2 className="mt-4 text-xl font-bold text-text-primary">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {this.state.error?.message || 'An unexpected error occurred while loading this page.'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <div className="mt-4 rounded-lg border border-border bg-background p-4 text-left">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Stack Trace
                </p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs font-mono text-danger">
                  {this.state.error?.toString?.()}
                  {'\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-secondary/90"
              >
                <RotateCcw className="h-4 w-4" /> Try Again
              </button>

              {this.props.fallbackPath && (
                <Link
                  to={this.props.fallbackPath}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-elevated"
                >
                  <Home className="h-4 w-4" /> Dashboard
                </Link>
              )}

              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-elevated"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.defaultProps = {
  fallbackPath: '/app/dashboard',
};

export default ErrorBoundary;