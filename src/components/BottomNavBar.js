import React from 'react'; // Import React
import { HStack, IconButton, Box } from '@chakra-ui/react'; // Import Chakra UI components
import { FaHome, FaTasks, FaChartPie } from 'react-icons/fa'; // Import icons
import { useNavigate } from 'react-router-dom'; // Import navigation hook
import { useAuth } from '../AuthContext'; // Import custom hook for authentication

const BottomNavBar = () => {
  const navigate = useNavigate(); // Hook for navigation
  const { user } = useAuth(); // Access user from authentication context

  return (
    <Box
      position="fixed" // Fix position at the bottom of the screen
      bottom={0} // Position at the bottom
      left={0} // Align to the left
      width="100%" // Full width
      bg="black" // Background color
      p={2} // Padding
      zIndex={1000} // Ensure it appears on top
      borderTop="1px solid gray" // Top border styling
    >
      <HStack justifyContent="space-around"> {/* Horizontally align children with space around */}
        <IconButton
          icon={<FaHome />} // Home icon
          colorScheme="teal" // Teal color scheme
          variant="ghost" // Ghost variant (transparent background)
          aria-label="Home Screen" // Accessibility label
          onClick={() => navigate(user ? '/home' : '/login')} // Navigate to home or login based on user state
        />
        <IconButton
          icon={<FaTasks />} // Tasks icon
          colorScheme="teal" // Teal color scheme
          variant="ghost" // Ghost variant (transparent background)
          aria-label="Task List Screen" // Accessibility label
          onClick={() => navigate('/')} // Navigate to the task list
          isDisabled={!user} // Disable button if no user is logged in
        />
        <IconButton
          icon={<FaChartPie />} // Summary icon
          colorScheme="teal" // Teal color scheme
          variant="ghost" // Ghost variant (transparent background)
          aria-label="Summary Screen" // Accessibility label
          onClick={() => navigate('/summary')} // Navigate to the summary screen
          isDisabled={!user} // Disable button if no user is logged in
        />
      </HStack>
    </Box>
  );
};

export default BottomNavBar; // Export the BottomNavBar component
