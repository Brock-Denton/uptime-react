import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  HStack,
  Progress,
  Divider,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import BottomNavBar from './BottomNavBar';
import { useTimer } from '../TimerContext';
import supabase from '../supabaseClient';
import { useAuth } from '../AuthContext';

const SummaryScreen = () => {
  const {
    tasks,
    totalDaysCompleted,
    setTotalDaysCompleted,
    summaryPersistentTime,
    dailyProgress,
    setDailyProgress,
    ongoingProgress,
    setOngoingProgress,
    goalCompletions,
    setGoalCompletions
  } = useTimer();

  const { user } = useAuth();

  const [dayOffset, setDayOffset] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [dayProgress, setDayProgress] = useState(0);

// Fetch progress data from Supabase whenever the user changes
useEffect(() => {
  const fetchProgressData = async () => {
    if (!user || !user.id) return;

    const { data, error } = await supabase
      .from('user_progress')
      .select('total_days_completed, daily_progress, ongoing_progress, goal_completions')  // Added goal_completions here
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching progress data:', error);
      return;
    }

    if (data) {
      setTotalDaysCompleted(data.total_days_completed || 0);
      setDailyProgress(data.daily_progress || []);
      setOngoingProgress(data.ongoing_progress || 0);
      setGoalCompletions(data.goal_completions || {});  // Set goal_completions here

      // Added: Calculate the initial day offset based on total days completed
      const totalDays = data.total_days_completed || 0;
      const initialOffset = totalDays >= 7 ? Math.floor((totalDays - 1) / 7) * 7 : 0;
      setDayOffset(initialOffset);
    }
  };

  fetchProgressData();
}, [user, setTotalDaysCompleted, setDailyProgress, setOngoingProgress, setGoalCompletions]);


  // Effect to calculate total tracked time and day progress
  useEffect(() => {
    const totalTrackedTime = tasks.reduce((acc, task) => {
      const totalPersistentTime = task.persistent_time || 0;
      return acc + totalPersistentTime;
    }, 0);
    setTotalTime(totalTrackedTime);

    const totalGoalTime = tasks.reduce(
      (acc, task) => acc + (task.status === 'GOAL' ? task.duration * 60 : 0),
      0
    );
    const totalElapsed = tasks.reduce((acc, task) => {
      const taskPersistentTime = task.persistent_time || 0;
      return acc + Math.min(taskPersistentTime, task.duration * 60);
    }, 0);

    setDayProgress(totalGoalTime ? (totalElapsed / totalGoalTime) * 100 : 0);
  }, [tasks]);

