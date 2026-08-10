
const { handleMessage } = require("./messageHandler");
const db = require('../../config/database');
const WhapiService = require("./apiConfig");
/**
 * Process incoming Whapi.Cloud webhook payload
 * Whapi sends batches of messages/events
 */
async function processWebhook(payload, context) {
  const { whapi, databaseName, tenant } = context;

  // =====================================
  // MESSAGES
  // =====================================
  if (payload.messages && Array.isArray(payload.messages)) {
    for (const message of payload.messages) {
      try {
        if (message.from_me || message.source === "api") {
          continue;
        }
        const chatId = message.chat_id;
        // Ignore groups
        if (chatId.endsWith("@g.us")) {
          continue;
        }

        message.whapi_token = tenant?.whapiToken;
        message.databaseName = databaseName;
        message.tenant = tenant;
        
        //Connect to Db to check message from driver or AGENT
        const query =`select * FROM m_driver where driver_phone1='${message.from}' OR driver_phone2='${message.from}'`;
       
        const result = await db.executeQuery(databaseName, query, {  }, true);
        if(result[0]){
            message.userRole = "DRIVER";
            message.driver_id = result[0].id;
        }else{
          const strQueryAgent =`select * FROM m_user_master where phoneno='${message.from}'`;
           const result = await db.executeQuery(databaseName, strQueryAgent, {  }, true);
           if(result[0]){
            message.userRole ="AGENT";
            message.agent_id =result[0].id;
           }else{
            const whapi = new WhapiService(message.whapi_token);
            return whapi.sendText(
              chatId,
              "Your mobile number not registered with us.",
            );
           }
          
          
         
        
        }
        return await handleMessage(message);

        const allowedNumbers = (tenant.adminNumbers || "")
          .split(",")
          .map((num) => num.trim());

        const incoming = message.from.slice(-10);

        const isAgent = allowedNumbers.includes(incoming);

        

        
       
        // =====================================
        // INJECT CONTEXT
        // =====================================
        // message.userRole = isAgent ? "AGENT" : "DRIVER";

        // message.whapi_token = tenant?.whapiToken;

        // message.databaseName = databaseName;

        // message.tenant = tenant;

        // await handleMessage(message);
      } catch (err) {
        console.error(`Message Error: ${err.message}`);
      }
    }
  }

  // =====================================
  // STATUS EVENTS
  // =====================================
  if (payload.statuses && Array.isArray(payload.statuses)) {
    for (const status of payload.statuses) {
      console.info(`Status: ${status.status}`);
    }
  }
}


function handleStatus(status) {
  const { id, status: st, chat_id } = status;
  console.info(`Message ${id} in ${chat_id}: ${st}`);
}

module.exports = { processWebhook };