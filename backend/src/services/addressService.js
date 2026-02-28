// Address Service
// Business logic for address management

const prisma = require('../config/database');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');

class AddressService {
  /**
   * Get all user addresses
   * @param {String} userId - User ID
   * @returns {Promise<Array>} List of addresses
   */
  async getAddresses(userId) {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return addresses;
  }

  /**
   * Get single address
   * @param {String} userId - User ID
   * @param {String} addressId - Address ID
   * @returns {Promise<Object>} Address details
   */
  async getAddressById(userId, addressId) {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundError('Address not found');
    }

    if (address.userId !== userId) {
      throw new BadRequestError('Unauthorized access to address');
    }

    return address;
  }

  /**
   * Create new address
   * @param {String} userId - User ID
   * @param {Object} addressData - Address details
   * @returns {Promise<Object>} Created address
   */
  async createAddress(userId, addressData) {
    // If this is set as default, unset other default addresses
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    } else {
      // If this is the first address, make it default
      const count = await prisma.address.count({
        where: { userId },
      });

      if (count === 0) {
        addressData.isDefault = true;
      }
    }

    const address = await prisma.address.create({
      data: {
        ...addressData,
        userId,
      },
    });

    logger.info(`Address created for user: ${userId}`);

    return address;
  }

  /**
   * Update address
   * @param {String} userId - User ID
   * @param {String} addressId - Address ID
   * @param {Object} updateData - Updated address data
   * @returns {Promise<Object>} Updated address
   */
  async updateAddress(userId, addressId, updateData) {
    const address = await this.getAddressById(userId, addressId);

    // If setting as default, unset other default addresses
    if (updateData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          id: { not: addressId },
        },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });

    logger.info(`Address updated: ${addressId}`);

    return updatedAddress;
  }

  /**
   * Delete address
   * @param {String} userId - User ID
   * @param {String} addressId - Address ID
   * @returns {Promise<Object>} Success message
   */
  async deleteAddress(userId, addressId) {
    const address = await this.getAddressById(userId, addressId);

    await prisma.address.delete({
      where: { id: addressId },
    });

    // If deleted address was default, set another as default
    if (address.isDefault) {
      const firstAddress = await prisma.address.findFirst({
        where: { userId },
      });

      if (firstAddress) {
        await prisma.address.update({
          where: { id: firstAddress.id },
          data: { isDefault: true },
        });
      }
    }

    logger.info(`Address deleted: ${addressId}`);

    return { message: 'Address deleted successfully' };
  }
}

module.exports = new AddressService();
