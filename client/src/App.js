import { useEffect, useState } from 'react';
import AppLayout from './AppLayout';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading resources
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading Pomodoro App...</div>
      </div>
    );
  }

  // Render main application layout
  return <AppLayout />;
}