import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import supabase from './supabaseClient';
import { useAuth } from './AuthContext';

const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [totalDaysCompleted, setTotalDaysCompleted] = useState(0);
  const [taskListResetTime, setTaskListResetTime] = useState({});
  const [summaryPersistentTime, setSummaryPersistentTime] = useState({});
  const [dailyProgress, setDailyProgress] = useState([]);
  const [ongoingProgress, setOngoingProgress] = useState(0);
  const [goalCompletions, setGoalCompletions] = useState({});
  const [completionDates, setCompletionDates] = useState({});
  const timerRef = useRef(null);

  useEffect(() => {
    if (user) {
      // Reset all state when user changes
      resetState();

      // Fetch user-specific data
      fetchUserData(user.id);
    }
  }, [user]);

  const resetState = () => {
    setTasks([]);
    
    setTotalDaysCompleted(0);
    setTaskListResetTime({});
    setSummaryPersistentTime({});
    setDailyProgress([]);
    setOngoingProgress(0);
    setGoalCompletions({});
    setCompletionDates({});
  };

  const fetchUserData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('total_days_completed, daily_progress, ongoing_progress, goal_completions')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      if (data) {
        setTotalDaysCompleted(data.total_days_completed || 0);
        setDailyProgress(data.daily_progress || []);
        setOngoingProgress(data.ongoing_progress || 0);
        setGoalCompletions(data.goal_completions || {});
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const startTask = (taskId) => {
    if (activeTaskId !== null && activeTaskId !== taskId) {
      stopTask(); // Stop the previous task if it's not the same as the current one
    }
  
    const task = tasks.find(task => task.id === taskId);

    if (task) {
  
    // Ensure task.elapsed_time is properly loaded and logged
    console.log(`Starting task with ID: ${taskId}`);
    console.log('Task Object:', task);
    console.log(`Loaded elapsed time in seconds from database: ${task?.elapsed_time}`);
  
    let initialTimeInSeconds = task?.elapsed_time || 0;
  
    console.log(`Initial time in seconds (before start): ${initialTimeInSeconds}`);
  
    setActiveTaskId(taskId);
  
    // Ensure the initial time is set to the elapsed_time value
    setTaskListResetTime((prevTimes) => ({
      ...prevTimes,
      [task.id]: new Date(initialTimeInSeconds * 1000).toISOString().substr(11, 8),
    }));
  
    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            isActive: true,
            time: new Date(initialTimeInSeconds * 1000).toISOString().substr(11, 8),
          };
        }
        return t;
      })
    );
  
    // Continue counting from the fetched elapsed time
    timerRef.current = setInterval(() => {
      initialTimeInSeconds += 1;
  
      const newTimeString = new Date(initialTimeInSeconds * 1000).toISOString().substr(11, 8);
  
      console.log(`Task ID ${task.id}: New time string: ${newTimeString}`);
      console.log(`Initial time in seconds (after increment): ${initialTimeInSeconds}`);
  
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (t.id === taskId) {
            return { ...t, time: newTimeString };
          }
          return t;
        })
      );
    }, 1000);
  } else {
    console.error('startTask called but task not found for taskId:', taskId);
  }
  };
  
  
  
  const stopTask = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current); // Stop the timer
    }
  
    // Find the currently active task
    const task = tasks.find(task => task.id === activeTaskId);
    if (task) {
      // Calculate the elapsed time when stopping
      const [hours, minutes, seconds] = task.time.split(':').map(Number);
      const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  
      // Update the elapsed time in the database
      updateElapsedTimeInDatabase(activeTaskId, totalSeconds);
  
      // Update the tasks state with the new elapsed time and deactivate it
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === activeTaskId ? { ...t, elapsed_time: totalSeconds, isActive: false } : t
        )
      );
    }
  
    setActiveTaskId(null);
    console.log("Task stopped. activeTaskId is now:", activeTaskId); // Debugging log
};

  
// Function to update the elapsed time in the database
const updateElapsedTimeInDatabase = async (taskId, elapsedTime) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({
        elapsed_time: elapsedTime,  // Only update elapsed_time
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating elapsed time:', error);
    } else {
      console.log(`Elapsed time for task ID ${taskId} updated to ${elapsedTime} seconds`);
    }
  } catch (err) {
    console.error('Error in updateElapsedTimeInDatabase:', err);
  }
};

