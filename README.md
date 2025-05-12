# ProductivityDashboard
A feature-rich Pomodoro Timer application built with React that helps users manage their time effectively using the Pomodoro Technique. The app includes a sidebar navigation system, to-do list integration, and user preferences - all accessible with or without creating an account.

<img width="1440" alt="image" src="https://github.com/user-attachments/assets/91213112-c460-4d65-bf9d-518240683c9f" />


## Features

### Core Features
- **Pomodoro Timer**: Customizable work/study sessions and breaks
- **To-Do List**: Manage tasks efficiently alongside your timer
- **Collapsible Sidebar**: Toggle between expanded and compact views
- **Optional User Accounts**: Use locally or create an account to sync across devices
- **Dark Mode**: Toggle between light and dark themes

### Timer Features
- Customizable session lengths (work/study period, short breaks, long breaks)
- Automatic transitions between work and break periods
- Audio notifications when timers end
- Session counter to track completed pomodoros
- Visual progress indicators

### To-Do List Features
- Add, complete, and delete tasks
- Persists data locally (for non-logged in users)
- Syncs across devices (for logged-in users)

### User Preference Options
- Customize timer durations
- Enable/disable long breaks
- Auto-start breaks and pomodoros
- Control notifications and sounds
- Toggle dark mode

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/modern-pomodoro-app.git
   cd modern-pomodoro-app
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the project root with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

4. Start the development server:
   ```
   npm start
   # or
   yarn start
   ```

5. The app should now be running at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
modern-pomodoro-app/
├── public/
│   ├── index.html
│   ├── alarm.mp3
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── App.js
│   │   ├── AppLayout.js
│   │   ├── LoginModal.js
│   │   ├── PomodoroTimer.js
│   │   ├── PreferencesPanel.js
│   │   ├── Sidebar.js
│   │   └── TodoList.js
│   ├── index.js
│   └── index.css
├── .env
├── package.json
└── README.md
```

## Backend API Endpoints

The application expects the following API endpoints to be available:

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout
- `GET /api/auth-check` - Check authentication status

### User Data
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update user preferences
- `GET /api/todos` - Get user todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

## Local Storage

For non-authenticated users, the application stores data in the following localStorage keys:
- `localPreferences` - User preferences
- `localTodos` - To-do list items

## Technologies Used

- **React** - UI framework
- **Tailwind CSS** - Styling and UI components
- **Lucide React** - Icons
- **Local Storage API** - Local data persistence

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Pomodoro Technique was developed by Francesco Cirillo
- Icon library provided by [Lucide Icons](https://lucide.dev/)
