// models/pingHistory.model.ts
import mongoose, {Schema, Document} from "mongoose";

export interface IPingHistory extends Document {
  url: mongoose.Types.ObjectId; // Reference to the URL document
  user: mongoose.Types.ObjectId; // Reference to the User document
  timestamp: Date; // When the ping was executed
  status: number; // HTTP status code
  responseTime: number; // Response time in ms
  success: boolean; // Whether the ping was successful
  error?: string; // Error message if any
}

const pingHistorySchema = new Schema<IPingHistory>(
  {
    url: {
      type: Schema.Types.ObjectId,
      ref: "Url",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: Number,
      required: true,
    },
    responseTime: {
      type: Number,
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    error: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index to optimize queries for URL history
pingHistorySchema.index({url: 1, timestamp: -1});
// Index to optimize queries for user history
pingHistorySchema.index({user: 1, timestamp: -1});

export default mongoose.model<IPingHistory>("PingHistory", pingHistorySchema);
