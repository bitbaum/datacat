const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const auth = require('../middleware/auth');

// @route   POST api/submissions
// @desc    Create a new form submission
// @access  Public
router.post('/', submissionController.createSubmission);

// @route   GET api/submissions/form/:formId
// @desc    Get all submissions for a specific form
// @access  Private
router.get('/form/:formId', auth, submissionController.getSubmissions);

// @route   GET api/submissions/:id
// @desc    Get a single submission
// @access  Private
router.get('/:id', auth, submissionController.getSubmission);

module.exports = router;
