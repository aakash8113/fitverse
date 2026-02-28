// OTP Service — uses Resend for email delivery

const logger = require('../config/logger');
const { generateOTP, generateOTPExpiry } = require('../utils/helpers');
const emailService = require('./emailService');

class OTPService {
  /**
   * Send Email OTP
   * @param {String} email - User email
   * @param {String} otp - OTP code
   * @returns {Promise<Boolean>}
   */
  async sendEmailOTP(email, otp, name) {
    try {
      await emailService.sendOTPEmail(email, name, otp);
      logger.info(`OTP email sent to: ${email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email OTP: ${error.message}`);
      throw error;
    }
  }

  async resendEmailOTP(email, otp, name) {
    try {
      await emailService.sendResendOTPEmail(email, name, otp);
      logger.info(`Resend OTP email sent to: ${email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to resend email OTP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send Phone OTP (SMS)
   * @param {String} phone - User phone number
   * @param {String} otp - OTP code
   * @returns {Promise<Boolean>}
   */
  async sendPhoneOTP(phone, otp) {
    try {
      // ============================================
      // 🚀 PRODUCTION UPGRADE POINT: SMS Service
      // ============================================
      // Replace console.log with actual SMS service
      // Options: Twilio, AWS SNS, Plivo
      //
      // Example Twilio implementation:
      // const twilio = require('twilio');
      // const client = twilio(
      //   process.env.TWILIO_ACCOUNT_SID,
      //   process.env.TWILIO_AUTH_TOKEN
      // );
      // await client.messages.create({
      //   body: `Your Fitverse verification code is: ${otp}`,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: phone,
      // });
      // ============================================

      console.log('\n📱 ===== SMS OTP =====');
      console.log(`📞 To: ${phone}`);
      console.log(`🔐 OTP: ${otp}`);
      console.log(`⏰ Expires in: 5 minutes`);
      console.log('=====================\n');

      logger.info(`OTP sent to phone: ${phone}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send phone OTP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate and return OTP with expiry
   * @returns {Object} {otp, expiresAt}
   */
  generateOTPWithExpiry() {
    const otp = generateOTP();
    const expiresAt = generateOTPExpiry(5); // 5 minutes
    return { otp, expiresAt };
  }
}

module.exports = new OTPService();
