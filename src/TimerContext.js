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
    setActiveTaskId(null);
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

  const fetchTaskss = async () => {
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

            // Explicitly set isPending based on the presence of start_time and whether it's active
            const isPending = task.start_time !== null;
            const progress = Math.min((newUpdatedElapsedTime / (task.duration * 60)) * 100, 100);
            const isComplete = progress >= 100;
            const progressColorScheme = task.status === 'GOAL' ? 'green' : task.status === 'LIMIT' ? 'red' : 'purple';

      return {
        id: task.id,
        title: task.task_name,
        duration: task.duration,
        status: task.status,
        elapsed_time: newUpdatedElapsedTime,
        time: new Date(newUpdatedElapsedTime * 1000).toISOString().substr(11, 8),
        persistent_time: task.persistent_time || 0,
        isActive: activeTaskId === task.id,
        isPending,
        isComplete,
        progressColorScheme,
        progress,
        icon: task.icon || 'FaSun',
        iconBgColor: task.status === 'GOAL' ? 'green.500' : 'red.500',
      };
    });

    setTasks(updatedTasks);
  };

  const startTask = async (taskId) => {
    if (activeTaskId !== null && activeTaskId !== taskId) {
      stopTask(); // Stop the previous task if it's not the same as the current one
    }
  
    const task = tasks.find((task) => task.id === taskId);
  
    // Ensure task.elapsed_time is properly loaded and logged
    console.log(`Starting task with ID: ${taskId}`);
    console.log('Task Object:', task);
    console.log(`Loaded elapsed time in seconds from database: ${task?.elapsed_time}`);
  
    // Use the elapsed_time in seconds directly from the database
    let initialTimeInSeconds = task?.elapsed_time || 0;
  
    console.log(`Initial time in seconds (before start): ${initialTimeInSeconds}`);
  
    // Reset start_time to null when the task starts
    await supabase
      .from('tasks')
      .update({ start_time: null })
      .eq('id', taskId);
  
    setActiveTaskId(taskId);

 // Save task ID to local storage for potential visibility change handling
  localStorage.setItem('task_id', taskId);
  
    // Update taskListResetTime once when the task starts
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
            time: new Date(initialTimeInSeconds * 1000).toISOString().substr(11, 8), // Set the initial time directly
          };
        }
        return t;
      })
    );
  
    // Start counting from the elapsed time loaded from the database
    timerRef.current = setInterval(() => {
      initialTimeInSeconds += 1; // Increment the time by 1 second
  
      const newTimeString = new Date(initialTimeInSeconds * 1000).toISOString().substr(11, 8);
  
      console.log(`Task ID ${task.id}: New time string: ${newTimeString}`);
      console.log(`Initial time in seconds (after increment): ${initialTimeInSeconds}`);
  
      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (t.id === taskId) {
            return { ...t, time: newTimeString }; // Update task's time in the state
          }
          return t;
        })
      );
    }, 1000);
  };
  
   
  
  const stopTask = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current); // Stop the timer
    }
  
    const task = tasks.find(task => task.id === activeTaskId);
    if (task) {
      const [hours, minutes, seconds] = task.time.split(':').map(Number);
      const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  
      updateElapsedTimeInDatabase(activeTaskId, totalSeconds);
  
      // Forcefully set `isActive` to false and reset `activeTaskId`
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === activeTaskId ? { ...t, elapsed_time: totalSeconds, isActive: false, isPending: false} : t
        )
      );
  
      console.log(`Task ID ${activeTaskId} should now be inactive`);
      console.log(`Tasks state:`, tasks);
      
      setActiveTaskId(null);
      console.log("Task stopped. activeTaskId is now:", null);
      
    }
  };

  const upgradedStopTask = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current); // Stop the timer
    }
  
    const task = tasks.find(task => task.id === activeTaskId);
    if (task) {
      const [hours, minutes, seconds] = task.time.split(':').map(Number);
      const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  
      updateElapsedTimeInDatabase(activeTaskId, totalSeconds);
  
      // Forcefully set `isActive` to false and reset `activeTaskId`
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === activeTaskId ? { ...t, elapsed_time: totalSeconds, isActive: false, isPending: false } : t
        )
      );
  
      console.log(`Task ID ${activeTaskId} should now be inactive`);
      console.log(`Tasks state:`, tasks);
  
      setActiveTaskId(null);
      console.log("Task stopped. activeTaskId is now:", null);
  
      // Remove the task ID from localStorage
      localStorage.removeItem('task_id');
    }
  };
  
  
  
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const taskId = localStorage.getItem('task_id');
        console.log(`Visibility change detected. Task ID from localStorage: ${taskId}`);
  
        if (taskId) {
          // Fetch the current task to check start_time
          const { data: task, error } = await supabase
            .from('tasks')
            .select('start_time')
            .eq('id', taskId)
            .single();
  
          if (error) {
            console.error('Error fetching task:', error);
            return;
          }
  
          if (!task.start_time) {
            console.log(`No start_time found for task ID ${taskId}. Updating now...`);
  
            const timestamp = new Date().toISOString();
            const { error: updateError } = await supabase
              .from('tasks')
              .update({ start_time: timestamp })
              .eq('id', taskId);
  
            if (updateError) {
              console.error('Error updating start_time:', updateError);
              return;
            }
  
            console.log(`start_time for task ID ${taskId} updated to ${timestamp}`);
          }
  
          stopTask(); // Stop the task and update the elapsed_time and UI state
        }
      } else {
        // This block handles when the user comes back
        const taskId = localStorage.getItem('task_id');
        if (taskId) {
          await fetchTaskss(); // Refetch tasks to ensure UI updates based on start_time
        }
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
  
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopTask, startTask, activeTaskId]);
  
  
  
  
  
  
  
  const updateElapsedTimeInDatabase = async (taskId, elapsedTime) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          elapsed_time: elapsedTime,
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
    if (activeTaskId !== null) {
      timerRef.current = setInterval(() => {
        setTasks((prevTasks) =>
          prevTasks.map((task) => {
            if (task.id === activeTaskId) {
              const [hours, minutes, seconds] = taskListResetTime[task.id]?.split(':').map(Number) || [0, 0, 0];
              const totalSeconds = (hours * 3600) + (minutes * 60) + (seconds || 0) + 1;

              if (!isNaN(totalSeconds)) {
                const newTimeString = new Date(totalSeconds * 1000).toISOString().substr(11, 8);

                setTaskListResetTime((prevTimes) => ({
                  ...prevTimes,
                  [task.id]: newTimeString,
                }));

                const [persistHours, persistMinutes, persistSeconds] = summaryPersistentTime[task.id]?.split(':').map(Number) || [0, 0, 0];
                const totalPersistSeconds = (persistHours * 3600) + (persistMinutes * 60) + (persistSeconds || 0) + 1;
                if (!isNaN(totalPersistSeconds)) {
                  const newPersistTimeString = new Date(totalPersistSeconds * 1000).toISOString().substr(11, 8);
                  setSummaryPersistentTime((prevTimes) => ({
                    ...prevTimes,
                    [task.id]: newPersistTimeString,
                  }));
                }

                updateTimeInDatabase(task.id, 1);

                return { ...task, time: newTimeString };
              }
            }
            return task;
          })
        );

        const goalTasks = tasks.filter(task => task.status === 'GOAL');
        const totalGoalTime = goalTasks.reduce((acc, task) => acc + (task.status === 'GOAL' ? task.duration * 60 : 0), 0);
        const totalElapsed = goalTasks.reduce((acc, task) => {
          const [hours, minutes, seconds] = taskListResetTime[task.id]?.split(':').map(Number) || [0, 0, 0];
          return acc + Math.min(hours * 3600 + minutes * 60 + seconds, task.duration * 60);
        }, 0);

        const currentProgress = totalGoalTime ? (totalElapsed / totalGoalTime) * 100 : 0;
        setOngoingProgress(currentProgress);

      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      clearInterval(timerRef.current);
      saveProgressData();  // Save progress when the component unmounts
    };
  }, [activeTaskId, tasks]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      saveProgressData();  // Save progress at regular intervals
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(intervalId); // Clear the interval on component unmount
  }, [ongoingProgress]);

  const updateTimeInDatabase = async (taskId, seconds, taskCompletion) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('elapsed_time')
        .eq('id', taskId)
        .single();
  
      if (error) {
        console.error('Error fetching task time:', error);
        return;
      }
  
      const currentElapsedTime = data.elapsed_time || 0;
      
      const currentTaskCompletion = data.task_completion || 0;
  
      const newElapsedTime = currentElapsedTime + seconds;
      
      const newTaskCompletion = taskCompletion !== undefined ? taskCompletion : currentTaskCompletion;
  
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          elapsed_time: newElapsedTime,
        
        })
        .eq('id', taskId);
  
      if (updateError) console.error('Error updating task time and completion:', updateError);
    } catch (err) {
      console.error('Error in updateTimeInDatabase:', err);
    }
  };
  

  const saveProgressData = async () => {
    try {
      if (!user || !user.id) {
        console.error("User ID is null or undefined, skipping saveProgressData.");
        return;
      }
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
        const elapsedTime = task.elapsed_time || 0;
        const persistentTime = task.persistent_time || 0;
  
        const newPersistentTime = elapsedTime + persistentTime;
  
        if (task.status === 'GOAL' && elapsedTime >= task.duration * 60) {
          updateGoalCompletions(task.id);
        }
  
        const { error: updateError } = await supabase
          .from('tasks')
          .update({
            elapsed_time: 0, // Reset elapsed_time after completion
            persistent_time: newPersistentTime,
          })
          .eq('id', task.id);
  
        if (updateError) {
          console.error('Error updating persistent_time and resetting elapsed_time:', updateError);
        } else {
          console.log(`Task ID ${task.id} persistent_time updated to ${newPersistentTime} seconds`);
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
        isActive: false,
        elapsed_time: 0, // Reset elapsed_time in the state
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
      setGoalCompletions,
      fetchTaskss,
      upgradedStopTask
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => useContext(TimerContext);
