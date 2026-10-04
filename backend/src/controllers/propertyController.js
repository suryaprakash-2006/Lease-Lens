import * as propertyService from '../services/propertyService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * @route   GET /api/v1/properties
 * @desc    Get all properties for authenticated user with filters
 * @access  Private
 */
export const getProperties = async (req, res, next) => {
  try {
    const result = await propertyService.getProperties(req.user._id, req.query);
    return sendSuccess(res, result, 200, 'Properties retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/properties
 * @desc    Create a new property
 * @access  Private
 */
export const createProperty = async (req, res, next) => {
  try {
    const property = await propertyService.createProperty(req.user._id, req.body);
    return sendSuccess(res, property, 201, 'Property created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/properties/:id
 * @desc    Get single property details by ID
 * @access  Private
 */
export const getPropertyById = async (req, res, next) => {
  try {
    const data = await propertyService.getPropertyById(req.user._id, req.params.id);
    return sendSuccess(res, data, 200, 'Property details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/properties/:id
 * @desc    Update property details
 * @access  Private
 */
export const updateProperty = async (req, res, next) => {
  try {
    const property = await propertyService.updateProperty(req.user._id, req.params.id, req.body);
    return sendSuccess(res, property, 200, 'Property updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/properties/:id
 * @desc    Delete property
 * @access  Private
 */
export const deleteProperty = async (req, res, next) => {
  try {
    const result = await propertyService.deleteProperty(req.user._id, req.params.id);
    return sendSuccess(res, result, 200, 'Property deleted successfully');
  } catch (error) {
    next(error);
  }
};
