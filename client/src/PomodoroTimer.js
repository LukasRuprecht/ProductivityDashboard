import { useState, useEffect, useRef } from 'react';
import { Bell, Play, Pause, RotateCcw, Check, Volume2, VolumeX } from 'lucide-react';

export default function PomodoroTimer({ isAuthenticated }) {
  // User preferences (will be loaded from backend or localStorage)
  const [preferences, setPreferences] = useState({
    studySessions: 4,
    studyLength: 25, // in minutes
    breakLength: 5, // in minutes
    longBreakLength: 15, // in minutes
    enableLongBreaks: true,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    darkMode: false,
    notifications: true,
    soundEnabled: true,
    soundVolume: 75,
  });
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(preferences.studyLength * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);
  const [completedSessions, setCompletedSessions] = useState(0);
  const audioRef = useRef(null);
  
  // Load preferences on component mount
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch from backend if authenticated
      fetchPreferences();
    } else {
      // Load from localStorage if not authenticated
      const savedPrefs = localStorage.getItem('localPreferences');
      if (savedPrefs) {
        const localPrefs = JSON.parse(savedPrefs);
        setPreferences(localPrefs);
        setTimeLeft(localPrefs.studyLength * 60);
      }
    }
  }, [isAuthenticated]);
  
  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/preferences', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
        setTimeLeft(data.studyLength * 60);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };
  
  // Update document title to show remaining time
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const status = isBreak ? (isLongBreak ? 'Long Break' : 'Break') : 'Focus';
    document.title = `${timeString} - ${status} (${currentSession}/${preferences.studySessions})`;
    
    return () => {
      document.title = 'Pomodoro Timer';
    };
  }, [timeLeft, isBreak, isLongBreak, currentSession, preferences.studySessions]);
  
  // Timer logic
  useEffect(() => {
    let interval = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTimeLeft => prevTimeLeft - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Play sound when timer ends
      if (audioRef.current && preferences.soundEnabled) {
        try {
          // Ensure volume is a valid number between 0 and 1
          const safeVolume = Math.min(Math.max(preferences.soundVolume / 100, 0), 1);
          audioRef.current.volume = safeVolume;
          audioRef.current.play().catch(error => {
            console.error('Error playing sound:', error);
          });
        } catch (error) {
          console.error('Error setting audio volume:', error);
        }
      }
      
      // Show notification if enabled
      if (preferences.notifications) {
        try {
          // Request permission first
          if (Notification.permission === 'granted') {
            new Notification(isBreak ? 'Break finished!' : 'Time to take a break!', {
              body: isBreak ? 'Time to focus again.' : 'Good job! Take a short break.',
              icon: '/favicon.ico'
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
        } catch (error) {
          console.error('Notification error:', error);
        }
      }
      
      if (isBreak) {
        // If break is over, move to next study session or end
        if (currentSession < preferences.studySessions) {
          setCurrentSession(prevSession => prevSession + 1);
          setIsBreak(false);
          setIsLongBreak(false);
          setTimeLeft(preferences.studyLength * 60);
          
          // Auto-start pomodoro if enabled
          if (!preferences.autoStartPomodoros) {
            setIsRunning(false);
          }
        } else {
          // All sessions completed
          setIsRunning(false);
          setCompletedSessions(prevCompleted => prevCompleted + 1);
        }
      } else {
        // If study session is over, start break
        setIsBreak(true);
        
        // Check if it's time for a long break
        const shouldTakeLongBreak = preferences.enableLongBreaks && 
          currentSession % 4 === 0 && 
          currentSession < preferences.studySessions;
        
        setIsLongBreak(shouldTakeLongBreak);
        
        if (shouldTakeLongBreak) {
          setTimeLeft(preferences.longBreakLength * 60);
        } else {
          setTimeLeft(preferences.breakLength * 60);
        }
        
        setCompletedSessions(prevCompleted => prevCompleted + 1);
        
        // Auto-start break if enabled
        if (!preferences.autoStartBreaks) {
          setIsRunning(false);
        }
      }
    }
    
    return () => clearInterval(interval);
  }, [
    isRunning, 
    timeLeft, 
    isBreak, 
    isLongBreak,
    currentSession, 
    preferences.studyLength, 
    preferences.breakLength,
    preferences.longBreakLength,
    preferences.studySessions,
    preferences.enableLongBreaks,
    preferences.autoStartBreaks,
    preferences.autoStartPomodoros,
    preferences.soundEnabled,
    preferences.soundVolume,
    preferences.notifications
  ]);
  
  // Format time for display
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle start/pause toggle
  const toggleTimer = () => {
    setIsRunning(prevIsRunning => !prevIsRunning);
  };
  
  // Handle reset
  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setIsLongBreak(false);
    setCurrentSession(1);
    setTimeLeft(preferences.studyLength * 60);
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    const totalTime = isBreak 
      ? (isLongBreak ? preferences.longBreakLength * 60 : preferences.breakLength * 60)
      : preferences.studyLength * 60;
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    return Math.min(100, Math.max(0, progress));
  };
  
  // Toggle sound
  const toggleSound = () => {
    const newPreferences = { 
      ...preferences, 
      soundEnabled: !preferences.soundEnabled 
    };
    
    if (isAuthenticated) {
      // Update on backend
      fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newPreferences),
      }).catch(error => console.error('Error updating preferences:', error));
    } else {
      // Update in localStorage
      localStorage.setItem('localPreferences', JSON.stringify(newPreferences));
    }
    
    setPreferences(newPreferences);
  };
  
  return (
    <div className={`h-full flex flex-col items-center justify-center ${
      preferences.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      {/* Hidden audio element for alarm */}
      <audio ref={audioRef} src="/alarm.mp3" />
      
      <div className={`w-full max-w-md p-8 rounded-lg shadow-lg ${
        preferences.darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {isBreak 
              ? (isLongBreak ? 'Long Break' : 'Break Time') 
              : 'Focus Time'}
          </h1>
          <p className="text-lg">
            Session {currentSession} of {preferences.studySessions}
          </p>
        </div>
        
        {/* Timer display */}
        <div className="text-center mb-8 relative">
          <div className="text-7xl font-mono font-bold mb-4">
            {formatTime(timeLeft)}
          </div>
          
          {/* Progress bar */}
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                isBreak ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
        
        {/* Control buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={toggleTimer}
            className={`flex items-center justify-center w-16 h-16 rounded-full font-medium ${
              isRunning
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-green-500 hover:bg-green-600'
            } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <button
            onClick={resetTimer}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-300 text-gray-800 font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <RotateCcw size={24} />
          </button>
          
          <button
            onClick={toggleSound}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-300 text-gray-800 font-medium hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {preferences.soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
        </div>
        
        {/* Session info */}
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm">Completed today</span>
            <span className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded">
              <Check size={16} className="mr-1" />
              {completedSessions}
            </span>
          </div>
        </div>
      </div>
      
      {!isAuthenticated && (
        <div className="mt-6 text-sm text-gray-600 max-w-md text-center">
          Your timer settings are saved locally. 
          <button 
            className="text-blue-600 hover:underline ml-1"
            onClick={() => {
              // This would be handled by the parent component in a real implementation
              alert("This would open the login modal in a real implementation");
            }}
          >
            Log in
          </button> to sync across devices.
        </div>
      )}
    </div>
  );
}