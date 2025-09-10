/**
 * Centralized Resource Management System
 * 
 * This module provides centralized tracking and cleanup of resources like timers,
 * intervals, and components to prevent memory leaks and hanging processes in tests.
 */

/**
 * Interface for components that can be destroyed
 */
export interface Destroyable {
  destroy(): void;
}

/**
 * Generic event listener function type
 */
type EventListenerFunction = (...args: any[]) => void;

/**
 * Generic event target interface (compatible with both DOM and Node.js)
 */
interface GenericEventTarget {
  addEventListener?(type: string, listener: EventListenerFunction, options?: any): void;
  removeEventListener?(type: string, listener: EventListenerFunction, options?: any): void;
  on?(event: string, listener: EventListenerFunction): void;
  off?(event: string, listener: EventListenerFunction): void;
}

/**
 * Resource tracking interface
 */
interface ResourceTracker {
  timers: Set<NodeJS.Timeout>;
  intervals: Set<NodeJS.Timeout>;
  components: Set<Destroyable>;
  eventListeners: Set<{ target: GenericEventTarget; type: string; listener: EventListenerFunction }>;
}

/**
 * Centralized resource manager for tracking and cleaning up resources
 * Singleton pattern ensures global resource tracking across the application
 */
export class ResourceManager {
  private static instance: ResourceManager;
  private resources: ResourceTracker;
  private isDestroyed: boolean = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.resources = {
      timers: new Set(),
      intervals: new Set(),
      components: new Set(),
      eventListeners: new Set(),
    };
  }

  /**
   * Get the singleton instance of ResourceManager
   * @returns The ResourceManager instance
   */
  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * Register a timer for tracking and cleanup
   * @param timer - Timer to register
   * @returns The timer (for chaining)
   */
  public registerTimer(timer: NodeJS.Timeout): NodeJS.Timeout {
    if (!this.isDestroyed) {
      this.resources.timers.add(timer);
    }
    return timer;
  }

  /**
   * Register an interval for tracking and cleanup
   * @param interval - Interval to register
   * @returns The interval (for chaining)
   */
  public registerInterval(interval: NodeJS.Timeout): NodeJS.Timeout {
    if (!this.isDestroyed) {
      this.resources.intervals.add(interval);
    }
    return interval;
  }

  /**
   * Register a component for tracking and cleanup
   * @param component - Component with destroy method to register
   * @returns The component (for chaining)
   */
  public registerComponent<T extends Destroyable>(component: T): T {
    if (!this.isDestroyed) {
      this.resources.components.add(component);
    }
    return component;
  }

  /**
   * Register an event listener for tracking and cleanup
   * @param target - Event target
   * @param type - Event type
   * @param listener - Event listener function
   */
  public registerEventListener(
    target: GenericEventTarget,
    type: string,
    listener: EventListenerFunction
  ): void {
    if (!this.isDestroyed) {
      this.resources.eventListeners.add({ target, type, listener });
    }
  }

  /**
   * Unregister a timer from tracking
   * @param timer - Timer to unregister
   */
  public unregisterTimer(timer: NodeJS.Timeout): void {
    this.resources.timers.delete(timer);
  }

  /**
   * Unregister an interval from tracking
   * @param interval - Interval to unregister
   */
  public unregisterInterval(interval: NodeJS.Timeout): void {
    this.resources.intervals.delete(interval);
  }

  /**
   * Unregister a component from tracking
   * @param component - Component to unregister
   */
  public unregisterComponent(component: Destroyable): void {
    this.resources.components.delete(component);
  }

  /**
   * Unregister an event listener from tracking
   * @param target - Event target
   * @param type - Event type
   * @param listener - Event listener function
   */
  public unregisterEventListener(
    target: GenericEventTarget,
    type: string,
    listener: EventListenerFunction
  ): void {
    const toRemove = Array.from(this.resources.eventListeners).find(
      item => item.target === target && item.type === type && item.listener === listener
    );
    if (toRemove) {
      this.resources.eventListeners.delete(toRemove);
    }
  }

  /**
   * Get current resource counts for monitoring
   * @returns Object with counts of each resource type
   */
  public getResourceCounts(): {
    timers: number;
    intervals: number;
    components: number;
    eventListeners: number;
    total: number;
  } {
    return {
      timers: this.resources.timers.size,
      intervals: this.resources.intervals.size,
      components: this.resources.components.size,
      eventListeners: this.resources.eventListeners.size,
      total:
        this.resources.timers.size +
        this.resources.intervals.size +
        this.resources.components.size +
        this.resources.eventListeners.size,
    };
  }

  /**
   * Check if there are any active resources
   * @returns True if any resources are being tracked
   */
  public hasActiveResources(): boolean {
    const counts = this.getResourceCounts();
    return counts.total > 0;
  }

  /**
   * Clean up all tracked resources
   * This method should be called during application shutdown or test cleanup
   */
  public cleanup(): void {
    if (this.isDestroyed) {
      return;
    }

    // Clear all timers
    this.resources.timers.forEach(timer => {
      try {
        clearTimeout(timer);
      } catch (error) {
        console.warn('Error clearing timer:', error);
      }
    });
    this.resources.timers.clear();

    // Clear all intervals
    this.resources.intervals.forEach(interval => {
      try {
        clearInterval(interval);
      } catch (error) {
        console.warn('Error clearing interval:', error);
      }
    });
    this.resources.intervals.clear();

    // Destroy all components
    this.resources.components.forEach(component => {
      try {
        component.destroy();
      } catch (error) {
        console.warn('Error destroying component:', error);
      }
    });
    this.resources.components.clear();

    // Remove all event listeners
    this.resources.eventListeners.forEach(({ target, type, listener }) => {
      try {
        if (target.removeEventListener) {
          target.removeEventListener(type, listener);
        } else if (target.off) {
          target.off(type, listener);
        }
      } catch (error) {
        console.warn('Error removing event listener:', error);
      }
    });
    this.resources.eventListeners.clear();
  }

  /**
   * Destroy the resource manager and clean up all resources
   * After calling this method, the resource manager cannot be used again
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.cleanup();
    this.isDestroyed = true;
    ResourceManager.instance = undefined as any;
  }

  /**
   * Reset the resource manager (primarily for testing)
   * Cleans up all resources and resets the state
   */
  public reset(): void {
    this.cleanup();
    this.isDestroyed = false;
  }

  /**
   * Create a scoped resource manager for temporary resource tracking
   * Useful for tracking resources within a specific operation or test
   * @returns A scoped resource manager
   */
  public createScope(): ScopedResourceManager {
    return new ScopedResourceManager(this);
  }
}

