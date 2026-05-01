import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '../ui/button';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Component Error Caught by Boundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 max-w-md mb-8">
            This section failed to load properly. This is usually due to a temporary data glitch or an incompatible browser update.
          </p>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => this.setState({ hasError: false })}
              className="rounded-full px-6"
            >
              Try Again
            </Button>
            <Button 
              onClick={this.handleReset}
              className="rounded-full px-6 flex gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Full Page Reload
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-red-50 rounded-xl text-left overflow-auto max-w-full">
              <pre className="text-[10px] text-red-800 font-mono">
                {this.state.error?.toString()}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
