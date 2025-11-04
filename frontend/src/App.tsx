import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Components
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import EmployeesPage from './components/Admin/EmployeesPage';
import AdminProjectsPage from './components/Admin/ProjectsPage';
import AdminAssetsPage from './components/Admin/AssetsPage';
import TeamLeadDashboard from './components/TeamLead/TeamLeadDashboard';
import TeamLeadProjectsPage from './components/TeamLead/ProjectsPage';
import EmployeeDashboard from './components/Employee/EmployeeDashboard';
import EmployeeAssetsPage from './components/Employee/AssetsPage';
import EmployeeTasks from './components/Employee/Tasks';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import MyTeamPage from './components/TeamLead/MyTeamPage';
import Tasks from './components/TeamLead/Tasks';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin/*" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <Routes>
                      <Route path="" element={<AdminDashboard />} />
                      <Route path="employees" element={<EmployeesPage />} />
                      <Route path="projects" element={<AdminProjectsPage />} />
                      <Route path="assets" element={<AdminAssetsPage />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/teamlead/*" element={
                <ProtectedRoute allowedRoles={['teamlead']}>
                  <Layout>
                    <Routes>
                      <Route path="" element={<TeamLeadDashboard />} />
                      <Route path="projects" element={<TeamLeadProjectsPage />} />
                      <Route path="team" element={<MyTeamPage />} />
                      <Route path="tasks" element={<Tasks />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/employee/*" element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <Layout>
                    <Routes>
                      <Route path="" element={<EmployeeDashboard />} />
                      <Route path="tasks" element={<EmployeeTasks />} />
                      <Route path="assets" element={<EmployeeAssetsPage />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
