import React, { useState, useEffect } from 'react';
import LockScreen from './components/LockScreen';
import Dashboard from './components/Dashboard';
import SmartLedger from './components/SmartLedger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  // Auto-lock logic
  useEffect(() => {
    let timeoutId;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsLocked(true);
      }
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 2 minutes inactivity
      timeoutId = setTimeout(() => {
        setIsLocked(true);
      }, 120000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    
    resetTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <ErrorBoundary>
      {isLocked ? (
        <LockScreen onUnlock={() => setIsLocked(false)} />
      ) : (
        <>
          {currentView === 'dashboard' ? (
            <Dashboard onNavigate={setCurrentView} />
          ) : (
            <SmartLedger onNavigate={setCurrentView} />
          )}
        </>
      )}
    </ErrorBoundary>
  );
}

export default App;
