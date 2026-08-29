const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// @route   GET api/user/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, userController.getMe);

// @route   PUT api/user/me
// @desc    Update current user's profile
// @access  Private
router.put('/me', auth, userController.updateUser);

// @route   DELETE api/user/me
// @desc    Deactivate current user's account
// @access  Private
router.delete('/me', auth, userController.deleteUser);

// @route   GET api/user/stats
// @desc    Get current user's statistics
// @access  Private
router.get('/stats', auth, userController.getUserStats);

module.exports = router;
