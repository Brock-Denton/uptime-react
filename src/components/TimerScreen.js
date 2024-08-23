// src/components/TimerScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  IconButton,
  Button,
  Center,
  CircularProgress,
  CircularProgressLabel,
  HStack,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react';
import { FaPlay, FaPause } from 'react-icons/fa';
import { FiZap } from 'react-icons/fi';

const TimerScreen = () => {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0); // Time in seconds
  const [goal, setGoal] = useState(0); // Goal in minutes
  const [streak, setStreak] = useState(0); // Streak in days
  const timerRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (goal && prevTime >= goal * 60) {
            clearInterval(timerRef.current);
            setIsActive(false);
            setStreak(streak + 1); // Increment the streak
            return prevTime;
          }
          return prevTime + 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, goal, streak]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleGoalChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setGoal(Number(value));
    }
  };

  const progressValue = goal ? (time / (goal * 60)) * 100 : 0;
  const progressColor = progressValue >= 100 ? 'gold' : 'purple.500';

  return (
    <Box
      bg="black"
      color="white"
      minH="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={6}
    >
      <Text fontSize="xl" mb={2}>Good morning, Loki!</Text>
      <Text fontSize="md" mb={6}>Let's get productive today</Text>
      <Center mb={4} position="relative">
        <CircularProgress
          value={Math.min(progressValue, 100)}
          color={progressColor}
          size="240px"
          thickness="8px"
          trackColor="gray.700"
        >
          <CircularProgressLabel fontSize="4xl">{formatTime(time)}</CircularProgressLabel>
        </CircularProgress>
      </Center>
      <InputGroup size="md" mb={4} width="100px">
        <Input
          placeholder="No"
          value={goal}
          onChange={handleGoalChange}
          textAlign="center"
          type="number"
          color="white"
          bg="gray.800"
          borderRadius="md"
          _placeholder={{ color: 'gray.400' }}
        />
        <InputRightElement pointerEvents="none" children="min" color="gray.400" />
      </InputGroup>
      <HStack spacing={1} mb={4}>
        <Box as={FiZap} color="orange.500" />
        <Text fontSize="md">{streak} days streak</Text>
      </HStack>
      <IconButton
        icon={isActive ? <FaPause /> : <FaPlay />}
        colorScheme="purple"
        size="lg"
        isRound
        onClick={handleStartPause}
        mb={4}
      />
      <Link to="/update">
        <Button variant="link" colorScheme="teal" size="sm">
          Go to Task Update
        </Button>
      </Link>
    </Box>
  );
};

export default TimerScreen;
