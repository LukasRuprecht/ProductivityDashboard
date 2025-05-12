import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function PreferencesPanel({ isAuthenticated }) {
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

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Load preferences on component mount
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch from backend if authenticated
      fetchPreferences();
    } else {
      // Load from localStorage if not authenticated
      const savedPrefs = localStorage.getItem('localPreferences');
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
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
        setPreferences({ ...preferences, ...data });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      showMessage('Failed to load preferences', 'error');
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences({
      ...preferences,
      [name]: type === 'checkbox' ? checked : Number(value)
    });
  };
  
  const savePreferences = async () => {
    setIsSaving(true);
    
    try {
      if (isAuthenticated) {
        // Save to backend
        const response = await fetch('/api/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(preferences),
        });
        
        if (response.ok) {
          showMessage('Preferences saved successfully');
        } else {
          showMessage('Failed to save preferences', 'error');
        }
      } else {
        // Save to localStorage
        localStorage.setItem('localPreferences', JSON.stringify(preferences));
        showMessage('Preferences saved locally');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showMessage('Error saving preferences', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Preferences</h1>
        
        <button
          onClick={savePreferences}
          disabled={isSaving}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
        >
          <Save size={18} className="mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      
      {message && (
        <div 
          className={`p-4 mb-6 rounded flex items-center ${
            message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
        >
          <AlertCircle size={20} className="mr-2" />
          {message.text}
        </div>
      )}
      
      {!isAuthenticated && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded">
          You're not logged in. Preferences will be saved locally to this device only.
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Timer Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Study Sessions (Pomodoros)
              <input
                type="number"
                name="studySessions"
                min="1"
                max="12"
                value={preferences.studySessions}
                onChange={handleInputChange}
                className="mt-1 w-full p-2 border rounded"
              />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Study Length (minutes)
              <input
                type="number"
                name="studyLength"
                min="1"
                max="60"
                value={preferences.studyLength}
                onChange={handleInputChange}
                className="mt-1 w-full p-2 border rounded"
              />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Break Length (minutes)
              <input
                type="number"
                name="breakLength"
                min="1"
                max="30"
                value={preferences.breakLength}
                onChange={handleInputChange}
                className="mt-1 w-full p-2 border rounded"
              />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Long Break Length (minutes)
              <input
                type="number"
                name="longBreakLength"
                min="5"
                max="60"
                value={preferences.longBreakLength}
                onChange={handleInputChange}
                className="mt-1 w-full p-2 border rounded"
                disabled={!preferences.enableLongBreaks}
              />
            </label>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="enableLongBreaks"
                checked={preferences.enableLongBreaks}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span>Enable long break after every 4 pomodoros</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="autoStartBreaks"
                checked={preferences.autoStartBreaks}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span>Auto-start breaks</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="autoStartPomodoros"
                checked={preferences.autoStartPomodoros}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span>Auto-start pomodoros</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Appearance & Notifications</h2>
        
        <div className="space-y-4">
          {/* <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="darkMode"
                checked={preferences.darkMode}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span>Dark Mode</span>
            </label>
          </div> */}
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="notifications"
                checked={preferences.notifications}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span>Enable Notifications</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="soundEnabled"
                checked={preferences.soundEnabled}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span>Enable Sounds</span>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Sound Volume
              <input
                type="range"
                name="soundVolume"
                min="0"
                max="100"
                value={preferences.soundVolume}
                onChange={handleInputChange}
                disabled={!preferences.soundEnabled}
                className="mt-1 w-full"
              />
              <div className="flex justify-between text-xs">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </label>
          </div>
        </div>
      </div>
      
      {isAuthenticated && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
          <p className="text-sm text-gray-600 mb-4">
            These settings are only available when logged in.
          </p>
          
          <div className="space-y-4">
            <div>
              <button
                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear all your data? This cannot be undone.")) {
                    // API call to clear user data would go here
                    showMessage("Feature not implemented in this demo", "error");
                  }
                }}
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}