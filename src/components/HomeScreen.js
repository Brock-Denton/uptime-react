import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, VStack, Text } from '@chakra-ui/react';
import { useAuth } from '../AuthContext';
import BottomNavBar from './BottomNavBar';
import { useTimer } from '../TimerContext';

const HomeScreen = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { stopTask, activeTaskId, tasks, updateElapsedTimeInDatabase } = useTimer(); // Add tasks and updateElapsedTimeInDatabase

  const handleLogout = async () => {
    try {
      // If there is an active task, save its current state without stopping it
      if (activeTaskId !== null) {
        const task = tasks.find(task => task.id === activeTaskId);
        const [hours, minutes, seconds] = task.time.split(':').map(Number);
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

        // Update the elapsed time and start time in the database
        await updateElapsedTimeInDatabase(activeTaskId, totalSeconds, task.start_time);
      }

      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <Box
      bgGradient="linear(to-r, black, purple.900)"
      color="white"
      minH="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={6}
    >
      <VStack spacing={6} w="100%" maxW="sm">
        <Text fontSize="3xl" fontWeight="bold">
          Welcome, {user?.email || user?.username || 'User'}
        </Text>
        <Button
          bgGradient="linear(to-r, purple.500, red.500)"
          color="white"
          size="lg"
          width="100%"
          onClick={handleLogout}
        >
          Log out
        </Button>
      </VStack>
      <BottomNavBar />
    </Box>
  );
};

export default HomeScreen;
