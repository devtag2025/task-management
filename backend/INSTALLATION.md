# Installation Guide - Task Management System

## 🚀 Quick Start (Windows)

### Option 1: Automated Setup
1. **Download the project** to your computer
2. **Double-click `start.bat`** - This will automatically:
   - Install all dependencies
   - Set up the database
   - Start both backend and frontend servers

### Option 2: Manual Setup
Follow the step-by-step instructions below.

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (local or MongoDB Atlas) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** (optional) - [Download here](https://git-scm.com/)

## 🔧 Step-by-Step Installation

### Step 1: Install Dependencies

Open Command Prompt or PowerShell in the project folder and run:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Database Setup

#### Option A: Local MongoDB
1. **Install MongoDB** on your system
2. **Start MongoDB service**:
   ```bash
   # Windows
   net start MongoDB
   
   # Or start manually
   mongod
   ```

#### Option B: MongoDB Atlas (Cloud)
1. **Create account** at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create a cluster** (free tier available)
3. **Get connection string** and update `.env` file

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/taskmanagement
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

**For MongoDB Atlas**, use your connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanagement
```

### Step 4: Initialize Database

```bash
# Create initial admin user
npm run setup
```

This creates an admin user with:
- **Email**: admin@company.com
- **Password**: admin123

### Step 5: Start the Application

#### Option A: Start Both Servers
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
npm run client
```

#### Option B: Use Start Scripts
```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

### Step 6: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🎯 First Login

1. **Open** http://localhost:3000
2. **Login** with:
   - Email: `admin@company.com`
   - Password: `admin123`
3. **Change password** in profile settings
4. **Create users** through the admin panel

## 🛠️ Development Setup

### Backend Development
```bash
# Install nodemon for auto-restart
npm install -g nodemon

# Start development server
npm run dev
```

### Frontend Development
```bash
cd client
npm start
```

### Database Management
```bash
# Connect to MongoDB
mongo

# Or use MongoDB Compass (GUI)
# Download from: https://www.mongodb.com/products/compass
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 5000
npx kill-port 5000
```

#### 2. MongoDB Connection Error
```bash
# Check if MongoDB is running
netstat -an | findstr 27017

# Start MongoDB service
net start MongoDB
```

#### 3. Node Modules Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
rm -rf client/node_modules
npm install
cd client && npm install
```

#### 4. Permission Issues (Linux/Mac)
```bash
# Fix permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Environment Variables

Make sure your `.env` file contains:
```env
MONGODB_URI=mongodb://localhost:27017/taskmanagement
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

### Database Connection Test

Test your database connection:
```bash
# Run setup script to test connection
node setup.js
```

## 📱 Application Features

### Admin Features
- ✅ User management (create, edit, activate/deactivate)
- ✅ Project management with milestones
- ✅ Asset management and assignment
- ✅ System dashboard with statistics

### Team Lead Features
- ✅ Team member management
- ✅ Task creation and assignment
- ✅ Project oversight
- ✅ Team performance tracking

### Employee Features
- ✅ Task management and time tracking
- ✅ Asset viewing
- ✅ Progress tracking
- ✅ Profile management

## 🚀 Production Deployment

### Backend (Heroku)
1. Create Heroku app
2. Set environment variables
3. Deploy with Git

### Frontend (Netlify/Vercel)
1. Build: `npm run build`
2. Deploy build folder

### Database (MongoDB Atlas)
1. Create cluster
2. Update MONGODB_URI
3. Configure network access

## 📞 Support

If you encounter issues:

1. **Check the logs** in terminal
2. **Verify MongoDB** is running
3. **Check environment variables**
4. **Restart the servers**
5. **Clear browser cache**

## 🎉 Success!

Once everything is running:

1. **Login** with admin credentials
2. **Create your first project**
3. **Add team members**
4. **Assign tasks**
5. **Start tracking time!**

---

**Happy Coding! 🚀**