/**
 * Scoped resource manager for temporary resource tracking
 * Automatically cleans up resources when disposed
 */
export class ScopedResourceManager implements Destroyable {
  private parent: ResourceManager;
  private scopedResources: ResourceTracker;
  private isDisposed: boolean = false;

  /**
   * Creates a new scoped resource manager
   * @param parent - Parent resource manager
   */
  constructor(parent: ResourceManager) {
    this.parent = parent;
    this.scopedResources = {
      timers: new Set(),
      intervals: new Set(),
      components: new Set(),
      eventListeners: new Set(),
    };
  }

  /**
   * Register a timer in this scope
   * @param timer - Timer to register
   * @returns The timer (for chaining)
   */
  public registerTimer(timer: NodeJS.Timeout): NodeJS.Timeout {
    if (!this.isDisposed) {
      this.scopedResources.timers.add(timer);
      this.parent.registerTimer(timer);
    }
    return timer;
  }

  /**
   * Register an interval in this scope
   * @param interval - Interval to register
   * @returns The interval (for chaining)
   */
  public registerInterval(interval: NodeJS.Timeout): NodeJS.Timeout {
    if (!this.isDisposed) {
      this.scopedResources.intervals.add(interval);
      this.parent.registerInterval(interval);
    }
    return interval;
  }

  /**
   * Register a component in this scope
   * @param component - Component to register
   * @returns The component (for chaining)
   */
  public registerComponent<T extends Destroyable>(component: T): T {
    if (!this.isDisposed) {
      this.scopedResources.components.add(component);
      this.parent.registerComponent(component);
    }
    return component;
  }

  /**
   * Register an event listener in this scope
   * @param target - Event target
   * @param type - Event type
   * @param listener - Event listener function
   */
  public registerEventListener(
    target: GenericEventTarget,
    type: string,
    listener: EventListenerFunction
  ): void {
    if (!this.isDisposed) {
      const item = { target, type, listener };
      this.scopedResources.eventListeners.add(item);
      this.parent.registerEventListener(target, type, listener);
    }
  }

