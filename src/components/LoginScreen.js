import React, { useState } from 'react'; // Import React and useState hook
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate from react-router-dom
import { Button, Input, Box, VStack, Text } from '@chakra-ui/react'; // Import Chakra UI components
import BottomNavBar from './BottomNavBar'; // Import BottomNavBar component
import { useAuth } from '../AuthContext'; // Import custom hook from AuthContext

const LoginScreen = () => {
  const [username, setUsername] = useState(''); // State for the username
  const [password, setPassword] = useState(''); // State for the password
  const navigate = useNavigate(); // Hook to navigate to different routes
  const { signIn } = useAuth(); // Get signIn function from AuthContext

  // Function to handle sign in
  const handleSignIn = async () => {
    try {
      await signIn(username, password); // Attempt to sign in
      navigate('/'); // Navigate to the home page on successful sign in
    } catch (error) {
      alert(error.message); // Show alert if there's an error
    }
  };

  return (
    <Box
      bgGradient="linear(to-r, black, purple.900)" // Background gradient
      color="white" // Text color
      minH="100vh" // Minimum height
      display="flex" // Display flex
      flexDirection="column" // Flex direction column
      alignItems="center" // Align items center
      justifyContent="center" // Justify content center
      p={4} // Padding
      w="100vw" // Full viewport width
    >
      <VStack spacing={4} w="90%" maxW="sm">
        <Text fontSize="3xl" fontWeight="bold">Welcome Back!</Text> {/* Heading text */}
        <Text fontSize="md">Welcome back, we missed you!</Text> {/* Subheading text */}
        <Input
          placeholder="Username" // Placeholder text
          variant="filled" // Input variant
          bg="gray.700" // Background color
          color="white" // Text color
          size="lg" // Input size
          value={username} // Input value
          onChange={(e) => setUsername(e.target.value)} // Change handler
        />
        <Input
          placeholder="Password" // Placeholder text
          variant="filled" // Input variant
          bg="gray.700" // Background color
          color="white" // Text color
          type="password" // Input type
          size="lg" // Input size
          value={password} // Input value
          onChange={(e) => setPassword(e.target.value)} // Change handler
        />
        <Button
          bgGradient="linear(to-r, purple.500, red.500)" // Background gradient
          color="white" // Text color
          size="lg" // Button size
          width="100%" // Button width
          onClick={handleSignIn} // Click handler
        >
          Sign in
        </Button>
        <Button
          bgGradient="linear(to-r, purple.500, red.500)" // Background gradient
          color="white" // Text color
          size="lg" // Button size
          width="100%" // Button width
          onClick={() => navigate('/signup')} // Click handler
        >
          Create New Account
        </Button>
      </VStack>
      <BottomNavBar />
    </Box>
  );
};

export default LoginScreen; // Export the component
