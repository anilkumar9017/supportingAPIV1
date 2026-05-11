
const { handleMessage } = require("./messageHandler");

/**
 * Process incoming Whapi.Cloud webhook payload
 * Whapi sends batches of messages/events
 */
async function processWebhook(payload) {
  if (payload.messages && Array.isArray(payload.messages)) {
    for (const message of payload.messages) {
      try {
        if (message.from_me || message.source === "api") {
          continue;
        }
        const allowedNumbers = process.env.ADMIN_NUMBERS
          .split(",")
          .map((num) => num.trim());

        const incoming = message.from.slice(-10);

        const isAgent = allowedNumbers.includes(incoming);

        const chatId = message.chat_id;

        // ignore groups
        if (chatId.endsWith("@g.us")) continue;

        console.log(`User: ${incoming} → ${isAgent ? "AGENT" : "DRIVER"}`);

        // 👇 Inject role into message
        message.userRole = isAgent ? "AGENT" : "DRIVER";

        if (message.userRole == "DRIVER") {
          console.log("Other message: ");
          return;
        }

        await handleMessage(message);
      } catch (err) {
        logger.error(`Error processing message: ${err.message}`);
      }
    }
  }

  // statuses
  if (payload.statuses && Array.isArray(payload.statuses)) {
    for (const status of payload.statuses) {
      handleStatus(status);
    }
  }

  // contacts
  if (payload.contacts && Array.isArray(payload.contacts)) {
    for (const contact of payload.contacts) {
      logger.info(`Contact update: ${contact.id} — ${contact.name}`);
    }
  }

  // groups
  if (payload.groups && Array.isArray(payload.groups)) {
    for (const group of payload.groups) {
      logger.info(`Group event: ${group.id}`);
    }
  }
}


function handleStatus(status) {
  const { id, status: st, chat_id } = status;
  logger.info(`Message ${id} in ${chat_id}: ${st}`);
}

module.exports = { processWebhook };