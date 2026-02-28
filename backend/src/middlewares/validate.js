// Validation Middleware
// Validates request body/query/params against Joi schemas

const { ValidationError } = require('../utils/errors');

/**
 * Validate request data against Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {String} source - Source of data ('body', 'query', 'params')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown keys
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      throw new ValidationError('Validation failed', errors);
    }

    // Replace request data with validated data
    req[source] = value;
    next();
  };
};

module.exports = validate;
