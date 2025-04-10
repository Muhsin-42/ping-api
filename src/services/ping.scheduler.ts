// services/pingScheduler.ts
import {IUrl} from "../models/urls.model";

type PingTask = {
  urlId: string;
  url: IUrl;
  intervalId: NodeJS.Timeout;
  pingFunction: (url: IUrl) => Promise<void>;
  nextPingTime: Date;
};

/**
 * Scheduler for managing URL pings across multiple users
 * Implements the Singleton pattern to ensure only one scheduler instance exists
 */
export class PingScheduler {
  private static instance: PingScheduler;
  private tasks: Map<string, PingTask>;

  private constructor() {
    this.tasks = new Map<string, PingTask>();
  }

  /**
   * Get the singleton instance of the PingScheduler
   */
  public static getInstance(): PingScheduler {
    if (!PingScheduler.instance) {
      PingScheduler.instance = new PingScheduler();
    }
    return PingScheduler.instance;
  }

  /**
   * Schedule a URL for periodic pinging
   */
  public scheduleUrl(
    url: IUrl,
    pingFunction: (url: IUrl) => Promise<void>
  ): void {
    const urlId = url._id.toString();

    // Cancel the existing task if it exists
    if (this.tasks.has(urlId)) {
      this.cancelUrl(urlId);
    }

    // Convert interval from minutes to milliseconds
    const intervalMs = url.interval * 60 * 1000;

    // Execute an immediate ping if the URL is active
    if (url.isActive) {
      pingFunction(url).catch((err) =>
        console.error(`Error during initial ping for ${url.url}:`, err)
      );
    }

    // Schedule periodic pings
    const intervalId = setInterval(async () => {
      if (url.isActive) {
        try {
          await pingFunction(url);

          // Update next ping time
          const task = this.tasks.get(urlId);
          if (task) {
            task.nextPingTime = new Date(Date.now() + intervalMs);
          }
        } catch (error) {
          console.error(`Error pinging ${url.url}:`, error);
        }
      }
    }, intervalMs);

    // Calculate next ping time
    const nextPingTime = new Date(Date.now() + intervalMs);

    // Store the task
    this.tasks.set(urlId, {
      urlId,
      url,
      intervalId,
      pingFunction,
      nextPingTime,
    });

    console.log(
      `Scheduled URL ${url.url} with interval ${url.interval} minutes`
    );
  }

  /**
   * Cancel a scheduled URL
   */
  public cancelUrl(urlId: string): void {
    const task = this.tasks.get(urlId);
    if (task) {
      clearInterval(task.intervalId);
      this.tasks.delete(urlId);
      console.log(`Cancelled URL ${task.url.url}`);
    }
  }

  /**
   * Get all scheduled URLs
   */
  public getScheduledUrls(): Array<{
    urlId: string;
    url: string;
    nextPingTime: Date;
  }> {
    const scheduledUrls = [];

    for (const [urlId, task] of this.tasks.entries()) {
      scheduledUrls.push({
        urlId,
        url: task.url.url,
        nextPingTime: task.nextPingTime,
      });
    }

    return scheduledUrls;
  }
}
