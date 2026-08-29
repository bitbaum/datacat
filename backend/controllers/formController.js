const prisma = require('../lib/prisma');
const { success, error, validationError, notFound, created } = require('../utils/responseHandlers');

exports.saveForm = async (req, res) => {
  const { title, description, schema, settings, isTemplate, templateTags } = req.body;
  const userId = req.user.id;

  try {
    // Validate input
    if (!title || !schema) {
      return validationError(res, 'Title and schema are required');
    }

    const form = await prisma.form.create({
      data: {
        title,
        description: description || null,
        schema: schema,
        settings: settings || {},
        isTemplate: isTemplate || false,
        templateTags: templateTags || [],
        userId,
        isPublished: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        schema: true,
        settings: true,
        isPublished: true,
        isTemplate: true,
        templateTags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return created(res, { form }, 'Form created successfully');
  } catch (err) {
    console.error('Save form error:', err);
    return error(res, 'Server error creating form', 500, err);
  }
};

exports.getForms = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, isTemplate = false } = req.query;

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where: {
          userId,
          isTemplate: isTemplate === 'true',
        },
        select: {
          id: true,
          title: true,
          description: true,
          isPublished: true,
          isTemplate: true,
          templateTags: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.form.count({
        where: {
          userId,
          isTemplate: isTemplate === 'true',
        },
      }),
    ]);

    return success(res, {
      forms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get forms error:', err);
    return error(res, 'Server error getting forms', 500, err);
  }
};

exports.getForm = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const form = await prisma.form.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        schema: true,
        settings: true,
        isPublished: true,
        isTemplate: true,
        templateTags: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!form) {
      return notFound(res, 'Form not found or you do not have access');
    }

    return success(res, { form });
  } catch (err) {
    console.error('Get form error:', err);
    return error(res, 'Server error getting form', 500, err);
  }
};

exports.deleteForm = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Check if form exists and user owns it
    const form = await prisma.form.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!form) {
      return notFound(res, 'Form not found or you do not have access');
    }

    // Soft delete or hard delete depending on if there are submissions
    if (form._count.submissions > 0) {
      // For forms with submissions, we might want to implement soft delete
      // For now, we'll just delete everything
      await prisma.form.delete({
        where: { id },
      });
    } else {
      await prisma.form.delete({
        where: { id },
      });
    }

    return success(res, {}, 'Form deleted successfully');
  } catch (err) {
    console.error('Delete form error:', err);
    return error(res, 'Server error deleting form', 500, err);
  }
};

exports.updateForm = async (req, res) => {
  const { id } = req.params;
  const { title, description, schema, settings, isPublished } = req.body;
  const userId = req.user.id;

  try {
    // Check if form exists and user owns it
    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        currentVersion: true,
      },
    });

    if (!existingForm) {
      return notFound(res, 'Form not found or you do not have access');
    }

    // Create version if schema changed
    const updateData = {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(settings && { settings }),
      ...(isPublished !== undefined && { isPublished }),
      updatedAt: new Date(),
    };

    if (schema) {
      updateData.schema = schema;
      updateData.currentVersion = existingForm.currentVersion + 1;

      // Create version record
      await prisma.formVersion.create({
        data: {
          formId: id,
          version: existingForm.currentVersion + 1,
          schema,
          settings: settings || {},
          createdBy: userId,
        },
      });
    }

    const updatedForm = await prisma.form.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        schema: true,
        settings: true,
        isPublished: true,
        isTemplate: true,
        templateTags: true,
        currentVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(res, { form: updatedForm }, 'Form updated successfully');
  } catch (err) {
    console.error('Update form error:', err);
    return error(res, 'Server error updating form', 500, err);
  }
};

exports.publishForm = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Check if form exists and user owns it
    const form = await prisma.form.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        isPublished: true,
      },
    });

    if (!form) {
      return notFound(res, 'Form not found or you do not have access');
    }

    const updatedForm = await prisma.form.update({
      where: { id },
      data: {
        isPublished: !form.isPublished,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        isPublished: true,
        updatedAt: true,
      },
    });

    return success(
      res,
      { form: updatedForm },
      `Form ${updatedForm.isPublished ? 'published' : 'unpublished'} successfully`,
    );
  } catch (err) {
    console.error('Publish form error:', err);
    return error(res, 'Server error publishing form', 500, err);
  }
};

exports.getPublicForm = async (req, res) => {
  const { id } = req.params;

  try {
    const form = await prisma.form.findFirst({
      where: {
        id,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        schema: true,
        settings: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or not published',
      });
    }

    return success(res, { form });
  } catch (err) {
    console.error('Get public form error:', err);
    return error(res, 'Server error getting form', 500, err);
  }
};
