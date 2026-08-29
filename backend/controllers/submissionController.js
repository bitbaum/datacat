const prisma = require('../lib/prisma');

exports.createSubmission = async (req, res) => {
  const { formId, data, metadata } = req.body;
  const submitterId = req.user?.id || null; // Can be anonymous

  try {
    // Validate input
    if (!formId || !data) {
      return res.status(400).json({
        success: false,
        message: 'Form ID and data are required',
      });
    }

    // Check if form exists and is published
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        userId: true,
        settings: true,
      },
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or not published',
      });
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        formId,
        submitterId,
        data,
        metadata: metadata || {},
        status: 'PENDING',
        source: 'DIRECT',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
      select: {
        id: true,
        formId: true,
        data: true,
        status: true,
        submittedAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      submission,
    });
  } catch (err) {
    console.error('Submit form error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error submitting form',
    });
  }
};

exports.getSubmissions = async (req, res) => {
  const { formId } = req.params;
  const userId = req.user.id;
  const { page = 1, limit = 20, status, search } = req.query;

  try {
    // Check if user owns the form
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        userId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found or you do not have access',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      formId,
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        select: {
          id: true,
          data: true,
          metadata: true,
          status: true,
          source: true,
          submittedAt: true,
          submitter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.submission.count({ where }),
    ]);

    res.json({
      success: true,
      form,
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error getting submissions',
    });
  }
};

exports.getSubmission = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const submission = await prisma.submission.findFirst({
      where: {
        id,
        form: {
          userId,
        },
      },
      select: {
        id: true,
        data: true,
        metadata: true,
        status: true,
        source: true,
        ipAddress: true,
        userAgent: true,
        submittedAt: true,
        submitter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        form: {
          select: {
            id: true,
            title: true,
            schema: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found or you do not have access',
      });
    }

    res.json({
      success: true,
      submission,
    });
  } catch (err) {
    console.error('Get submission error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error getting submission',
    });
  }
};
