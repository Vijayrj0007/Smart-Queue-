/**
 * Auth service — registration, login, tokens, profile
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
}

async function register(body) {
  const { name, email, password, phone } = body;

  const existing = await userRepository.findIdByEmail(email);
  if (existing.rows.length > 0) {
    return { ok: false, status: 409, message: 'An account with this email already exists.' };
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await userRepository.insertUser(name, email, passwordHash, phone);
  const user = result.rows[0];
  const tokens = generateTokens(user);

  return {
    ok: true,
    status: 201,
    message: 'Account created successfully.',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      ...tokens,
    },
  };
}

async function login(body) {
  const { email, password } = body;

  const result = await userRepository.findByEmailForLogin(email);
  if (result.rows.length === 0) {
    return { ok: false, status: 401, message: 'Invalid email or password.' };
  }

  const user = result.rows[0];

  if (!user.is_active) {
    return { ok: false, status: 403, message: 'Your account has been deactivated. Contact support.' };
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return { ok: false, status: 401, message: 'Invalid email or password.' };
  }

  const tokens = generateTokens(user);

  return {
    ok: true,
    message: 'Login successful.',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatar_url,
      },
      ...tokens,
    },
  };
}

async function refreshAccessToken(refreshTokenValue) {
  if (!refreshTokenValue) {
    return { ok: false, status: 400, message: 'Refresh token is required.' };
  }

  try {
    const decoded = jwt.verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET);
    const result = await userRepository.findByIdForRefresh(decoded.id);

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return { ok: false, status: 401, message: 'Invalid refresh token.' };
    }

    const user = result.rows[0];
    const tokens = generateTokens(user);
    return { ok: true, data: tokens };
  } catch {
    return { ok: false, status: 401, message: 'Invalid or expired refresh token.' };
  }
}

async function getProfile(userId) {
  const result = await userRepository.findProfileById(userId);
  if (result.rows.length === 0) {
    return { ok: false, status: 404, message: 'User not found.' };
  }
  return { ok: true, data: result.rows[0] };
}

async function updateProfile(userId, body) {
  const { name, phone } = body;
  const result = await userRepository.updateProfile(name, phone, userId);
  return {
    ok: true,
    message: 'Profile updated successfully.',
    data: result.rows[0],
  };
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  getProfile,
  updateProfile,
};
