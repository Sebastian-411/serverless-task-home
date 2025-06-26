/**
 * User Model
 * Data model for system users with complete validation and business logic
 */

const BaseModel = require('./BaseModel');
const ValidationError = require('./ValidationError');
const { USER_ROLES } = require('./constants');
const Address = require('./Address');

class User extends BaseModel {
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
    const timestamps = BaseModel.createTimestamps();
    return new User({
      id: BaseModel.generateId(),
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
    if (name.trim().length < 2) {
      throw ValidationError.invalidFormat('name', 'at least 2 characters', name);
    }
    this.name = name.trim();
  }

  /**
   * Sets and validates user email
   * @private
   * @param {string} email - User email
   */
  _setEmail(email) {
    this._validateEmail(email, 'email');
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
  toObject() {
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
    const obj = this.toObject();
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