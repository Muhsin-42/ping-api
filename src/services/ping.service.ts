// services/pingService.ts
// import fetch from "node-fetch";
import axios from "axios";
import Url, {IUrl} from "../models/urls.model";
import PingHistory from "../models/pinghistory.model";
import {PingScheduler} from "./ping.scheduler";

export class PingService {
  private scheduler: PingScheduler;

  constructor() {
    this.scheduler = PingScheduler.getInstance();
  }

  /**
   * Initialize the ping service by loading all active URLs from the database
   * and scheduling them
   */
  public async initialize(): Promise<void> {
    try {
      console.log("Initializing ping service...");
      const activeUrls = await Url.find({isActive: true});
      console.log(`Found ${activeUrls.length} active URLs to schedule`);

      for (const url of activeUrls) {
        await this.scheduleUrl(url);
      }
    } catch (error) {
      console.error("Error initializing ping service:", error);
    }
  }

  /**
   * Schedule a URL for pinging
   */
  public async scheduleUrl(url: IUrl): Promise<void> {
    this.scheduler.scheduleUrl(url, this.pingUrl.bind(this));
  }

  /**
   * Update a URL's schedule
   */
  public async updateUrlSchedule(url: IUrl): Promise<void> {
    this.scheduler.cancelUrl(url?._id?.toString());
    this.scheduler.scheduleUrl(url, this.pingUrl.bind(this));
  }

  /**
   * Cancel a URL from the schedule
   */
  public async cancelUrl(urlId: string): Promise<void> {
    this.scheduler.cancelUrl(urlId);
  }

  /**
   * Execute a ping for the given URL and store the result
   */
  private async pingUrl(url: IUrl): Promise<void> {
    const startTime = Date.now();
    let success = false;
    let status = 0;
    let error = "";

    try {
      // Check if the URL should be pinged at the current time
      if (!this.shouldPingNow(url)) {
        return;
      }

      // Execute the ping
      const response = await axios.get(url.url, {
        timeout: 10000, // 10 second timeout
      });

      status = response.status;
      success = response.status === 200;
    } catch (err) {
      error = (err as Error).message || "Ping failed";
      console.error(`Error pinging ${url.url}:`, err);
    } finally {
      const responseTime = Date.now() - startTime;

      // Store the ping history
      try {
        await PingHistory.create({
          url: url._id,
          user: url.user,
          timestamp: new Date(),
          status,
          responseTime,
          success,
          error: error || undefined,
        });
      } catch (err) {
        console.error("Error storing ping history:", err);
      }
    }
  }

  /**
   * Check if a URL should be pinged at the current time based on its time range and days of week
   */
  private shouldPingNow(url: IUrl): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0-6, starting with Sunday

    // Check if current day is in the allowed days
    if (!url.daysOfWeek.includes(dayOfWeek)) {
      return false;
    }

    // Parse time range
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const startTime = url.timeRange.start;
    const endTime = url.timeRange.end;

    // Check if current time is within the allowed time range
    return currentTime >= startTime && currentTime <= endTime;
  }
}

// Export a singleton instance
export const pingService = new PingService();
