// Google OAuth Configuration
// Handles Google ID token verification and access token user info fetch

const { OAuth2Client } = require('google-auth-library');
const config = require('./env');
const logger = require('./logger');

let client = null;

const getClient = () => {
  if (!client) {
    if (!config.google.clientId) {
      logger.error('Google Client ID not configured');
      return null;
    }
    client = new OAuth2Client(config.google.clientId);
  }
  return client;
};

/**
 * Verify a Google ID token and return the decoded payload
 * @param {String} idToken - The Google ID token from the client
 * @returns {Promise<Object|null>} Decoded token payload {sub, email, name, picture}
 */
const verifyGoogleToken = async (idToken) => {
  try {
    const oauthClient = getClient();
    if (!oauthClient) {
      throw new Error('Google OAuth not configured');
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid Google token payload');
    }

    // Verify the email is verified by Google
    if (!payload.email_verified) {
      throw new Error('Google email not verified');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatar: payload.picture,
    };
  } catch (error) {
    logger.error(`Google token verification failed: ${error.message}`);
    throw new Error('Invalid Google authentication token');
  }
};

/**
 * Fetch user info from Google using an access token
 * This is used when the client uses the implicit grant flow (useGoogleLogin)
 * @param {String} accessToken - Google OAuth access token
 * @returns {Promise<Object>} {googleId, email, name, avatar}
 */
const fetchGoogleUserInfo = async (accessToken) => {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google API responded with ${response.status}`);
    }

    const data = await response.json();

    if (!data.email) {
      throw new Error('No email returned from Google');
    }

    if (!data.email_verified) {
      throw new Error('Google email not verified');
    }

    return {
      googleId: data.sub,
      email: data.email,
      name: data.name,
      avatar: data.picture,
    };
  } catch (error) {
    logger.error(`Google user info fetch failed: ${error.message}`);
    throw new Error('Invalid Google authentication token');
  }
};

module.exports = { verifyGoogleToken, fetchGoogleUserInfo };