import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-darkBg text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-gray-900 border border-red-500/30 rounded-3xl p-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3 tracking-tight">Something went wrong</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              An unexpected error occurred. Your data is safe. Please refresh the page to continue.
            </p>
            {this.state.error && (
              <pre className="text-left text-[10px] bg-black/40 text-red-400 p-4 rounded-xl border border-red-500/20 mb-8 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-accentOrange hover:bg-orange-600 text-white font-black px-8 py-3 rounded-2xl flex items-center gap-2 mx-auto transition transform hover:-translate-y-0.5 shadow-lg shadow-accentOrange/20"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
