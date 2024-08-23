// src/components/TaskUpdateScreen.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Input,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  HStack,
  Switch,
  Button,
  useToast,
  Checkbox,
  RadioGroup,
  Radio,
  Stack,
} from '@chakra-ui/react';
import { useTimer } from '../TimerContext';
import { FaSun, FaMoon, FaStar, FaCloud } from 'react-icons/fa';
import supabase from '../supabaseClient';
import { useAuth } from '../AuthContext';

const icons = {
  FaSun,
  FaMoon,
  FaStar,
  FaCloud,
};

const TaskUpdateScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const taskToEdit = location.state?.task || null;
  const { tasks, setTasks } = useTimer();
  const toast = useToast();
  const { user } = useAuth();

  const [taskName, setTaskName] = useState('');
  const [time, setTime] = useState(30);
  const [goal, setGoal] = useState(taskToEdit ? taskToEdit.status === 'GOAL' : true);
  const [limit, setLimit] = useState(taskToEdit ? taskToEdit.status === 'LIMIT' : false);
  const [alarm, setAlarm] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('FaSun');

  useEffect(() => {
    if (taskToEdit) {
      setTaskName(taskToEdit.title);
      setTime(taskToEdit.duration);
      setGoal(taskToEdit.status === 'GOAL');
      setLimit(taskToEdit.status === 'LIMIT');
      setSelectedIcon(taskToEdit.icon || 'FaSun');
    }
  }, [taskToEdit]);

  const handleUpdateTask = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'User is not authenticated.',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

      // Check if taskName is empty
  if (!taskName.trim()) {
    toast({
      title: 'Error',
      description: 'Task name cannot be empty.',
      status: 'error',
      duration: 2000,
      isClosable: true,
    });
    return;
  }

    if (taskName.length > 22) {
      toast({
        title: 'Error',
        description: 'Task name must be 33 characters or less.',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const isUnique = tasks.every(task => task.id === taskToEdit?.id || task.title !== taskName);
    if (!isUnique) {
      toast({
        title: 'Error',
        description: 'Task name must be unique.',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    try {
      let newTask;

      if (taskToEdit) {
        const { data, error } = await supabase
          .from('tasks')
          .update({
            task_name: taskName,
            icon: selectedIcon,
            status: goal ? 'GOAL' : 'LIMIT',
            duration: time
          })
          .eq('id', taskToEdit.id)
          .select()
          .single();

        if (error) throw error;

        newTask = { ...taskToEdit, title: taskName, icon: selectedIcon, status: goal ? 'GOAL' : 'LIMIT', duration: time };
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .insert([{ user_id: user.id, task_name: taskName, icon: selectedIcon, status: goal ? 'GOAL' : 'LIMIT', duration: time }])
          .select()
          .single();

        if (error) throw error;

        newTask = {
          id: data.id,
          title: taskName,
          duration: time,
          status: goal ? 'GOAL' : 'LIMIT',
          time: '00:00:00',
          isActive: false,
          icon: selectedIcon,
          iconBgColor: goal ? 'green.500' : 'red.500'
        };
      }

      setTasks((prevTasks) => {
        if (taskToEdit) {
          return prevTasks.map((task) => (task.id === taskToEdit.id ? newTask : task));
        } else {
          return [...prevTasks, newTask];
        }
      });

      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to save task: ${error.message}`,
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleDeleteTask = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this task?');
    if (confirmed) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskToEdit.id);

        if (error) throw error;

        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskToEdit.id));
        toast({
          title: 'Task deleted.',
          description: 'The task has been deleted successfully.',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        navigate('/');
      } catch (error) {
        toast({
          title: 'Error',
          description: `Failed to delete task: ${error.message}`,
          status: 'error',
          duration: 2000,
          isClosable: true,
        });
      }
    }
  };

  const formatTime = (value) => {
    const h = Math.floor(value / 60);
    const m = value % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  };

  const handleGoalChange = () => {
    setGoal(true);
    setLimit(false);
  };

  const handleLimitChange = () => {
    setLimit(true);
    setGoal(false);
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
      p={4}
      w="100vw"
    >
      <VStack spacing={4} w="90%" maxW="md">
        <Input
          placeholder="Task Name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          color="white"
          bg="gray.800"
          borderRadius="md"
          maxLength={22}
        />
        <VStack w="100%" alignItems="flex-start">
          <Text fontSize="md">Time: {formatTime(time)}</Text>
          <Slider
            value={time}
            min={5}
            max={180}
            step={5}
            onChange={(val) => setTime(val)}
          >
            <SliderTrack bg="gray.700">
              <SliderFilledTrack bg="purple.500" />
            </SliderTrack>
            <SliderThumb boxSize={6} />
          </Slider>
        </VStack>
        <HStack w="100%" justifyContent="space-between">
          <Checkbox
            colorScheme="green"
            isChecked={goal}
            onChange={handleGoalChange}
            _hover={{ cursor: goal ? 'default' : 'pointer' }}
          >
            Goal
          </Checkbox>
          <Checkbox
            colorScheme="red"
            isChecked={limit}
            onChange={handleLimitChange}
            _hover={{ cursor: limit ? 'default' : 'pointer' }}
          >
            Limit
          </Checkbox>
        </HStack>
        <HStack w="100%" justifyContent="space-between">
          <Text>Alarm</Text>
          <Switch colorScheme="purple" isChecked={alarm} onChange={(e) => setAlarm(e.target.checked)} />
        </HStack>
        <VStack w="100%" alignItems="flex-start">
          <Text fontSize="md">Select Icon:</Text>
          <RadioGroup onChange={setSelectedIcon} value={selectedIcon}>
            <Stack direction="row" spacing={4}>
              {Object.keys(icons).map((iconKey) => {
                const IconComponent = icons[iconKey];
                return (
                  <Radio key={iconKey} value={iconKey}>
                    <IconComponent />
                  </Radio>
                );
              })}
            </Stack>
          </RadioGroup>
        </VStack>
        <Button
          bgGradient="linear(to-r, purple.500, red.500)"
          color="white"
          size="lg"
          width="100%"
          onClick={handleUpdateTask}
        >
          {taskToEdit ? 'Update Task' : 'Create Task'}
        </Button>
        {taskToEdit && (
          <Button
            bg="red.500"
            color="white"
            size="lg"
            width="100%"
            onClick={handleDeleteTask}
          >
            Delete Task
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default TaskUpdateScreen;
