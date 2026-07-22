const subconUserService = require('../services/subconUserService');

async function listUsers(req, res) {
  try {
    const databaseName = req.databaseName || req.user?.dbname || process.env.DEFAULT_DB_NAME || 'default';
    const result = await subconUserService.getUsers(databaseName);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch users' });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const result = await subconUserService.getUserById(req.databaseName, id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch user' });
  }
}

async function createUser(req, res) {
  try {
    const payload = req.body;
    const result = await subconUserService.createUser(req.databaseName, {
      ...payload,
      createdby: req.user?.id || null,
      updatedby: req.user?.id || null
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create user' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const result = await subconUserService.updateUser(req.databaseName, id, req.body, req.user?.id || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update user' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const result = await subconUserService.deleteUser(req.databaseName, id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete user' });
  }
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
