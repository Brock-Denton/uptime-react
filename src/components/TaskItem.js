// src/components/TaskItem.js
import React, { useEffect, useState } from 'react'; // Import React
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
const TaskItem = ({ task, onStart, onStop, onEdit}) => {
  const { upgradedStopTask } = useTimer();
  const [localProgress, setLocalProgress] = useState(task.progress); // Local state for progress
  const { title, time, status, iconBgColor, isActive, icon, isPending, progress, progressColorScheme } = task; 
  const IconComponent = icons[icon];
  // Calculate the completion status based on progress
  const isComplete = localProgress >= 100;

  const activeBorderStyle = isActive 
    ? '2px solid gold' 
    : isPending 
      ? '2px solid orange' 
      : 'none';

      const neonColor = status === 'GOAL' ? 'green.400' : status === 'LIMIT' ? 'red.400' : 'purple.400';

      // Update progress when task prop changes
      useEffect(() => {
        setLocalProgress(task.progress);
      }, [task.progress]);
    
      // Set an interval to update progress every 2 seconds
      useEffect(() => {
        const intervalId = setInterval(() => {
          console.log(`Interval triggered for task: ${task.title}`);
          setLocalProgress(prevProgress => {
            const newProgress = Math.min(prevProgress + 1, 100); // Increment progress and cap at 100%
            return newProgress;
          });
        }, 2000);
    
        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
      }, []);

        // Reset task state when completeDay is called
  useEffect(() => {
    if (!isActive && !isPending) {
      // When completeDay is called, set isActive and isPending to false
      setLocalProgress(0); // Reset progress for a new day
    }
  }, [isActive, isPending]);

  return (
    <VStack
      spacing={0}
      bg={isComplete ? neonColor : "gray.700"}
      p={4}
      borderRadius="lg"
      w="100%"
      justifyContent="space-between"
      onClick={onEdit}
      cursor="pointer"
      position="relative"
      border={activeBorderStyle}
      boxShadow={isActive ? '0 0 10px gold' : 'none'}
    >
      <HStack spacing={4} w="100%" justifyContent="space-between">
        <HStack spacing={4}>
          <Box bg={iconBgColor} p={2} borderRadius="full">
            <Box as={IconComponent} color="white" boxSize="1.5em" />
          </Box>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="md" fontWeight="bold">{title}</Text>
            <Badge colorScheme={status === 'GOAL' ? 'green' : 'red'}>{status}</Badge>
          </VStack>
        </HStack>
        <VStack spacing={1} alignItems="flex-end">
          <Text fontSize="sm" color={isComplete ? "white" : "gray.400"}>{time}</Text>
          <IconButton
            icon={isActive ? <FaPause /> : <FaPlay />}
            colorScheme="purple"
            variant="outline"
            aria-label={isActive ? "Pause Task" : "Start Task"}
            onClick={(e) => { e.stopPropagation(); isActive ? upgradedStopTask() : onStart(); }}
          />
        </VStack>
      </HStack>
      <Progress
        value={localProgress}
        size="sm"
        colorScheme={progressColorScheme}
        w="100%"
        position="absolute"
        bottom="0"
        borderBottomRadius="lg"
      />
    </VStack>
  );
};


export default TaskItem; // Export TaskItem component

