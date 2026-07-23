const bcrypt = require('bcryptjs');
const db = require('../../../config/database');

async function ensurePasswordHash(password) {
  if (!password) {
    return null;
  }

  if (typeof password === 'string' && password.startsWith('$2')) {
    return password;
  }

  return bcrypt.hash(password, 10);
}

async function getUsers(databaseName) {
  const query = `
    SELECT id, subcontractor_id, role_name, full_name, email, password_hash, is_active, is_superadmin, last_login_date, createdate, updatedate, createdby, updatedby, log_inst
    FROM [subcon].[users]
    ORDER BY createdate DESC
  `;

  return db.executeQuery(databaseName, query, {}, false);
}

async function getUserById(databaseName, userId) {
  const query = `
    SELECT id, subcontractor_id, role_name, full_name, email, password_hash, is_active, is_superadmin, last_login_date, createdate, updatedate, createdby, updatedby, log_inst
    FROM [subcon].[users]
    WHERE id = @id
  `;

  const result = await db.executeQuery(databaseName, query, { id: userId }, false);
  return result && result.length > 0 ? result[0] : null;
}

async function createUser(databaseName, payload) {
  const query = `
    INSERT INTO [subcon].[users] (
      subcontractor_id, role_name, full_name, email, password_hash, is_active, is_superadmin, last_login_date, createdate, updatedate, createdby, updatedby, log_inst
    ) VALUES (
      @subcontractor_id, @role_name, @full_name, @email, @password_hash, @is_active, @is_superadmin, @last_login_date, GETUTCDATE(), GETUTCDATE(), @createdby, @updatedby, @log_inst
    )
  `;

  const passwordHash = await ensurePasswordHash(payload.password_hash);

  await db.executeQuery(
    databaseName,
    query,
    {
      subcontractor_id: payload.subcontractor_id,
      role_name: payload.role_name,
      full_name: payload.full_name,
      email: payload.email,
      password_hash: passwordHash,
      is_active: payload.is_active !== undefined ? payload.is_active : 1,
      is_superadmin: payload.is_superadmin !== undefined ? payload.is_superadmin : 'N',
      last_login_date: payload.last_login_date || null,
      createdby: payload.createdby || null,
      updatedby: payload.updatedby || null,
      log_inst: payload.log_inst !== undefined ? payload.log_inst : 1
    },
    false
  );

  return { success: true, message: 'User created successfully.' };
}

async function updateUser(databaseName, userId, payload, updatedBy) {
  const allowedFields = ['subcontractor_id', 'role_name', 'full_name', 'email', 'password_hash', 'is_active', 'is_superadmin', 'last_login_date', 'log_inst'];
  const updates = [];
  const params = { id: userId, updatedby: updatedBy };

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      if (field === 'password_hash') {
        params[field] = await ensurePasswordHash(payload.password_hash);
      } else {
        params[field] = payload[field];
      }
      updates.push(`${field} = @${field}`);
    }
  }

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  updates.push('updatedate = GETUTCDATE()');
  updates.push('updatedby = @updatedby');

  const query = `
    UPDATE [subcon].[users]
    SET ${updates.join(', ')}
    WHERE id = @id
  `;

  await db.executeQuery(databaseName, query, params, false);
  return { success: true, message: 'User updated successfully.' };
}

async function deleteUser(databaseName, userId) {
  await db.executeQuery(databaseName, 'DELETE FROM [subcon].[users] WHERE id = @id', { id: userId }, false);
  return { success: true, message: 'User deleted successfully.' };
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
