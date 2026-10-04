import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
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
      default: null,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    category: {
      type: String,
      enum: {
        values: ['Maintenance', 'Electricity', 'Water', 'Internet', 'Repairs', 'Taxes', 'Other', 'Rent'],
        message: '{VALUE} is not a valid expense category'
      },
      required: [true, 'Expense category is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Expense amount cannot be negative']
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
      index: true
    },
    isRecurringMonthly: {
      type: Boolean,
      default: false
    },
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

// Compound indexes for user scoped filtering and time-series aggregation
expenseSchema.index({ userId: 1, expenseDate: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, propertyId: 1, expenseDate: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
