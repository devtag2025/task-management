#!/bin/bash

echo "Starting Task Management System..."
echo

echo "Installing backend dependencies..."
npm install

echo
echo "Installing frontend dependencies..."
cd client
npm install
cd ..

echo
echo "Setting up initial data..."
node setup.js

echo
echo "Starting the application..."
echo "Backend will run on http://localhost:5000"
echo "Frontend will run on http://localhost:3000"
echo

# Start backend in background
npm run dev &
BACKEND_PID=$!

# Start frontend
cd client
npm start &
FRONTEND_PID=$!

echo
echo "Application started successfully!"
echo "Open http://localhost:3000 in your browser"
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait
