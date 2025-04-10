// models/url.model.ts
import mongoose, {Schema, Document} from "mongoose";

export interface IUrl extends Document {
  user: mongoose.Types.ObjectId;
  url: string;
  interval: number; // in minutes (minimum 5 minutes)
  daysOfWeek: number[]; // 0-6 (Sunday to Saturday)
  timeRange: {
    start: string; // HH:MM format (24 hour)
    end: string; // HH:MM format (24 hour)
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const urlSchema = new Schema<IUrl>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    interval: {
      type: Number,
      required: true,
      min: 5, // Minimum 5 minutes
    },
    daysOfWeek: {
      type: [Number],
      required: true,
      validate: {
        validator: function (days: number[]) {
          // Check if all values are between 0-6
          return days.every((day) => day >= 0 && day <= 6);
        },
        message: "Days of week must be between 0-6 (Sunday to Saturday)",
      },
    },
    timeRange: {
      start: {
        type: String,
        required: true,
        validate: {
          validator: function (time: string) {
            // Validate HH:MM format
            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
          },
          message: "Start time must be in HH:MM format",
        },
      },
      end: {
        type: String,
        required: true,
        validate: {
          validator: function (time: string) {
            // Validate HH:MM format
            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
          },
          message: "End time must be in HH:MM format",
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUrl>("Url", urlSchema);
