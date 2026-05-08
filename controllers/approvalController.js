const db = require('../config/database');

/**
 * Get is there already approval exist or not for any user or all
 * check user already exist or not with action name
 * check action name already exist or not action name without user
 */
async function validateApprovalSetup(req, res) {
  try {
    const { user_id, action_name,table_name } = req.query;
    console.log(" req.query ", req.query);
    const useApi = req.useApi || false;
    
    // Get database name from middleware (already resolved)
    const databaseName = req.databaseName;
    if (!databaseName) {
      return res.status(400).json({
        success: false,
        message: 'Database name not resolved'
      });
    }
    
    const query = `select T0.* FROM m_approval_setup T0 
                    JOIN m_approval_setup_originator T1 ON T0.id=T1.parent_id
                    where T0.action_name=@action_name AND T0.table_name=@table_name AND T1.user_id=@user_id;`
    const result = await db.executeQuery(databaseName, query, { action_name, table_name, user_id}, useApi);

    if(result && result.length > 0){
        //check user exist
        const userNameQuery = `select username from m_user_master where id = @user_id`;
        const usernameRecords = await db.executeQuery(databaseName, userNameQuery, { user_id }, useApi);
        if (usernameRecords && usernameRecords.length > 0) {
            return res.json({
              success: true,
              data: usernameRecords[0]?.username
            });
        }
    }else{//when user not exist
            const approvalQuery = `SELECT T0.*
                          FROM m_approval_setup T0
                          WHERE T0.action_name = @action_name AND T0.table_name=@table_name
                            AND NOT EXISTS (
                              SELECT 1
                              FROM m_approval_setup_originator T1
                              WHERE T1.parent_id = T0.id
                            );`
            const approvalResult = await db.executeQuery(databaseName, approvalQuery, { action_name,table_name }, useApi);
            if(approvalResult && approvalResult.length > 0){
                return res.json({
                  success: true,
                  data: "All"
                });
            }else{
              //when action and user both not exist then send false
              return res.json({
                success: false,
                message: 'Not Exist'
              })
            }
    }

  } catch (error) {
    console.error('Error fetching approval by action name and userId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

module.exports = {
    validateApprovalSetup,
};

