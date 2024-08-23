// src/components/HomeScreen.js

import React from 'react'; // Import React library
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom for navigation
import { Button, Box, VStack, Text } from '@chakra-ui/react'; // Import Chakra UI components
import { useAuth } from '../AuthContext'; // Import useAuth custom hook from AuthContext
import BottomNavBar from './BottomNavBar'; // Import BottomNavBar component
import { useTimer } from '../TimerContext'; // Import useTimer custom hook from TimerContext

const HomeScreen = () => {
  const { signOut, user } = useAuth(); // Destructure signOut function and user object from useAuth
  const navigate = useNavigate(); // Initialize useNavigate for routing
  const { stopTask, activeTaskId } = useTimer(); // Destructure stopTask and activeTaskId from useTimer

  // Function to handle user logout
  const handleLogout = async () => {
    try {
      // Stop the active task if any
      if (activeTaskId !== null) {
        stopTask(); // Stop the timer and save elapsed time
      }
      
      await signOut(); // Sign out the user
      navigate('/login'); // Redirect to login page after sign out
    } catch (error) {
      console.error('Logout failed', error); // Log any errors that occur during logout
    }
  };

  return (
    <Box
      bgGradient="linear(to-r, black, purple.900)" // Apply a linear gradient background
      color="white" // Set text color to white
      minH="100vh" // Set minimum height to 100% of viewport height
      display="flex" // Use flexbox for layout
      flexDirection="column" // Arrange children in a column
      alignItems="center" // Center children horizontally
      justifyContent="center" // Center children vertically
      p={6} // Apply padding
    >
      <VStack spacing={6} w="100%" maxW="sm">
        <Text fontSize="3xl" fontWeight="bold">
          Welcome, {user?.email || user?.username || 'User'} 
        </Text> 
        <Button
          bgGradient="linear(to-r, purple.500, red.500)" // Apply a linear gradient background to the button
          color="white" // Set button text color to white
          size="lg" // Set button size to large
          width="100%" // Set button width to 100%
          onClick={handleLogout} // Call handleLogout function on button click
        >
          Log out
        </Button>
      </VStack>
      <BottomNavBar /> 
    </Box>
  );
};

export default HomeScreen; // Export HomeScreen component as default
