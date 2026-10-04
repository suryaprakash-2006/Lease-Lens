import mongoose from 'mongoose';

const leaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
      index: true
    },
    tenant: {
      name: {
        type: String,
        required: [true, 'Tenant name is required'],
        trim: true,
        minlength: [2, 'Tenant name must be at least 2 characters']
      },
      email: {
        type: String,
        required: [true, 'Tenant email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid tenant email address']
      },
      phone: {
        type: String,
        required: [true, 'Tenant phone number is required'],
        trim: true
      },
      occupantsCount: {
        type: Number,
        default: 1,
        min: [1, 'Occupants count must be at least 1']
      }
    },
    monthlyRent: {
      type: Number,
      required: [true, 'Monthly rent is required'],
      min: [0, 'Monthly rent cannot be negative']
    },
    securityDeposit: {
      type: Number,
      required: [true, 'Security deposit is required'],
      min: [0, 'Security deposit cannot be negative']
    },
    startDate: {
      type: Date,
      required: [true, 'Lease start date is required'],
      index: true
    },
    endDate: {
      type: Date,
      required: [true, 'Lease end date is required'],
      index: true
    },
    noticePeriodDays: {
      type: Number,
      default: 30,
      min: [0, 'Notice period cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Upcoming', 'Expired', 'Terminated'],
        message: '{VALUE} is not a valid lease status'
      },
      default: 'Upcoming',
      index: true
    },
    paymentDueDay: {
      type: Number,
      default: 1,
      min: [1, 'Payment due day must be between 1 and 31'],
      max: [31, 'Payment due day must be between 1 and 31']
    },
    importantTerms: [
      {
        type: String,
        trim: true
      }
    ],
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for user scoped filtering & property lifecycle queries
leaseSchema.index({ userId: 1, status: 1 });
leaseSchema.index({ propertyId: 1, status: 1 });

/**
 * Helper to compute lease status dynamically based on current date and explicit overrides
 */
leaseSchema.methods.computeStatus = function () {
  // If manually set to Terminated, status remains Terminated
  if (this.status === 'Terminated') {
    return 'Terminated';
  }

  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);

  // Set time of now to end of day or compare timestamps directly
  if (start > now) {
    return 'Upcoming';
  } else if (start <= now && end >= now) {
    return 'Active';
  } else {
    return 'Expired';
  }
};

const Lease = mongoose.model('Lease', leaseSchema);

export default Lease;
