"use client";

import { Component, type ReactNode } from "react";

type ErrorBoundaryProps = {
  fallback: (error: Error, reset: () => void) => ReactNode;
  shouldCatch?: (error: Error) => boolean;
  onReset?: () => void;
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;

    if (error !== null) {
      if (this.props.shouldCatch?.(error) === false) {
        throw error;
      }
      return this.props.fallback(error, this.reset);
    }

    return this.props.children;
  }
}
