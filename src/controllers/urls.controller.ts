// controllers/url.controller.ts
import {Context} from "hono";
import mongoose from "mongoose";
import Url from "../models/urls.model";
import {pingService} from "../services/ping.service";

// Add a new URL to be pinged
export const addUrl = async (c: Context) => {
  try {
    const userId = c.get("jwtPayload").id;
    const {url, interval, daysOfWeek, timeRange} = await c.req.json();

    // Validate required fields
    if (!url || !interval || !daysOfWeek || !timeRange) {
      return c.json({message: "All fields are required"}, 400);
    }

    // Validate minimum interval
    if (interval < 5) {
      return c.json({message: "Interval must be at least 5 minutes"}, 400);
    }

    // Validate days of week
    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return c.json(
        {message: "Days of week must be an array with at least one day"},
        400
      );
    }

    // Validate time range format
    if (!timeRange.start || !timeRange.end) {
      return c.json(
        {message: "Time range must include start and end times"},
        400
      );
    }

    // Create new URL
    const newUrl = await Url.create({
      user: new mongoose.Types.ObjectId(userId),
      url,
      interval,
      daysOfWeek,
      timeRange,
      isActive: true,
    });

    // Schedule the URL (this is now handled by Mongoose hooks but adding here for clarity)
    await pingService.scheduleUrl(newUrl);

    return c.json(
      {
        message: "URL added successfully",
        url: newUrl,
      },
      201
    );
  } catch (error) {
    console.error("Error adding URL:", error);
    return c.json(
      {message: "Failed to add URL", error: (error as Error).message},
      500
    );
  }
};

// Get all URLs for the authenticated user
export const getAllUrls = async (c: Context) => {
  try {
    const userId = c.get("jwtPayload").id;

    const urls = await Url.find({user: userId}).sort({createdAt: -1});

    return c.json({
      message: "URLs retrieved successfully",
      urls,
      count: urls.length,
    });
  } catch (error) {
    console.error("Error fetching URLs:", error);
    return c.json(
      {message: "Failed to fetch URLs", error: (error as Error).message},
      500
    );
  }
};

// Update an existing URL
export const updateUrl = async (c: Context) => {
  try {
    const userId = c.get("jwtPayload").id;
    const urlId = c.req.param("id");
    const {url, interval, daysOfWeek, timeRange, isActive} = await c.req.json();

    // Validate URL ID
    if (!mongoose.Types.ObjectId.isValid(urlId)) {
      return c.json({message: "Invalid URL ID"}, 400);
    }

    // Check if URL exists and belongs to the user
    const existingUrl = await Url.findOne({
      _id: urlId,
      user: userId,
    });

    if (!existingUrl) {
      return c.json(
        {message: "URL not found or you don't have permission to update it"},
        404
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (url) updateData.url = url;
    if (interval) {
      if (interval < 5) {
        return c.json({message: "Interval must be at least 5 minutes"}, 400);
      }
      updateData.interval = interval;
    }
    if (daysOfWeek) {
      if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
        return c.json(
          {message: "Days of week must be an array with at least one day"},
          400
        );
      }
      updateData.daysOfWeek = daysOfWeek;
    }
    if (timeRange) {
      if (!timeRange.start || !timeRange.end) {
        return c.json(
          {message: "Time range must include start and end times"},
          400
        );
      }
      updateData.timeRange = timeRange;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Update URL
    const updatedUrl = await Url.findByIdAndUpdate(urlId, updateData, {
      new: true,
      runValidators: true,
    });

    // Update the URL schedule
    // (This is now handled by Mongoose hooks but adding here for clarity)
    if (updatedUrl) {
      if (updatedUrl.isActive) {
        await pingService.updateUrlSchedule(updatedUrl);
      } else {
        await pingService.cancelUrl(urlId);
      }
    }

    return c.json({
      message: "URL updated successfully",
      url: updatedUrl,
    });
  } catch (error) {
    console.error("Error updating URL:", error);
    return c.json(
      {message: "Failed to update URL", error: (error as Error).message},
      500
    );
  }
};

// Delete a URL
export const deleteUrl = async (c: Context) => {
  try {
    const userId = c.get("jwtPayload").id;
    const urlId = c.req.param("id");

    // Validate URL ID
    if (!mongoose.Types.ObjectId.isValid(urlId)) {
      return c.json({message: "Invalid URL ID"}, 400);
    }

    // Check if URL exists and belongs to the user
    const url = await Url.findOne({
      _id: urlId,
      user: userId,
    });

    if (!url) {
      return c.json(
        {message: "URL not found or you don't have permission to delete it"},
        404
      );
    }

    // Delete URL
    await Url.findByIdAndDelete(urlId);

    // Cancel the URL schedule
    // (This is now handled by Mongoose hooks but adding here for clarity)
    await pingService.cancelUrl(urlId);

    return c.json({
      message: "URL deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting URL:", error);
    return c.json(
      {message: "Failed to delete URL", error: (error as Error).message},
      500
    );
  }
};
