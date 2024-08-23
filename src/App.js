import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import TaskListScreen from './components/TaskListScreen';
import TaskUpdateScreen from './components/TaskUpdateScreen';
import TimerScreen from './components/TimerScreen';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import SummaryScreen from './components/SummaryScreen';
import HomeScreen from './components/HomeScreen';
import { TimerProvider } from './TimerContext';
import { AuthProvider, useAuth } from './AuthContext';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/signup" element={<SignupScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/" element={user ? <TaskListScreen /> : <Navigate to="/login" />} />
      <Route path="/home" element={user ? <HomeScreen /> : <Navigate to="/login" />} />
      <Route path="/update" element={user ? <TaskUpdateScreen /> : <Navigate to="/login" />} />
      <Route path="/timer" element={user ? <TimerScreen /> : <Navigate to="/login" />} />
      <Route path="/summary" element={user ? <SummaryScreen /> : <Navigate to="/login" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ChakraProvider>
      <AuthProvider>
        <TimerProvider>
          <Router>
            <AppRoutes />
          </Router>
        </TimerProvider>
      </AuthProvider>
    </ChakraProvider>
  );
};

export default App;