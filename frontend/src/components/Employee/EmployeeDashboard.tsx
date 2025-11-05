//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, Clock, AlertCircle, TrendingUp, Package, Play, Square, Calendar, Target } from 'lucide-react';

const EmployeeDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [assets, setAssets] = useState([]);
  const [taskStats, setTaskStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Fetch all data in parallel
      const [tasksRes, assetsRes, statsRes] = await Promise.all([
        fetch('/api/employee/tasks', { headers }),
        fetch('/api/employee/assets', { headers }),
        fetch('/api/employee/tasks/stats', { headers })
      ]);

      if (!tasksRes.ok || !assetsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const tasksData = await tasksRes.json();
      const assetsData = await assetsRes.json();
      const statsData = await statsRes.json();

      setTasks(tasksData.slice(0, 5)); // Show only recent 5 tasks
      setAssets(assetsData.current || assetsData); // Handle both response formats
      setTaskStats(statsData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to demo data if API fails
      setTaskStats({
        total: 24,
        completed: 18,
        inProgress: 4,
        pending: 2,
        overdue: 1,
        totalTimeSpent: 2340,
        completionRate: 75
      });
      setTasks([
        {
          _id: '1',
          title: 'Demo Task - API Connection Failed',
          description: 'Please check your backend connection',
          status: 'pending',
          dueDate: '2025-11-10',
          priority: 'high',
          project: { projectName: 'Demo Project', status: 'active' },
          totalTimeSpent: 0
        }
      ]);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employee/tasks/${taskId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Failed to start task');
        return;
      }

      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error starting task:', error);
      alert('Failed to start task');
    }
  };

  const handleStopTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employee/tasks/${taskId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: 'Work session completed'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Failed to stop task');
        return;
      }

      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error stopping task:', error);
      alert('Failed to stop task');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-700 border-green-200',
      'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      overdue: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-blue-500 text-white',
      low: 'bg-gray-500 text-white'
    };
    return colors[priority] || 'bg-gray-500 text-white';
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Employee Dashboard</h1>
          <p className="text-gray-600">Track your tasks, assets, and performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-gray-500">TOTAL</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{taskStats?.total || 0}</h3>
            <p className="text-sm text-gray-600">Total Tasks</p>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-gray-500">SUCCESS</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{taskStats?.completed || 0}</h3>
            <p className="text-sm text-gray-600">{taskStats?.completionRate.toFixed(1)}% completion rate</p>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-500">TIME</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{formatTime(taskStats?.totalTimeSpent || 0)}</h3>
            <p className="text-sm text-gray-600">Time spent</p>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-sm font-semibold text-gray-500">URGENT</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{taskStats?.overdue || 0}</h3>
            <p className="text-sm text-gray-600">Overdue tasks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tasks */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Tasks</h2>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-sm font-medium">
                View All Tasks
              </button>
            </div>
            
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2 ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{task.project.projectName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(task.totalTimeSpent)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <div className="flex gap-2">
                      {task.status === 'in-progress' ? (
                        <button 
                          onClick={() => handleStopTask(task._id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Stop task"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleStartTask(task._id)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                          title="Start task"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assigned Assets */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Assigned Assets</h2>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                  {assets.length}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                {assets.map((asset) => (
                  <div key={asset._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Package className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{asset.assetName}</p>
                        <p className="text-xs text-gray-600">{asset.assetType}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                      Active
                    </span>
                  </div>
                ))}
              </div>
              
              <button className="w-full py-2 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium text-sm">
                View All Assets
              </button>
            </div>

            {/* Progress Overview */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Progress Overview</h2>
              
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Task Completion</span>
                  <span className="text-gray-900 font-bold">
                    {taskStats?.completed} / {taskStats?.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${taskStats?.completionRate || 0}%` }}
                  ></div>
                </div>
                <p className="text-right text-xs text-gray-600 mt-1">{taskStats?.completionRate.toFixed(1)}%</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{taskStats?.inProgress}</p>
                  <p className="text-xs text-gray-600 font-medium">In Progress</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{taskStats?.pending}</p>
                  <p className="text-xs text-gray-600 font-medium">Pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;