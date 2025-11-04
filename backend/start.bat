@echo off
echo Starting Task Management System...
echo.

echo Installing backend dependencies...
call npm install

echo.
echo Installing frontend dependencies...
cd client
call npm install
cd ..

echo.
echo Setting up initial data...
call node setup.js

echo.
echo Starting the application...
echo Backend will run on http://localhost:5000
echo Frontend will run on http://localhost:3000
echo.

start cmd /k "npm run dev"
start cmd /k "cd client && npm start"

echo.
echo Application started successfully!
echo Open http://localhost:3000 in your browser
pause
