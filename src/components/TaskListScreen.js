import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, VStack, Text, Progress, Center, Button, Heading } from '@chakra-ui/react';
import { MdStar } from 'react-icons/md';
import TaskItem from './TaskItem';
import { useTimer } from '../TimerContext';
import Confetti from 'react-confetti';
import BottomNavBar from './BottomNavBar';
import supabase from '../supabaseClient';
import { useAuth } from '../AuthContext';

const TaskListScreen = () => {
  const { tasks, setTasks, startTask, stopTask, completeDay, taskListResetTime, updateElapsedTimeInDatabase, activeTaskId, completionDates, setCompletionDates, ongoingProgress, setActiveTaskId } = useTimer();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // Move fetchTasks outside useEffect so it can be reused
  const fetchTasks = async () => {
    if (!user) return;
  
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: true });
  
    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }
  
    const updatedTasks = tasks.map((task) => {
      let newUpdatedElapsedTime = task.elapsed_time || 0;
  
      if (task.start_time) {
        const startTime = new Date(task.start_time).getTime();
        const now = Date.now();
        const diffInSeconds = Math.floor((now - startTime) / 1000);
        newUpdatedElapsedTime += diffInSeconds;
      }
  
      return {
        id: task.id,
        title: task.task_name,
        duration: task.duration,
        status: task.status,
        elapsed_time: newUpdatedElapsedTime,
        time: new Date(newUpdatedElapsedTime * 1000).toISOString().substr(11, 8),
        persistent_time: task.persistent_time || 0,
        isActive: activeTaskId === task.id,
        icon: task.icon || 'FaSun',
        iconBgColor: task.status === 'GOAL' ? 'green.500' : 'red.500'
      };
    });
  
    setTasks(updatedTasks);
  };
  

  useEffect(() => {
    fetchTasks();
  }, [user]);

  // Update progress based on tasks
  useEffect(() => {
    const goalTasks = tasks.filter(task => task.status === 'GOAL');
    const today = new Date().toLocaleDateString();

    const totalElapsed = goalTasks.reduce((acc, task) => {
      const [hours, minutes, seconds] = taskListResetTime[task.id]?.split(':').map(Number) || [0, 0, 0];
      const taskElapsed = Math.min(hours * 3600 + minutes * 60 + seconds, task.duration * 60);

      const currentTime = hours * 3600 + minutes * 60 + seconds;
      const taskGoalTime = task.duration * 60;

      return acc + taskElapsed;
    }, 0);

    const totalDur = goalTasks.reduce((acc, task) => acc + task.duration * 60, 0);

    setElapsedTime(totalElapsed / 60);
    setTotalDuration(totalDur / 60);

    if (totalDur > 0) {
      setProgress((totalElapsed / totalDur) * 100);
    } else {
      setProgress(0);
    }
  }, [tasks, taskListResetTime]);

  const handleCompleteDay = async () => {
    // Stop the active task timer
    stopTask();
  
    // Wait briefly to ensure state has updated
    await new Promise(resolve => setTimeout(resolve, 100)); 
  
    // If the active task ID is not null, force reset it
    if (activeTaskId !== null) {
      console.error("activeTaskId was not reset correctly!");
      setActiveTaskId(null);  // Force reset if necessary
    }
  
    // Update elapsed time for all tasks in the database
    await Promise.all(tasks.map(async (task) => {
      await updateElapsedTimeInDatabase(task.id, 0);  // Reset elapsed time to 0
    }));
  
    // Fetch the updated tasks to ensure they are correctly reset
    await fetchTasks();
  
    // Call the completeDay function from TimerContext to handle other completion logic
    completeDay();
  };

  const handleEdit = (task) => {
    navigate('/update', { state: { task } });
  };

  const handleAddTask = () => {
    navigate('/update');
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      setCompletionDates(prev => {
        const newCompletionDates = { ...prev };
        delete newCompletionDates[taskId];
        return newCompletionDates;
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const calculateProgress = (time, duration) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const elapsedTime = hours * 60 + minutes + seconds / 60;
    return (Math.min(elapsedTime, duration) / duration) * 100;
  };

  const goalTasks = tasks.filter((task) => task.status === 'GOAL');
  const limitTasks = tasks.filter((task) => task.status === 'LIMIT');

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
      {progress === 100 && <Confetti />}
      <VStack spacing={4} w="90%" maxW="md">
        <Center>
          <Box as={MdStar} color="gold" boxSize="1.5em" mr={2} />
          <Text fontSize="lg" fontWeight="bold">{progress === 100 ? '100% Complete' : `${progress.toFixed(2)}% Complete`}</Text>
        </Center>
        <Progress value={progress} size="lg" colorScheme="yellow" w="100%" />
        <Text fontSize="md" color="gray.400">{elapsedTime.toFixed(2)}/{totalDuration.toFixed(2)} minutes</Text>

        <Button
          bgGradient="linear(to-r, purple.500, red.500)"
          color="white"
          size="lg"
          width="100%"
          onClick={handleAddTask}
        >
          Add Task
        </Button>

        {goalTasks.length > 0 && (
          <>
            <Heading fontSize="xl" fontWeight="bold" alignSelf="flex-start" color="green.300">GOALS</Heading>
            <VStack spacing={4} w="100%" overflowY="auto" maxH="60vh">
              {goalTasks.map((task) => (
                <React.Fragment key={task.id}>
                  <TaskItem
                    task={task}
                    onStart={() => startTask(task.id)}
                    onStop={stopTask}
                    onEdit={() => handleEdit(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    progress={calculateProgress(taskListResetTime[task.id] || '00:00:00', task.duration)}
                  />
                </React.Fragment>
              ))}
            </VStack>
          </>
        )}

        {limitTasks.length > 0 && (
          <>
            <Heading fontSize="xl" fontWeight="bold" alignSelf="flex-start" color="red.300">LIMIT</Heading>
            <VStack spacing={4} w="100%" overflowY="auto" maxH="60vh">
              {limitTasks.map((task) => (
                <React.Fragment key={task.id}>
                  <TaskItem
                    task={task}
                    onStart={() => startTask(task.id)}
                    onStop={stopTask}
                    onEdit={() => handleEdit(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    progress={calculateProgress(taskListResetTime[task.id] || '00:00:00', task.duration)}
                  />
                </React.Fragment>
              ))}
            </VStack>
          </>
        )}

        <Button
          bgGradient="linear(to-r, purple.500, red.500)"
          color="white"
          size="lg"
          width="100%"
          onClick={handleCompleteDay}
        >
          Complete Day
        </Button>
      </VStack>
      <BottomNavBar />
    </Box>
  );
};

export default TaskListScreen;
