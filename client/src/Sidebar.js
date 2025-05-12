import { useState } from 'react';
import { Timer, CheckSquare, Settings, User, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar({ activeSection, setActiveSection }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Sections for the sidebar
  const sections = [
    { id: 'timer', label: 'Timer', icon: <Timer size={20} /> },
    { id: 'todo', label: 'To-Do List', icon: <CheckSquare size={20} /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings size={20} /> },
  ];

  return (
    <div 
      className={`h-screen bg-gray-800 text-white transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Toggle button */}
      <button 
        className="absolute top-4 -right-3 bg-gray-800 rounded-full p-1 text-white"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo/App name */}
      <div className="p-4 flex items-center justify-center border-b border-gray-700">
        {!isCollapsed && <h1 className="text-xl font-bold">Pomodoro</h1>}
      </div>
      
      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center w-full px-4 py-3 transition-colors ${
                  activeSection === section.id 
                    ? 'bg-blue-700 text-white' 
                    : 'hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center">
                  {section.icon}
                </div>
                {!isCollapsed && <span className="ml-3">{section.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Login/Profile section at bottom */}
      <div className="p-4 border-t border-gray-700">
        <button className="flex items-center w-full px-2 py-2 text-gray-300 hover:bg-gray-700 rounded">
          <User size={20} />
          {!isCollapsed && <span className="ml-3">Account</span>}
        </button>
      </div>
    </div>
  );
}