import { TreeService } from "./treeService";
import { TaskScheduler } from "./taskSchedulerService";

/**
 * Interface for services.
 * Key is the name of the service, value is its type.
 * Every services available in the app must be declared in this interface
 */
export interface Iservices {
  tree: TreeService,
  taskScheduler: TaskScheduler
}

export let services: Partial<Iservices> = {};

/**
 * Adds a new service to the services object if it matches the interface.
 * @param name - The name of the service. This is used to index the service in the services object.
 * @param newService - The constructor function for the service.
 * @param dependencies - The dependencies for the service.
 * 
 * @example
 * // Adding a TaskScheduler service
 * addService('scheduler', TaskScheduler);
 * 
 * // Adding a chatService with a PrismaClient dependency
 * const prisma = new PrismaClient();
 * addService('chat', chatService, prisma);
 * 
 * // Using the added services
 * services.scheduler?.addTask({ running: false, callback: () => console.log("Task executed") });
 * services.chat?.getMessages(1).then(messages => console.log(messages));
 */
export function addService<T extends keyof Iservices>(name: T, newService: new (...args: any[]) => Iservices[T], ...dependencies: any[]): void {
  if (dependencies.length)
    services[name] = new newService(...dependencies);
  else
    services[name] = new newService();
}