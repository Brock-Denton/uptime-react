// src/components/TaskItem.js
import React from 'react'; // Import React
import { HStack, VStack, Box, Text, Badge, IconButton, Progress } from '@chakra-ui/react'; // Import Chakra UI components
import { FaPlay, FaPause, FaSun, FaMoon, FaStar, FaCloud } from 'react-icons/fa'; // Import icons from react-icons
import { useTimer } from '../TimerContext'

// Define a mapping of icon names to icon components
const icons = {
  FaSun,
  FaMoon,
  FaStar,
  FaCloud,
};

// Define the TaskItem component
const TaskItem = ({ task, onStart, onStop, onEdit, progress }) => {
  const { upgradedStopTask } = useTimer();
  const { title, time, status, iconBgColor, isActive, icon, isPending} = task; // Destructure task properties
  const IconComponent = icons[icon]; // Get the icon component from the icons map
  const isComplete = progress >= 100; // Determine if the task is complete
  const progressColorScheme = status === 'GOAL' ? 'green' : status === 'LIMIT' ? 'red' : 'purple'; // Determine progress bar color scheme
  const neonColor = status === 'GOAL' ? 'green.400' : status === 'LIMIT' ? 'red.400' : 'purple.400'; // Determine neon color for complete tasks
  // Adjust border style based on active and pending status
  const activeBorderStyle = isActive 
    ? '2px solid gold' 
    : isPending 
      ? '2px solid orange' 
      : 'none';
  

  return (
    <VStack
      spacing={0}
      bg={isComplete ? neonColor : "gray.700"} // Set background color
      p={4}
      borderRadius="lg"
      w="100%"
      justifyContent="space-between"
      onClick={onEdit} // Set click handler to edit task
      cursor="pointer"
      position="relative"
      border={activeBorderStyle} // Add border for active task
      boxShadow={isActive ? '0 0 10px gold' : 'none'} // Add neon effect for active task
    >
      <HStack spacing={4} w="100%" justifyContent="space-between"> {/* Horizontal stack for task details */}
        <HStack spacing={4}> {/* Horizontal stack for icon and task title */}
          <Box bg={iconBgColor} p={2} borderRadius="full"> {/* Box for icon background */}
            <Box as={IconComponent} color="white" boxSize="1.5em" /> {/* Task icon */}
          </Box>
          <VStack align="flex-start" spacing={1}> {/* Vertical stack for title and status */}
            <Text fontSize="md" fontWeight="bold">{title}</Text> {/* Task title */}
            <Badge colorScheme={status === 'GOAL' ? 'green' : 'red'}>{status}</Badge> {/* Task status badge */}
          </VStack>
        </HStack>
        <VStack spacing={1} alignItems="flex-end"> {/* Vertical stack for time and action button */}
          <Text fontSize="sm" color={isComplete ? "white" : "gray.400"}>{time}</Text> {/* Task time */}
          <IconButton
            icon={isActive ? <FaPause /> : <FaPlay />} // Display play or pause icon based on task state
            colorScheme="purple"
            variant="outline"
            aria-label={isActive ? "Pause Task" : "Start Task"}
            onClick={(e) => { e.stopPropagation(); isActive ? upgradedStopTask() : onStart(); }} // Use upgradedStopTask for stop
          />
        </VStack>
      </HStack>
      <Progress
        value={progress} // Set progress value
        size="sm"
        colorScheme={progressColorScheme} // Set progress color scheme
        w="100%"
        position="absolute"
        bottom="0"
        borderBottomRadius="lg"
      />
    </VStack>
  );
};

export default TaskItem; // Export TaskItem component