  /**
   * Clean up all resources in this scope
   */
  public cleanup(): void {
    if (this.isDisposed) {
      return;
    }

    // Unregister and clean up scoped resources
    this.scopedResources.timers.forEach(timer => {
      this.parent.unregisterTimer(timer);
      clearTimeout(timer);
    });

    this.scopedResources.intervals.forEach(interval => {
      this.parent.unregisterInterval(interval);
      clearInterval(interval);
    });

    this.scopedResources.components.forEach(component => {
      this.parent.unregisterComponent(component);
      component.destroy();
    });

    this.scopedResources.eventListeners.forEach(({ target, type, listener }) => {
      this.parent.unregisterEventListener(target, type, listener);
      if (target.removeEventListener) {
        target.removeEventListener(type, listener);
      } else if (target.off) {
        target.off(type, listener);
      }
    });

    // Clear scoped collections
    this.scopedResources.timers.clear();
    this.scopedResources.intervals.clear();
    this.scopedResources.components.clear();
    this.scopedResources.eventListeners.clear();
  }

  /**
   * Dispose of this scoped resource manager
   * Alias for cleanup() to match Destroyable interface
   */
  public destroy(): void {
    this.cleanup();
    this.isDisposed = true;
  }

  /**
   * Get resource counts for this scope
   * @returns Object with counts of each resource type in this scope
   */
  public getResourceCounts(): {
    timers: number;
    intervals: number;
    components: number;
    eventListeners: number;
    total: number;
  } {
    return {
      timers: this.scopedResources.timers.size,
      intervals: this.scopedResources.intervals.size,
      components: this.scopedResources.components.size,
      eventListeners: this.scopedResources.eventListeners.size,
      total:
        this.scopedResources.timers.size +
        this.scopedResources.intervals.size +
        this.scopedResources.components.size +
        this.scopedResources.eventListeners.size,
    };
  }
}

/**
 * Utility functions for resource management
 */
export class ResourceUtils {
  /**
   * Create a managed setTimeout that automatically registers with ResourceManager
   * @param callback - Function to execute
   * @param delay - Delay in milliseconds
   * @returns Timer handle
   */
  public static setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(callback, delay);
    ResourceManager.getInstance().registerTimer(timer);
    return timer;
  }

  /**
   * Create a managed setInterval that automatically registers with ResourceManager
   * @param callback - Function to execute
   * @param interval - Interval in milliseconds
   * @returns Interval handle
   */
  public static setInterval(callback: () => void, interval: number): NodeJS.Timeout {
    const intervalHandle = setInterval(callback, interval);
    ResourceManager.getInstance().registerInterval(intervalHandle);
    return intervalHandle;
  }

  /**
   * Clear a timeout and unregister it from ResourceManager
   * @param timer - Timer to clear
   */
  public static clearTimeout(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    ResourceManager.getInstance().unregisterTimer(timer);
  }

  /**
   * Clear an interval and unregister it from ResourceManager
   * @param interval - Interval to clear
   */
  public static clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    ResourceManager.getInstance().unregisterInterval(interval);
  }

  /**
   * Add an event listener and register it with ResourceManager
   * @param target - Event target
   * @param type - Event type
   * @param listener - Event listener function
   * @param options - Event listener options
   */
  public static addEventListener(
    target: GenericEventTarget,
    type: string,
    listener: EventListenerFunction,
    options?: any
  ): void {
    if (target.addEventListener) {
      target.addEventListener(type, listener, options);
    } else if (target.on) {
      target.on(type, listener);
    }
    ResourceManager.getInstance().registerEventListener(target, type, listener);
  }

  /**
   * Remove an event listener and unregister it from ResourceManager
   * @param target - Event target
   * @param type - Event type
   * @param listener - Event listener function
   * @param options - Event listener options
   */
  public static removeEventListener(
    target: GenericEventTarget,
    type: string,
    listener: EventListenerFunction,
    options?: any
  ): void {
    if (target.removeEventListener) {
      target.removeEventListener(type, listener, options);
    } else if (target.off) {
      target.off(type, listener);
    }
    ResourceManager.getInstance().unregisterEventListener(target, type, listener);
  }
}

// Export singleton instance for convenience
export const resourceManager = ResourceManager.getInstance();