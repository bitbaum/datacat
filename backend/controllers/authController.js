const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  success,
  error,
  validationError,
  unauthorized,
  notFound,
  created,
} = require('../utils/responseHandlers');
const redis = require('../lib/redis');

function setAuthCookies(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: '/',
  });
}

exports.register = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return validationError(res, 'Email and password are required');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return validationError(res, 'User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Create and sign a JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }, // 24 hours
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          return error(res, 'Token generation failed');
        }
        setAuthCookies(res, token);
        return created(res, { token, user }, 'User registered successfully');
      },
    );
  } catch (err) {
    console.error('Registration error:', err);
    return error(res, 'Server error during registration', 500, err);
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return validationError(res, 'Email and password are required');
    }

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      return unauthorized(res, 'Invalid credentials');
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return unauthorized(res, 'Invalid credentials');
    }

    // Create and sign a JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }, // 24 hours
      (err, token) => {
        if (err) {
          console.error('JWT signing error:', err);
          return error(res, 'Token generation failed');
        }
        setAuthCookies(res, token);
        return success(
          res,
          {
            token,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              createdAt: user.createdAt,
            },
          },
          'Login successful',
        );
      },
    );
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Server error during login', 500, err);
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      return notFound(res, 'User not found');
    }

    return success(res, { user });
  } catch (err) {
    console.error('Get profile error:', err);
    return error(res, 'Server error getting profile', 500, err);
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return success(res, { user }, 'Profile updated successfully');
  } catch (err) {
    console.error('Update profile error:', err);
    return error(res, 'Server error updating profile', 500, err);
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return validationError(res, 'Current password and new password are required');
    }

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      return validationError(res, 'Password change not available for this account');
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return validationError(res, 'Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash },
    });

    return success(res, {}, 'Password changed successfully');
  } catch (err) {
    console.error('Change password error:', err);
    return error(res, 'Server error changing password', 500, err);
  }
};

// Verify token (useful for frontend to check if token is still valid)
exports.verifyToken = async (req, res) => {
  try {
    // If we reach here, the auth middleware has already verified the token
    return success(res, { user: req.user }, 'Token is valid');
  } catch (err) {
    console.error('Verify token error:', err);
    return error(res, 'Server error verifying token', 500, err);
  }
};

// Logout: clear cookie
exports.logout = async (req, res) => {
  try {
    res.clearCookie('token', { path: '/' });
    return success(res, {}, 'Logged out');
  } catch (err) {
    return error(res, 'Server error during logout', 500, err);
  }
};
