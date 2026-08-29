const prisma = require('../lib/prisma');
const { success, error, notFound } = require('../utils/responseHandlers');

exports.getMe = async (req, res) => {
  try {
    // req.user is attached by the auth middleware and already contains user data
    // But let's fetch fresh data from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            forms: true,
            submissions: true,
          },
        },
      },
    });

    if (!user) {
      return notFound(res, 'User not found');
    }

    return success(res, { user });
  } catch (err) {
    console.error('Get user error:', err);
    return error(res, 'Server error getting user data', 500, err);
  }
};

exports.updateUser = async (req, res) => {
  const { name, avatar } = req.body;
  const userId = req.user.id;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return success(res, { user }, 'User updated successfully');
  } catch (err) {
    console.error('Update user error:', err);
    return error(res, 'Server error updating user', 500, err);
  }
};

exports.deleteUser = async (req, res) => {
  const userId = req.user.id;

  try {
    // This is a sensitive operation - in production you might want to:
    // 1. Send confirmation email
    // 2. Soft delete instead of hard delete
    // 3. Archive user data instead of deleting

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return success(res, {}, 'User account deactivated successfully');
  } catch (err) {
    console.error('Delete user error:', err);
    return error(res, 'Server error deleting user', 500, err);
  }
};

exports.getUserStats = async (req, res) => {
  const userId = req.user.id;

  try {
    const [formsCount, submissionsCount, publishedFormsCount] = await Promise.all([
      prisma.form.count({
        where: { userId },
      }),
      prisma.submission.count({
        where: {
          form: { userId },
        },
      }),
      prisma.form.count({
        where: {
          userId,
          isPublished: true,
        },
      }),
    ]);

    // Get recent activity
    const recentForms = await prisma.form.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        isPublished: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    const recentSubmissions = await prisma.submission.findMany({
      where: {
        form: { userId },
      },
      select: {
        id: true,
        submittedAt: true,
        form: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 5,
    });

    return success(res, {
      stats: {
        formsCount,
        submissionsCount,
        publishedFormsCount,
        recentForms,
        recentSubmissions,
      },
    });
  } catch (err) {
    console.error('Get user stats error:', err);
    return error(res, 'Server error getting user stats', 500, err);
  }
};