useEffect(() => {
  console.log('useEffect triggered with activeTaskId:', activeTaskId);

  if (activeTaskId !== null) {
    const task = tasks.find(task => task.id === activeTaskId);

    if (task) {
      console.log('Starting timer for activeTaskId:', activeTaskId);

      // Initialize time with the elapsed_time from the database
      let initialTimeInSeconds = task.elapsed_time || 0;
      console.log('Initial elapsed_time in seconds:', initialTimeInSeconds);

      timerRef.current = setInterval(() => {
        console.log('Timer tick for activeTaskId:', activeTaskId);

        initialTimeInSeconds += 1; // Increment the time by 1 second
        const newTimeString = new Date(initialTimeInSeconds * 1000).toISOString().substr(11, 8);

        console.log('New time string:', newTimeString);

        // Update the task's time in the state
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === activeTaskId
              ? { ...t, time: newTimeString, elapsed_time: initialTimeInSeconds }
              : t
          )
        );

        // Save to database every 10 seconds
        if (initialTimeInSeconds % 1 === 0) {
          updateTimeInDatabase(task.id, 1);
          console.log('Saved elapsed_time to database for task:', activeTaskId, 'with time:', initialTimeInSeconds);
        }

      }, 1000);
    } else {
      console.error('Task not found for activeTaskId:', activeTaskId);
    }
  } else if (timerRef.current) {
    console.log('Clearing timer for inactive task');
    clearInterval(timerRef.current);
  }

  return () => {
    console.log('Clearing interval on unmount or dependency change');
    clearInterval(timerRef.current);
    saveProgressData();  // Save progress when the component unmounts
  };
}, [activeTaskId, tasks]);

const updateTimeInDatabase = async (taskId, seconds, taskCompletion) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('elapsed_time, persistent_time')
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error fetching task time:', error);
      return;
    }

    const currentElapsedTime = data.elapsed_time || 0;
    const currentPersistentTime = data.persistent_time || 0;
    const currentTaskCompletion = data.task_completion || 0;

    const newElapsedTime = currentElapsedTime + seconds;
    const newPersistentTime = currentPersistentTime + seconds;
    const newTaskCompletion = taskCompletion !== undefined ? taskCompletion : currentTaskCompletion;

    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        elapsed_time: newElapsedTime,
        persistent_time: newPersistentTime,
      })
      .eq('id', taskId);

    if (updateError) console.error('Error updating task time and completion:', updateError);
  } catch (err) {
    console.error('Error in updateTimeInDatabase:', err);
  }
};

  

  const saveProgressData = async () => {
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          total_days_completed: totalDaysCompleted,
          daily_progress: dailyProgress,
          ongoing_progress: ongoingProgress,
          goal_completions: goalCompletions, 
        });

      if (error) {
        console.error('Error saving progress data:', error);
      }
    } catch (error) {
      console.error('Error in saveProgressData:', error);
    }
  };

  const completeDay = async () => {
    setDailyProgress((prevDailyProgress) => [
      ...prevDailyProgress,
      ongoingProgress,
    ]);
  
    setTotalDaysCompleted((prev) => prev + 1);
    setCompletionDates((prevDates) => prevDates + 1); 
  
    try {
      const updates = tasks.map(async (task) => {
        const elapsedTime = taskListResetTime[task.id];
        const [hours, minutes, seconds] = elapsedTime?.split(':').map(Number) || [0, 0, 0];
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
        if (task.status === 'GOAL' && totalSeconds >= task.duration * 60) {
          updateGoalCompletions(task.id);
        }
  
        const { error: resetError } = await supabase
          .from('tasks')
          .update({ elapsed_time: 0 })
          .eq('id', task.id);
  
        if (resetError) {
          console.error('Error resetting elapsed time:', resetError);
        } else {
          console.log(`Elapsed time for task ID ${task.id} successfully reset to 0`);
        }
      });
  
      await Promise.all(updates);
    } catch (error) {
      console.error('Error completing day:', error);
    }
  
    setTaskListResetTime({});
    setTasks((prevTasks) =>
      prevTasks.map((task) => ({
        ...task,
        time: '00:00:00',
        isActive: false
      }))
    );
    setActiveTaskId(null);
    setOngoingProgress(0);
    clearInterval(timerRef.current);
  };
  
  
  const updateGoalCompletions = (taskId) => {
    setGoalCompletions((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] || 0) + 1,
    }));
  };

  return (
    <TimerContext.Provider value={{
      tasks,
      setTasks,
      activeTaskId,
      startTask,
      stopTask,
      totalDaysCompleted,
      taskListResetTime,
      summaryPersistentTime,
      completeDay,
      dailyProgress,
      ongoingProgress,
      goalCompletions,
      completionDates,
      setCompletionDates, 
      setTotalDaysCompleted,
      setDailyProgress,
      setOngoingProgress,
      setActiveTaskId,
      updateElapsedTimeInDatabase,
      setGoalCompletions
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
