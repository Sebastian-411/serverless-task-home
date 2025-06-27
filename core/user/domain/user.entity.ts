/**
 * User Entity
 * Data model for system users with complete validation and business logic
 */

const BaseEntity = require('../../../shared/domain/base.entity');
const ValidationError = require('../../../shared/domain/exceptions/validation.error');
const { USER_ROLES, VALIDATION_RULES } = require('../../../shared/domain/value-objects/constants');
const Address = require('./address.entity');

class User extends BaseEntity {
  constructor({
    id,
    name,
    email,
    phoneNumber,
    address,
    role,
    createdAt,
    updatedAt
  }) {
    super();
    
    // Validate and set properties
    this._setId(id);
    this._setName(name);
    this._setEmail(email);
    this._setPhoneNumber(phoneNumber);
    this._setAddress(address);
    this._setRole(role);
    this._setTimestamps(createdAt, updatedAt);
  }

  /**
   * Factory method to create a new user with auto-generated ID and timestamps
   * @param {Object} userData - User data without id, createdAt, updatedAt
   * @returns {User}
   */
  static create(userData) {
    const timestamps = BaseEntity.createTimestamps();
    return new User({
      id: BaseEntity.generateId(),
      ...userData,
      ...timestamps
    });
  }

  /**
   * Factory method to create user from existing data
   * @param {Object} userData - Complete user data
   * @returns {User}
   */
  static fromObject(userData) {
    return new User(userData);
  }

  /**
   * Sets and validates user ID
   * @private
   * @param {string} id - User ID
   */
  _setId(id) {
    this._validateUUID(id, 'id');
    this.id = id;
  }

  /**
   * Sets and validates user name
   * @private
   * @param {string} name - User name
   */
  _setName(name) {
    this._validateRequired(name, 'name');
    this._validateLength(name.trim(), VALIDATION_RULES.USER.NAME_MIN_LENGTH, VALIDATION_RULES.USER.NAME_MAX_LENGTH, 'name');
    this.name = name.trim();
  }

  /**
   * Sets and validates user email
   * @private
   * @param {string} email - User email
   */
  _setEmail(email) {
    this._validateEmail(email, 'email');
    this._validateLength(email, 1, VALIDATION_RULES.USER.EMAIL_MAX_LENGTH, 'email');
    this.email = email.toLowerCase().trim();
  }

  /**
   * Sets and validates phone number
   * @private
   * @param {string} phoneNumber - Phone number
   */
  _setPhoneNumber(phoneNumber) {
    this._validatePhone(phoneNumber, 'phoneNumber');
    this.phoneNumber = phoneNumber.trim();
  }

  /**
   * Sets and validates address
   * @private
   * @param {Object|Address} address - Address object or Address instance
   */
  _setAddress(address) {
    if (!address) {
      this.address = null;
      return;
    }

    if (address instanceof Address) {
      this.address = address;
    } else if (typeof address === 'object') {
      this.address = Address.create(address);
    } else {
      throw ValidationError.invalidFormat('address', 'object or Address instance', address);
    }
  }

  /**
   * Sets and validates user role
   * @private
   * @param {string} role - User role
   */
  _setRole(role) {
    this._validateEnum(role, Object.values(USER_ROLES), 'role');
    this.role = role;
  }

  /**
   * Sets and validates timestamps
   * @private
   * @param {string} createdAt - Creation timestamp
   * @param {string} updatedAt - Update timestamp
   */
  _setTimestamps(createdAt, updatedAt) {
    this._validateTimestamp(createdAt, 'createdAt');
    this._validateTimestamp(updatedAt, 'updatedAt');
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Validates the entire user model
   */
  validate() {
    // All validation is done in setters
    return true;
  }

  /**
   * Checks if user is an administrator
   * @returns {boolean}
   */
  isAdmin() {
    return this.role === USER_ROLES.ADMIN;
  }

  /**
   * Checks if user is a regular user
   * @returns {boolean}
   */
  isRegularUser() {
    return this.role === USER_ROLES.USER;
  }

  /**
   * Gets user's full address as formatted string
   * @returns {string}
   */
  getFormattedAddress() {
    if (!this.address) {
      return 'No address provided';
    }
    return this.address.getShippingFormat();
  }

  /**
   * Updates user information
   * @param {Object} updates - Fields to update
   * @returns {User}
   */
  update(updates) {
    const allowedFields = ['name', 'email', 'phoneNumber', 'address', 'role'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const setterMethod = `_set${key.charAt(0).toUpperCase() + key.slice(1)}`;
        if (typeof this[setterMethod] === 'function') {
          this[setterMethod](value);
        }
      }
    }
    
    this.updateTimestamp();
    return this;
  }

  /**
   * Converts model to plain object
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      address: this.address ? this.address.toJSON() : null,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Converts model to safe object (without sensitive data)
   * @returns {Object}
   */
  toSafeObject() {
    const obj = this.toJSON();
    // Add any fields to exclude in the future (like passwords, etc.)
    return obj;
  }

  /**
   * Create User from Prisma data
   * @param {Object} prismaUser - User data from Prisma
   * @returns {User}
   */
  static fromPrisma(prismaUser) {
    if (!prismaUser) return null;

    return new User({
      id: prismaUser.id,
      name: prismaUser.name,
      email: prismaUser.email,
      phoneNumber: prismaUser.phoneNumber,
      address: prismaUser.address ? Address.fromPrisma(prismaUser.address) : null,
      role: prismaUser.role.toLowerCase(), // Convert ENUM to lowercase
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt
    });
  }

  /**
   * Convert to Prisma format for database operations
   * @returns {Object}
   */
  toPrisma() {
    const userData = {
      id: this.id,
      name: this.name,
      email: this.email,
      phoneNumber: this.phoneNumber,
      role: this.role.toUpperCase(), // Convert to ENUM format
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };

    // Include address connection if address exists
    if (this.address) {
      userData.address = {
        connectOrCreate: {
          where: { id: this.address.id },
          create: this.address.toPrisma()
        }
      };
    }

    return userData;
  }
}

module.exports = User; 