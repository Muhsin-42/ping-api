import {Context} from "hono";
import mongoose from "mongoose";
import PingHistory from "../models/pinghistory.model";
import Url from "../models/urls.model";

// Get ping history for a specific URL
export const getUrlPingHistory = async (c: Context) => {
  try {
    const userId = c.get("jwtPayload").id;
    const urlId = c.req.param("id");

    // Validate URL ID
    if (!mongoose.Types.ObjectId.isValid(urlId)) {
      return c.json({message: "Invalid URL ID"}, 400);
    }

    // Verify URL belongs to user
    const url = await Url.findOne({_id: urlId, user: userId});
    if (!url) {
      return c.json(
        {message: "URL not found or you don't have permission to access it"},
        404
      );
    }

    // Pagination parameters
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const skip = (page - 1) * limit;

    // Get ping history
    const pingHistory = await PingHistory.find({url: urlId})
      .sort({timestamp: -1})
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await PingHistory.countDocuments({url: urlId});

    return c.json({
      message: "Ping history retrieved successfully",
      history: pingHistory,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching ping history:", error);
    return c.json(
      {
        message: "Failed to fetch ping history",
        error: (error as Error).message,
      },
      500
    );
  }
};

// Get all ping history for the user
export const getAllPingHistory = async (c: Context) => {
  try {
    const userId = c.get("jwtPayload").id;

    // Pagination parameters
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const skip = (page - 1) * limit;

    // Date filters
    const startDate = c.req.query("startDate")
      ? new Date(c.req.query("startDate"))
      : undefined;
    const endDate = c.req.query("endDate")
      ? new Date(c.req.query("endDate"))
      : undefined;

    // Build query
    const query: any = {user: userId};

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    // Get ping history
    const pingHistory = await PingHistory.find(query)
      .sort({timestamp: -1})
      .skip(skip)
      .limit(limit)
      .populate({
        path: "url",
        select: "url interval",
      });

    // Get total count
    const total = await PingHistory.countDocuments(query);

    return c.json({
      message: "Ping history retrieved successfully",
      history: pingHistory,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching ping history:", error);
    return c.json(
      {
        message: "Failed to fetch ping history",
        error: (error as Error).message,
      },
      500
    );
  }
};

// Get ping stats for a URL
export const getUrlPingStats = async (c: Context) => {
  try {
    const userId = c.get("jwtPayload").id;
    const urlId = c.req.param("id");

    // Validate URL ID
    if (!mongoose.Types.ObjectId.isValid(urlId)) {
      return c.json({message: "Invalid URL ID"}, 400);
    }

    // Verify URL belongs to user
    const url = await Url.findOne({_id: urlId, user: userId});
    if (!url) {
      return c.json(
        {message: "URL not found or you don't have permission to access it"},
        404
      );
    }

    // Get ping statistics
    const totalPings = await PingHistory.countDocuments({url: urlId});
    const successfulPings = await PingHistory.countDocuments({
      url: urlId,
      success: true,
    });
    const failedPings = await PingHistory.countDocuments({
      url: urlId,
      success: false,
    });

    // Get average response time for successful pings
    const avgResponseTimeResult = await PingHistory.aggregate([
      {$match: {url: new mongoose.Types.ObjectId(urlId), success: true}},
      {$group: {_id: null, avgResponseTime: {$avg: "$responseTime"}}},
    ]);

    const avgResponseTime =
      avgResponseTimeResult.length > 0
        ? Math.round(avgResponseTimeResult[0].avgResponseTime)
        : 0;

    // Get latest ping
    const latestPing = await PingHistory.findOne({url: urlId})
      .sort({timestamp: -1})
      .limit(1);

    return c.json({
      message: "Ping statistics retrieved successfully",
      stats: {
        totalPings,
        successfulPings,
        failedPings,
        successRate: totalPings > 0 ? (successfulPings / totalPings) * 100 : 0,
        avgResponseTime,
        latestPing,
      },
    });
  } catch (error) {
    console.error("Error fetching ping statistics:", error);
    return c.json(
      {
        message: "Failed to fetch ping statistics",
        error: (error as Error).message,
      },
      500
    );
  }
};
