# Task Management System - MERN Stack

A comprehensive task management system built with MongoDB, Express.js, React, and Node.js featuring role-based access control for Admin, Team Lead, and Employee roles.

## Features

### 🔐 Role-Based Access Control
- **Admin**: Full system control, user management, project management, asset management
- **Team Lead**: Team management, task assignment, project oversight
- **Employee**: Task management, time tracking, asset viewing

### 📋 Core Functionality

#### Admin Features
- **User Management**: Create, update, activate/deactivate employees
- **Project Management**: Create projects with milestones, assign teams
- **Asset Management**: Track company assets, assign to employees
- **Dashboard**: System overview with statistics

#### Team Lead Features
- **Team Management**: View and manage team members
- **Task Management**: Create and assign tasks to team members
- **Project Oversight**: Monitor project progress
- **Performance Tracking**: Team performance analytics

#### Employee Features
- **Task Management**: View assigned tasks, update status
- **Time Tracking**: Start/stop time tracking for tasks
- **Asset Management**: View assigned assets
- **Progress Tracking**: Personal productivity metrics

### 🛠️ Technical Stack

**Backend:**
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- Role-based middleware

**Frontend:**
- React with TypeScript
- Material-UI (MUI)
- React Router
- Axios for API calls

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/taskmanagement
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### 3. Database Setup

Make sure MongoDB is running on your system:

```bash
# For local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env file
```

### 4. Start the Application

**Option 1: Start both servers separately**

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

**Option 2: Use the provided scripts**

```bash
# Start backend only
npm run server

# Start frontend only
npm run client
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 📱 Usage Guide

### Initial Setup

1. **First Admin User**: You'll need to manually create the first admin user in the database or use MongoDB Compass/CLI.

```javascript
// Example: Create first admin user
db.users.insertOne({
  name: "Admin User",
  email: "admin@company.com",
  password: "$2a$10$...", // Hashed password
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

2. **Login**: Use the admin credentials to log in and create other users.

### User Roles & Permissions

#### Admin Role
- Create and manage employees
- Create and assign team leads
- Manage all projects
- Manage company assets
- View system-wide statistics

#### Team Lead Role
- View and manage team members
- Create tasks for team members
- Monitor project progress
- View team performance

#### Employee Role
- View assigned tasks
- Track time on tasks
- View assigned assets
- Update task status

## 🗂️ Project Structure

```
task-management-mern/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── ...
├── models/                 # MongoDB models
├── routes/                 # Express routes
├── middleware/             # Custom middleware
├── server.js              # Express server
└── package.json           # Backend dependencies
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Admin Routes
- `GET /api/admin/employees` - Get all employees
- `POST /api/admin/projects` - Create project
- `GET /api/admin/assets` - Get all assets
- `POST /api/admin/assets` - Create asset
- `PUT /api/admin/assets/:id/assign` - Assign asset to employee

### Team Lead Routes
- `GET /api/teamlead/team` - Get team members
- `GET /api/teamlead/tasks` - Get team tasks
- `POST /api/teamlead/tasks` - Create task
- `GET /api/teamlead/team/performance` - Team performance

### Employee Routes
- `GET /api/employee/tasks` - Get assigned tasks
- `POST /api/employee/tasks/:id/start` - Start task
- `POST /api/employee/tasks/:id/stop` - Stop task
- `GET /api/employee/assets` - Get assigned assets

## 🎨 UI Components

The application uses Material-UI (MUI) for a modern, responsive design:

- **Dashboard**: Role-specific dashboards with statistics
- **Data Tables**: Sortable, filterable data grids
- **Forms**: Comprehensive form validation
- **Navigation**: Role-based navigation menus
- **Charts**: Progress tracking and analytics

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- Protected routes and API endpoints

## 🚀 Deployment

### Backend Deployment (Heroku)
1. Create Heroku app
2. Set environment variables
3. Deploy with Git

### Frontend Deployment (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Deploy the build folder

### Database (MongoDB Atlas)
1. Create MongoDB Atlas account
2. Create cluster
3. Update MONGODB_URI in environment variables

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env

2. **CORS Issues**
   - Backend CORS is configured for localhost:3000
   - Update CORS settings for production

3. **Authentication Issues**
   - Check JWT_SECRET in .env
   - Verify token in browser storage

4. **Port Conflicts**
   - Backend: Change PORT in .env
   - Frontend: Change port in package.json scripts

## 📝 Development

### Adding New Features
1. Create backend routes in `/routes`
2. Add corresponding models in `/models`
3. Create React components in `/client/src/components`
4. Update navigation in Layout component

### Database Schema
- **Users**: User accounts with roles
- **Projects**: Project information and milestones
- **Tasks**: Task assignments and time tracking
- **Assets**: Company asset management

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Happy Coding! 🚀**
