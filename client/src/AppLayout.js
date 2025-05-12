import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import PomodoroTimer from './PomodoroTimer';
import TodoList from './TodoList';
import PreferencesPanel from './PreferencesPanel';
import LoginModal from './LoginModal';

export default function AppLayout() {
  const [activeSection, setActiveSection] = useState('timer');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  
  // Check auth status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth-check', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setIsAuthenticated(true);
          setUser(userData);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setIsLoginModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Render appropriate component based on active section
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'timer':
        return <PomodoroTimer isAuthenticated={isAuthenticated} />;
      case 'todo':
        return <TodoList isAuthenticated={isAuthenticated} />;
      case 'preferences':
        return <PreferencesPanel isAuthenticated={isAuthenticated} />;
      default:
        return <PomodoroTimer isAuthenticated={isAuthenticated} />;
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading application...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {activeSection === 'timer' && 'Pomodoro Timer'}
            {activeSection === 'todo' && 'To-Do List'}
            {activeSection === 'preferences' && 'Preferences'}
          </h1>
          
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center">
                <span className="mr-4">Hi, {user?.username || 'User'}</span>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-1 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Login / Register
              </button>
            )}
          </div>
        </header>
        
        {/* Content area */}
        <main className="flex-1 overflow-auto bg-gray-100">
          {renderActiveSection()}
        </main>
      </div>
      
      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal 
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLogin}
        />
      )}
    </div>
  );
}