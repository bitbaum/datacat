const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const formController = require('../controllers/formController');

// @route   GET api/forms/public/:id
// @desc    Get a single published form for public viewing
// @access  Public
router.get('/public/:id', formController.getPublicForm);

// @route   POST api/forms
// @desc    Save a new form
// @access  Private
router.post('/', auth, formController.saveForm);

// @route   GET api/forms
// @desc    Get all forms for a user
// @access  Private
router.get('/', auth, formController.getForms);

// @route   DELETE api/forms/:id
// @desc    Delete a form
// @access  Private
router.delete('/:id', auth, formController.deleteForm);

// @route   PUT api/forms/:id
// @desc    Update a form
// @access  Private
router.put('/:id', auth, formController.updateForm);

// @route   PATCH api/forms/:id/publish
// @desc    Toggle form publish status
// @access  Private
router.patch('/:id/publish', auth, formController.publishForm);

module.exports = router;
