import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    propertyType: {
      type: String,
      enum: {
        values: ['Apartment', 'Independent House', 'Villa', 'Studio', 'Commercial', 'Other'],
        message: '{VALUE} is not a valid property type'
      },
      default: 'Apartment'
    },
    address: {
      street: { type: String, trim: true, default: '' },
      locality: { type: String, required: [true, 'Locality is required'], trim: true },
      city: { type: String, required: [true, 'City is required'], trim: true },
      state: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' }
    },
    bhk: {
      type: Number,
      required: [true, 'BHK count is required'],
      min: [1, 'BHK must be at least 1']
    },
    areaSqFt: {
      type: Number,
      required: [true, 'Area in sq ft is required'],
      min: [50, 'Area must be at least 50 sq ft']
    },
    bedrooms: {
      type: Number,
      required: [true, 'Bedrooms count is required'],
      min: [1, 'Bedrooms must be at least 1']
    },
    bathrooms: {
      type: Number,
      required: [true, 'Bathrooms count is required'],
      min: [1, 'Bathrooms must be at least 1']
    },
    furnishingStatus: {
      type: String,
      enum: {
        values: ['Furnished', 'Semi-Furnished', 'Unfurnished'],
        message: '{VALUE} is not a valid furnishing status'
      },
      default: 'Semi-Furnished'
    },
    parking: {
      type: Boolean,
      default: false
    },
    amenities: [
      {
        type: String,
        trim: true
      }
    ],
    description: {
      type: String,
      trim: true,
      default: ''
    },
    listedRent: {
      type: Number,
      required: [true, 'Listed rent is required'],
      min: [0, 'Listed rent cannot be negative']
    },
    status: {
      type: String,
      enum: {
        values: ['Available', 'Rented', 'Under Maintenance'],
        message: '{VALUE} is not a valid property status'
      },
      default: 'Available',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for querying user properties filtered by status
propertySchema.index({ userId: 1, status: 1 });

// Text index for search functionality across title, locality, and city
propertySchema.index({
  title: 'text',
  'address.locality': 'text',
  'address.city': 'text'
});

const Property = mongoose.model('Property', propertySchema);

export default Property;
