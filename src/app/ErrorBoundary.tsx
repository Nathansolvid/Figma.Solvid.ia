import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ ErrorBoundary caught an error:', error);
    console.error('❌ Error info:', errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              ⚠️ Erreur de chargement
            </h1>
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-lg mb-2">Message d'erreur :</h2>
                <pre className="bg-red-100 p-4 rounded text-sm overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </div>
              {this.state.errorInfo && (
                <div>
                  <h2 className="font-semibold text-lg mb-2">Stack trace :</h2>
                  <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
