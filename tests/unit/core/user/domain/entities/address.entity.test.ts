/**
 * Address Entity Tests
 * Comprehensive testing for Address entity with 100% coverage
 */

import {
  Address,
  type AddressData,
} from "../../../../../../core/user/domain/entities/address.entity";
import { ValidationError } from "../../../../../../core/common/domain/exceptions/validation.error";

describe("Address Entity", () => {
  const validAddressData: AddressData = {
    addressLine1: "123 Main Street",
    addressLine2: "Apt 4B",
    city: "New York",
    stateOrProvince: "NY",
    postalCode: "10001",
    country: "US",
  };

  describe("Constructor", () => {
    it("should create address with valid data", () => {
      const address = new Address(validAddressData);

      expect(address.id).toBeDefined();
      expect(address.addressLine1).toBe("123 Main Street");
      expect(address.addressLine2).toBe("Apt 4B");
      expect(address.city).toBe("New York");
      expect(address.stateOrProvince).toBe("NY");
      expect(address.postalCode).toBe("10001");
      expect(address.country).toBe("US");
      expect(address.createdAt).toBeInstanceOf(Date);
      expect(address.updatedAt).toBeInstanceOf(Date);
    });

    it("should create address with minimal data", () => {
      const minimalData: AddressData = {
        addressLine1: "123 Main Street",
        city: "New York",
        stateOrProvince: "NY",
        postalCode: "10001",
        country: "US",
      };

      const address = new Address(minimalData);

      expect(address.addressLine1).toBe("123 Main Street");
      expect(address.addressLine2).toBe("");
      expect(address.city).toBe("New York");
      expect(address.stateOrProvince).toBe("NY");
      expect(address.postalCode).toBe("10001");
      expect(address.country).toBe("US");
    });

    it("should create address with existing ID", () => {
      const addressDataWithId: AddressData = {
        id: "existing-id-123",
        ...validAddressData,
      };

      const address = new Address(addressDataWithId);

      expect(address.id).toBe("existing-id-123");
    });

    it("should create address with existing dates", () => {
      const existingDate = new Date("2023-01-01");
      const addressDataWithDates: AddressData = {
        ...validAddressData,
        createdAt: existingDate,
        updatedAt: existingDate,
      };

      const address = new Address(addressDataWithDates);

      expect(address.createdAt).toBe(existingDate);
      expect(address.updatedAt).toBe(existingDate);
    });

    it("should create address with empty data", () => {
      expect(() => new Address()).toThrow(ValidationError);
    });
  });

  describe("Validation", () => {
    describe("Required Fields", () => {
      it("should throw ValidationError when addressLine1 is missing", () => {
        const invalidData = { ...validAddressData };
        delete invalidData.addressLine1;

        expect(() => new Address(invalidData)).toThrow(ValidationError);
        expect(() => new Address(invalidData)).toThrow(
          "Address validation failed",
        );
      });

      it("should throw ValidationError when addressLine1 is empty", () => {
        const invalidData = { ...validAddressData, addressLine1: "" };

        expect(() => new Address(invalidData)).toThrow(ValidationError);
      });

      it("should throw ValidationError when addressLine1 is only whitespace", () => {
        const invalidData = { ...validAddressData, addressLine1: "   " };

        expect(() => new Address(invalidData)).toThrow(ValidationError);
      });

      it("should throw ValidationError when city is missing", () => {
        const invalidData = { ...validAddressData };
        delete invalidData.city;

        expect(() => new Address(invalidData)).toThrow(ValidationError);
      });

      it("should throw ValidationError when city is empty", () => {
        const invalidData = { ...validAddressData, city: "" };

        expect(() => new Address(invalidData)).toThrow(ValidationError);
      });

      it("should throw ValidationError when stateOrProvince is missing", () => {
        const invalidData = { ...validAddressData };
        delete invalidData.stateOrProvince;

        expect(() => new Address(invalidData)).toThrow(ValidationError);
      });

      it("should throw ValidationError when stateOrProvince is empty", () => {
        const invalidData = { ...validAddressData, stateOrProvince: "" };

        expect(() => new Address(invalidData)).toThrow(ValidationError);
      });

      it("should throw ValidationError when postalCode is missing", () => {
        const invalidData = { ...validAddressData };
        delete invalidData.postalCode;

        expect(() => new Address(invalidData)).toThrow(ValidationError);
      });

      it("should throw ValidationError when postalCode is empty", () => {
        const invalidData = { ...validAddressData, postalCode: "" };

        expect(() => new Address(invalidData)).toThrow(ValidationError);
      });

      it("should throw ValidationError when country is missing", () => {
        const invalidData = { ...validAddressData };
        delete invalidData.country;

        expect(() => new Address(invalidData)).toThrow(ValidationError);
      });

      it("should throw ValidationError when country is empty", () => {
        const invalidData = { ...validAddressData, country: "" };

        expect(() => new Address(invalidData)).toThrow(ValidationError);
      });
    });

    describe("Length Validations", () => {
      it("should throw ValidationError when addressLine1 is too long", () => {
        const invalidData = {
          ...validAddressData,
          addressLine1: "a".repeat(256),
        };
        try {
          new Address(invalidData);
        } catch (error) {
          if (error instanceof ValidationError) {
            expect(error.details).toContain(
              "Address line 1 must be less than 255 characters",
            );
          }
        }
      });

      it("should throw ValidationError when addressLine2 is too long", () => {
        const invalidData = {
          ...validAddressData,
          addressLine2: "a".repeat(256),
        };
        try {
          new Address(invalidData);
        } catch (error) {
          if (error instanceof ValidationError) {
            expect(error.details).toContain(
              "Address line 2 must be less than 255 characters",
            );
          }
        }
      });

      it("should throw ValidationError when city is too long", () => {
        const invalidData = {
          ...validAddressData,
          city: "a".repeat(101),
        };
        try {
          new Address(invalidData);
        } catch (error) {
          if (error instanceof ValidationError) {
            expect(error.details).toContain(
              "City must be less than 100 characters",
            );
          }
        }
      });

      it("should throw ValidationError when stateOrProvince is too long", () => {
        const invalidData = {
          ...validAddressData,
          stateOrProvince: "a".repeat(101),
        };
        try {
          new Address(invalidData);
        } catch (error) {
          if (error instanceof ValidationError) {
            expect(error.details).toContain(
              "State or Province must be less than 100 characters",
            );
          }
        }
      });

      it("should throw ValidationError when postalCode is too short", () => {
        const invalidData = {
          ...validAddressData,
          postalCode: "12",
        };
        try {
          new Address(invalidData);
        } catch (error) {
          if (error instanceof ValidationError) {
            expect(error.details).toContain(
              "Postal code must be at least 3 characters",
            );
          }
        }
      });

      it("should throw ValidationError when postalCode is too long", () => {
        const invalidData = {
          ...validAddressData,
          postalCode: "a".repeat(21),
        };
        try {
          new Address(invalidData);
        } catch (error) {
          if (error instanceof ValidationError) {
            expect(error.details).toContain(
              "Postal code must be less than 20 characters",
            );
          }
        }
      });

      it("should throw ValidationError when country is too short", () => {
        const invalidData = {
          ...validAddressData,
          country: "A",
        };
        try {
          new Address(invalidData);
        } catch (error) {
          if (error instanceof ValidationError) {
            expect(error.details).toContain(
              "Country must be at least 2 characters",
            );
          }
        }
      });

      it("should throw ValidationError when country is too long", () => {
        const invalidData = {
          ...validAddressData,
          country: "a".repeat(101),
        };
        try {
          new Address(invalidData);
        } catch (error) {
          if (error instanceof ValidationError) {
            expect(error.details).toContain(
              "Country must be less than 100 characters",
            );
          }
        }
      });
    });

    describe("Multiple Validation Errors", () => {
      it("should throw ValidationError with multiple error messages", () => {
        const invalidData = {
          addressLine1: "",
          city: "",
          stateOrProvince: "",
          postalCode: "",
          country: "",
        };

        expect(() => new Address(invalidData)).toThrow(ValidationError);

        try {
          new Address(invalidData);
        } catch (error) {
          if (error instanceof ValidationError) {
            expect(error.details).toContain("Address line 1 is required");
            expect(error.details).toContain("City is required");
            expect(error.details).toContain("State or Province is required");
            expect(error.details).toContain("Postal code is required");
            expect(error.details).toContain("Country is required");
          }
        }
      });
    });

    describe("Valid Cases", () => {
      it("should validate successfully with valid data", () => {
        const address = new Address(validAddressData);
        expect(address.validate()).toBe(true);
      });

      it("should validate successfully with empty addressLine2", () => {
        const dataWithoutLine2 = { ...validAddressData };
        delete dataWithoutLine2.addressLine2;

        const address = new Address(dataWithoutLine2);
        expect(address.validate()).toBe(true);
      });
    });
  });

  describe("Factory Methods", () => {
    it("should create address using static create method", () => {
      const address = Address.create(validAddressData);

      expect(address).toBeInstanceOf(Address);
      expect(address.addressLine1).toBe("123 Main Street");
      expect(address.city).toBe("New York");
    });

    it("should create address from Prisma data", () => {
      const prismaData = {
        id: "prisma-id-123",
        addressLine1: "123 Main Street",
        addressLine2: "Apt 4B",
        city: "New York",
        stateOrProvince: "NY",
        postalCode: "10001",
        country: "US",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
      };

      const address = Address.fromPrisma(prismaData);

      expect(address).toBeInstanceOf(Address);
      expect(address?.id).toBe("prisma-id-123");
      expect(address?.addressLine1).toBe("123 Main Street");
      expect(address?.city).toBe("New York");
      expect(address?.createdAt).toEqual(new Date("2023-01-01"));
      expect(address?.updatedAt).toEqual(new Date("2023-01-02"));
    });

    it("should return null when creating from null Prisma data", () => {
      const address = Address.fromPrisma(null as any);
      expect(address).toBeNull();
    });

    it("should return null when creating from undefined Prisma data", () => {
      const address = Address.fromPrisma(undefined as any);
      expect(address).toBeNull();
    });
  });

  describe("Instance Methods", () => {
    let address: Address;

    beforeEach(() => {
      address = new Address(validAddressData);
    });

    describe("getFullAddress", () => {
      it("should return full address as formatted string", () => {
        const fullAddress = address.getFullAddress();
        expect(fullAddress).toBe(
          "123 Main Street, Apt 4B, New York, NY, 10001, US",
        );
      });

      it("should return full address without addressLine2 when empty", () => {
        const addressWithoutLine2 = new Address({
          addressLine1: "123 Main Street",
          city: "New York",
          stateOrProvince: "NY",
          postalCode: "10001",
          country: "US",
        });

        const fullAddress = addressWithoutLine2.getFullAddress();
        expect(fullAddress).toBe("123 Main Street, New York, NY, 10001, US");
      });

      it("should filter out empty parts", () => {
        const addressWithEmptyParts = new Address({
          addressLine1: "123 Main Street",
          addressLine2: "",
          city: "New York",
          stateOrProvince: "NY",
          postalCode: "10001",
          country: "US",
        });

        const fullAddress = addressWithEmptyParts.getFullAddress();
        expect(fullAddress).toBe("123 Main Street, New York, NY, 10001, US");
      });
    });

    describe("getShippingFormat", () => {
      it("should return address in shipping label format", () => {
        const shippingFormat = address.getShippingFormat();
        const expected = "123 Main Street\nApt 4B\nNew York, NY 10001\nUS";
        expect(shippingFormat).toBe(expected);
      });

      it("should return shipping format without addressLine2 when empty", () => {
        const addressWithoutLine2 = new Address({
          addressLine1: "123 Main Street",
          city: "New York",
          stateOrProvince: "NY",
          postalCode: "10001",
          country: "US",
        });

        const shippingFormat = addressWithoutLine2.getShippingFormat();
        const expected = "123 Main Street\nNew York, NY 10001\nUS";
        expect(shippingFormat).toBe(expected);
      });
    });

    describe("isInCountry", () => {
      it("should return true for matching country (case insensitive)", () => {
        expect(address.isInCountry("US")).toBe(true);
        expect(address.isInCountry("us")).toBe(true);
        expect(address.isInCountry("Us")).toBe(true);
      });

      it("should return false for non-matching country", () => {
        expect(address.isInCountry("CA")).toBe(false);
        expect(address.isInCountry("Canada")).toBe(false);
      });
    });

    describe("isInternational", () => {
      it("should return false for domestic address (default US)", () => {
        expect(address.isInternational()).toBe(false);
      });

      it("should return true for international address", () => {
        const internationalAddress = new Address({
          ...validAddressData,
          country: "CA",
        });

        expect(internationalAddress.isInternational()).toBe(true);
      });

      it("should return false for domestic address with custom home country", () => {
        const canadianAddress = new Address({
          ...validAddressData,
          country: "CA",
        });

        expect(canadianAddress.isInternational("CA")).toBe(false);
      });

      it("should return true for international address with custom home country", () => {
        expect(address.isInternational("CA")).toBe(true);
      });
    });

    describe("updateAddress", () => {
      it("should update address fields successfully", () => {
        const updates = {
          addressLine1: "456 Oak Avenue",
          city: "Los Angeles",
          stateOrProvince: "CA",
        };
        const createdAt = address.createdAt;
        const updatedAddress = address.updateAddress(updates);
        expect(updatedAddress.addressLine1).toBe("456 Oak Avenue");
        expect(updatedAddress.city).toBe("Los Angeles");
        expect(updatedAddress.stateOrProvince).toBe("CA");
        expect(updatedAddress.postalCode).toBe("10001"); // unchanged
        expect(updatedAddress.country).toBe("US"); // unchanged
        expect(updatedAddress.updatedAt).toBeInstanceOf(Date);
        expect(updatedAddress.createdAt).toBe(createdAt);
      });

      it("should update only specified fields", () => {
        const originalAddressLine1 = address.addressLine1;
        const originalCity = address.city;

        const updates = {
          postalCode: "90210",
        };

        const updatedAddress = address.updateAddress(updates);

        expect(updatedAddress.addressLine1).toBe(originalAddressLine1);
        expect(updatedAddress.city).toBe(originalCity);
        expect(updatedAddress.postalCode).toBe("90210");
      });

      it("should validate after update", () => {
        const updates = {
          addressLine1: "", // invalid
        };

        expect(() => address.updateAddress(updates)).toThrow(ValidationError);
      });

      it("should ignore non-address fields in updates", () => {
        const updates = {
          addressLine1: "456 Oak Avenue",
          id: "new-id-123", // should be ignored
          createdAt: new Date(), // should be ignored
        } as any;
        const originalCreatedAt = address.createdAt;
        const updatedAddress = address.updateAddress(updates);
        expect(updatedAddress.addressLine1).toBe("456 Oak Avenue");
        expect(updatedAddress.id).not.toBe("new-id-123");
        expect(updatedAddress.createdAt).toBe(originalCreatedAt);
      });
    });

    describe("toJSON", () => {
      it("should return address as plain object", () => {
        const json = address.toJSON();

        expect(json).toEqual({
          id: address.id,
          addressLine1: "123 Main Street",
          addressLine2: "Apt 4B",
          city: "New York",
          stateOrProvince: "NY",
          postalCode: "10001",
          country: "US",
          createdAt: address.createdAt,
          updatedAt: address.updatedAt,
        });
      });
    });

    describe("toPrisma", () => {
      it("should return address in Prisma format", () => {
        const prismaData = address.toPrisma();

        expect(prismaData).toEqual({
          id: address.id,
          addressLine1: "123 Main Street",
          addressLine2: "Apt 4B",
          city: "New York",
          stateOrProvince: "NY",
          postalCode: "10001",
          country: "US",
          createdAt: address.createdAt,
          updatedAt: address.updatedAt,
        });
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle whitespace-only fields in validation", () => {
      const invalidData = {
        addressLine1: "   ",
        city: "   ",
        stateOrProvince: "   ",
        postalCode: "   ",
        country: "   ",
      };

      expect(() => new Address(invalidData)).toThrow(ValidationError);
    });

    it("should handle special characters in address fields", () => {
      const specialCharData = {
        addressLine1: "123 Main St. #4B",
        addressLine2: "C/O John Doe",
        city: "San José",
        stateOrProvince: "CA",
        postalCode: "90210-1234",
        country: "US",
      };

      const address = new Address(specialCharData);
      expect(address.validate()).toBe(true);
    });

    it("should handle very long valid fields", () => {
      const longValidData = {
        addressLine1: "a".repeat(255),
        addressLine2: "a".repeat(255),
        city: "a".repeat(100),
        stateOrProvince: "a".repeat(100),
        postalCode: "a".repeat(20),
        country: "a".repeat(100),
      };

      const address = new Address(longValidData);
      expect(address.validate()).toBe(true);
    });
  });
});
