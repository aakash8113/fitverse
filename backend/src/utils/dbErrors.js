// Database error classification helpers

const SCHEMA_MISMATCH_PATTERNS = [
  'P2021',
  'P2022',
  '42P01',
  '42703',
  'relation',
  'column',
  'does not exist',
  'Unknown field',
  'The table',
  'The column',
];

const TRANSIENT_DB_PATTERNS = [
  'P1001',
  'P1017',
  'Can\'t reach database server',
  'Server has closed the connection',
  'Connection terminated unexpectedly',
  'Timed out fetching a new connection',
  'Connection reset',
  'ECONNRESET',
  'ETIMEDOUT',
];

const toErrorText = (error) => {
  if (!error) return '';
  return `${error.code || ''} ${error.message || ''} ${error.meta?.cause || ''} ${error.meta?.table || ''} ${error.meta?.column || ''}`;
};

const isSchemaMismatchError = (error) => {
  const raw = toErrorText(error).toLowerCase();
  return SCHEMA_MISMATCH_PATTERNS.some((pattern) => raw.includes(String(pattern).toLowerCase()));
};

const isTransientDbError = (error) => {
  const raw = toErrorText(error).toLowerCase();
  return TRANSIENT_DB_PATTERNS.some((pattern) => raw.includes(String(pattern).toLowerCase()));
};

module.exports = {
  isSchemaMismatchError,
  isTransientDbError,
};