// Function to save progress data to Supabase
const saveProgressData = async () => {
  console.log('Saving goal_completions:', goalCompletions);
  if (user && (totalDaysCompleted > 0 || dailyProgress.length > 0 || ongoingProgress > 0)) {
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        total_days_completed: totalDaysCompleted,
        daily_progress: dailyProgress,
        ongoing_progress: ongoingProgress,
        goal_completions: goalCompletions,  // Added goal_completions here
      });

    if (error) {
      console.error('Error saving progress data:', error);
    }
  }
};


  // Periodically save progress data
  useEffect(() => {
    const intervalId = setInterval(() => {
      saveProgressData();  // Save progress at regular intervals
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(intervalId); // Clear the interval on component unmount
  }, [totalDaysCompleted, dailyProgress, ongoingProgress]);

  // Save progress data on unmount
  useEffect(() => {
    return () => {
      saveProgressData();  // Save progress when the component unmounts
    };
  }, [totalDaysCompleted, dailyProgress, ongoingProgress]);

  // Function to calculate percentage of time
  const calculatePercentage = (time) => (totalTime === 0 ? 0 : (time / totalTime) * 100);

  const formatTime = (time) => {
    const days = Math.floor(time / 86400);
    const hours = Math.floor((time % 86400) / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    return `${days > 0 ? `${days}days ` : ''}${hours > 0 ? `${hours}hrs ` : ''}${minutes}min`;
  };

// Added: Logic to handle day navigation within valid ranges
const handleNextDays = () => {
  const maxOffset = Math.floor((totalDaysCompleted - 1) / 7) * 7;
  if (dayOffset < maxOffset) {
    setDayOffset(dayOffset + 7);
  }
};

const handlePrevDays = () => {
  if (dayOffset > 0) {
    setDayOffset(dayOffset - 7);
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
      justifyContent="flex-start"
      p={6}
      pb={20}
    >
      <VStack spacing={6} w="100%" maxW="md">
        <HStack w="100%" justifyContent="space-between">
          <VStack>
            <Text fontSize="xl" fontWeight="bold" color="green.500">
              Total Days Completed
            </Text>
            <Text fontSize="2xl">{totalDaysCompleted}</Text>
          </VStack>
          <VStack>
            <Text fontSize="xl" fontWeight="bold" color="blue.500">
              Total Time Duration
            </Text>
            <Text fontSize="2xl">
              {Math.floor(totalTime / 3600)}hrs {Math.floor((totalTime % 3600) / 60)}min
            </Text>
          </VStack>
        </HStack>
        <Divider />
        <VStack w="100%" alignItems="center">
          <Text fontSize="xl" fontWeight="bold">
            Summary
          </Text>
        </VStack>
        <HStack spacing={4} justifyContent="center" w="100%">
  {dayOffset > 0 && (
    <button onClick={handlePrevDays} variant="ghost" colorScheme="teal">
      <FaArrowLeft />
    </button>
  )}
  {Array.from({ length: 7 }, (_, index) => index + 1 + dayOffset).map(
    (day, index) => (
      <CircularProgress
        key={index}
        value={
          day === totalDaysCompleted + 1
            ? ongoingProgress
            : dailyProgress[day - 1] || 0
        }
        color="green.400"
        size="40px"
        thickness="12px"
      >
        <CircularProgressLabel>{day}</CircularProgressLabel>
      </CircularProgress>
    )
  )}
  {totalDaysCompleted > dayOffset + 7 && (
    <button onClick={handleNextDays} variant="ghost" colorScheme="teal">
      <FaArrowRight />
    </button>
  )}
</HStack>

<VStack w="100%" spacing={4}>
  {tasks
    .sort((a, b) => {
      if (a.status === 'GOAL' && b.status !== 'GOAL') return -1;
      if (a.status !== 'GOAL' && b.status === 'GOAL') return 1;
      return 0;
    })
    .map((task) => {
      const totalTaskTime = task.persistent_time || 0;
      const percentage = calculatePercentage(totalTaskTime);
      const daysCompleted = Math.floor(totalTaskTime / (task.duration * 60));
      return (
        <Box key={task.id} w="100%" mb={4}>
          <Box display="grid" gridTemplateColumns="30% 40% 30%" w="100%" alignItems="center">
            <Text color="purple.500">
              {task.title} - {percentage.toFixed(0)}%
            </Text>
            <Text textAlign="center" justifySelf="center">
              {goalCompletions[task.id] || 0} days
            </Text>
            <Text textAlign="right" justifySelf="right">
              {formatTime(totalTaskTime)}
            </Text>
          </Box>
          <HStack spacing={0} w="100%" alignItems="center">
            <Box w="100%" position="relative">
              <Progress
                value={percentage}
                size="lg"
                colorScheme={task.status === 'GOAL' ? 'green' : 'red'}
                position="relative"
              >
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  h="100%"
                  bg={task.status === 'GOAL' ? 'green.500' : 'red.500'}
                  zIndex={1}
                  style={{
                    width: `${percentage}%`,
                    transition: `width ${totalTaskTime}s linear`,
                  }}
                />
              </Progress>
            </Box>
          </HStack>
        </Box>
      );
    })}
</VStack>



      </VStack>
      <BottomNavBar />
    </Box>
  );
};

export default SummaryScreen;
