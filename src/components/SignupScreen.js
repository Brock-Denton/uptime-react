// src/components/SignupScreen.js

import React, { useState } from 'react'; // Import React and useState hook
import { useNavigate } from 'react-router-dom'; // Import hook for navigation
import { Button, Input, Box, VStack, Text, Alert, AlertIcon } from '@chakra-ui/react'; // Import Chakra UI components
import supabase from '../supabaseClient'; // Import Supabase client
import { useAuth } from '../AuthContext'; // Import custom hook from AuthContext

const SignupScreen = () => {
  const [username, setUsername] = useState(''); // State for the username
  const [password, setPassword] = useState(''); // State for the password
  const [errorMessage, setErrorMessage] = useState(''); // State for error message
  const navigate = useNavigate(); // Hook to navigate to different routes
  const { signIn } = useAuth(); // Get signIn function from AuthContext

  // Function to handle sign up
  const handleSignUp = async () => {

// Check if username or password is empty
if (!username.trim() || !password.trim()) {
  setErrorMessage('Username and password cannot be empty.');
  return;
}

    try {
      // Check if username already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('uptimeusers')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        throw new Error('Username already exists'); // Throw error if username exists
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError; // Throw error if there's a fetch error
      }

      // Insert new user
      const { error: insertError } = await supabase
        .from('uptimeusers')
        .insert([{ username, password }]);

      if (insertError) {
        throw insertError; // Throw error if there's an insert error
      }

      // Sign in the user
      await signIn(username, password);

      // Navigate to the task list screen
      navigate('/');
    } catch (error) {
      setErrorMessage(`Error signing up: ${error.message}`); // Set error message
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
      p={6} // Padding
    >
      <VStack spacing={6} w="100%" maxW="sm"> // Vertical stack
        <Text fontSize="3xl" fontWeight="bold">Create New Account</Text> // Heading text
        {errorMessage && ( // Conditional rendering for error message
          <Alert status="error">
            <AlertIcon /> 
            {errorMessage} 
          </Alert>
        )}
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
          onClick={handleSignUp} // Click handler
        >
          Create User
        </Button>
      </VStack>
    </Box>
  );
};

export default SignupScreen; // Export the component
