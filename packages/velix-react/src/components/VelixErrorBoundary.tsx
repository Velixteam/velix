"use client";

import React from 'react';
import type { ErrorProps, NotFoundProps } from '@teamvelix/velix-core';
import { VelixDefaultErrorPage } from './VelixDefaultErrorPage.js';

type ErrorComponent = React.ComponentType<ErrorProps>;
type NotFoundComponent = React.ComponentType<NotFoundProps>;

interface Props {
  children?: React.ReactNode;
  errorComponent: ErrorComponent | null;
  notFoundComponent?: NotFoundComponent | null;
  routePath: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class VelixErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('VelixErrorBoundary caught an error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const error = this.state.error;
      const isNotFound = error.name === 'NotFoundError' || (error as any).status === 404;

      if (isNotFound && this.props.notFoundComponent) {
        const NotFoundComp = this.props.notFoundComponent;
        return <NotFoundComp />;
      }

      if (this.props.errorComponent) {
        const ErrorComp = this.props.errorComponent;
        return <ErrorComp error={error} reset={this.reset} />;
      }
      return <VelixDefaultErrorPage error={error} reset={this.reset} />;
    }

    return this.props.children;
  }
}
