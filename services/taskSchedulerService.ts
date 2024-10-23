export interface Itask {
    running: boolean;
    callback: () => void;
  }
  
  export class TaskScheduler {
    private queue: Itask[] = [];
    private active: boolean = false;
  
    constructor() {
      this.startBackgroundTask();
    }
  
    addTask(task: Itask) {
      this.queue.push(task);
    }
  
    private processQueue() {
      if (this.active || this.queue.length === 0) {
        return false; // Indicate that no task was processed
      }
      this.active = true;
      const task = this.queue.shift();
      if (task) {
        task.running = true;
        task.callback();
        task.running = false;
        this.active = false;
      }
      return true; // Indicate that a task was processed
    }
  
    private startBackgroundTask() {
      const backgroundTask = () => {
        const didWork = this.processQueue();
        if (didWork) {
          // If a task was processed, check again immediately
          setImmediate(backgroundTask);
        } else {
          // If no task was processed, wait a bit before checking again to avoid tight looping
          setTimeout(backgroundTask, 100); // Check every 100ms
        }
      };
      backgroundTask(); // Start the background task
    }
  }