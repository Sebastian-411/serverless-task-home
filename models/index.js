/**
 * Models Index
 * Exports all data models, constants, and utilities with organized structure
 */

// Core Entities
const User = require('./entities/User');
const Task = require('./entities/Task');
const Address = require('./entities/Address');

// Base Classes & Utilities
const BaseModel = require('./base/BaseModel');
const ValidationError = require('./validators/ValidationError');

// Constants & Configurations
const constants = require('./utils/constants');

module.exports = {
  // === ENTITIES ===
  User,
  Task,
  Address,
  
  // === BASE CLASSES ===
  BaseModel,
  
  // === VALIDATORS ===
  ValidationError,
  
  // === CONSTANTS ===
  ...constants,
  
  // === GROUPED EXPORTS ===
  entities: {
    User,
    Task,
    Address
  },
  
  base: {
    BaseModel
  },
  
  validators: {
    ValidationError
  },
  
  utils: {
    constants
  }
}; 