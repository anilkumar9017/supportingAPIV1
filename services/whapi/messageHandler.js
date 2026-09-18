const fs = require("fs");
const path = require("path");
const mimeTypes = require("mime-types");

const WhapiService = require("./apiConfig");
const session = require("./sessionStore");
const { checkMediaBlur } = require("./blurCheck");
const db = require("../../config/database");
const uploadFileToNG = require("./backblaze");

// ============================================================
// CONSTANTS & TEMPLATES
// ============================================================

/**
 * Standard user-facing message strings used throughout the bot conversation.
 */
const messages = {
  selectDoc: "📦 Select document type:",
  enterTransaction: "Select *Transaction Type*:",
  enterDocNo: "🔢 Enter *Document Number*:",
  selectDocType: "📄 Select Document Type:",
  promptUpload: "📸 Please send an image to start the process.",
  unsupportedFile: "❌ Unsupported file format.",
  downloadFailed: "❌ Failed to retrieve uploaded file. Please try again.",
  lowQuality: "❌ Image quality too low. Please upload a clearer photo.",
  blurryImage: "❌ The image is blurry. Please upload a clear photo.",
  blurryPdf:
    "❌ The PDF contains blurry pages. Please upload a clear document.",
  internalError:
    "⚠️ An unexpected error occurred while processing your request. Please try again.",
  invalidDocNumber: (type) =>
    `Document number you entered for *${type}* is not valid, please re-enter a valid number.`,
  successDoc: (type) => `✅ *${type}* document received successfully.`,
  submitted: (transactionType, docType, docNum) =>
    `✅ Document submitted!\n\n` +
    `📑 Transaction Type: *${transactionType}*\n` +
    `📄 Doc Type: *${docType}*\n` +
    `🔢 Doc No: *${docNum}*`,
};

/**
 * Static button titles for Agent transaction options.
 */
const agentButtonTitles = {
  shipmentOrder: "Shipment Order",
  fileMaster: "File Master",
  booking: "Booking",
};

// ============================================================
// UTILITIES & DATABASE HELPERS
// ============================================================

/**
 * Escapes single quotes to prevent SQL injection and syntax errors.
 *
 * @param {any} input - Raw string or value to sanitize
 * @returns {string} Sanitized string safe for SQL concatenation
 */
function sanitizeInput(input) {
  try {
    if (typeof input !== "string") return String(input ?? "");
    return input.replace(/'/g, "''").trim();
  } catch (err) {
    console.error(`Error in sanitizeInput: ${err.message}`);
    return "";
  }
}

/**
 * Normalizes button IDs received from Whapi, stripping potential prefix wrappers (e.g. "ButtonsV3:").
 *
 * @param {string} rawId - The raw button ID from the webhook payload
 * @returns {string} Normalized button identifier
 */
function normalizeButtonId(rawId) {
  if (!rawId || typeof rawId !== "string") return "";
  return rawId.startsWith("ButtonsV3:")
    ? rawId.replace("ButtonsV3:", "")
    : rawId;
}

/**
 * Fetches dynamic document type options from `m_required_document` based on the selected transaction type.
 *
 * @param {string} databaseName - Tenant database name
 * @param {string} transactionType - "Shipment Order", "File Master", or "Booking"
 * @returns {Promise<Array<{id: string, title: string}>>} List of button objects
 */
async function fetchDynamicDocButtons(databaseName, transactionType) {
  try {
    let docTypeFilter = "('B','T')"; // Default for Shipment Order

    if (transactionType === "File Master" || transactionType === "Booking") {
      docTypeFilter = "('B','C')";
    }

    const query = `SELECT id, name FROM m_required_document WHERE is_active='Y' AND doc_type IN ${docTypeFilter}`;
    const results = await db.executeQuery(databaseName, query, {}, true);

    if (!Array.isArray(results) || results.length === 0) {
      console.warn(
        `No dynamic document types found for transaction: ${transactionType}`,
      );
      return [];
    }

    return results.map((doc) => ({
      id: `doc_${String(doc.name).toLowerCase().replace(/\s+/g, "_")}_${doc.id}`,
      title: doc.name,
    }));
  } catch (err) {
    console.error(`Error in fetchDynamicDocButtons: ${err.message}`);
    return [];
  }
}

/**
 * Sends a paginated batch of dynamic document type buttons (10 items + 'Other' per page).
 *
 * @param {string} chatId - Whapi chat ID
 * @param {string} userId - User identifier/phone number
 * @param {string} databaseName - Tenant database name
 * @param {string} transactionType - "Shipment Order", "File Master", or "Booking"
 * @param {WhapiService} whapi - Initialized Whapi API client
 * @param {number} [pageIndex=0] - Current 0-indexed page number
 */
async function sendPaginatedDynamicDocButtons(
  chatId,
  userId,
  databaseName,
  transactionType,
  whapi,
  pageIndex = 0,
) {
  try {
    const allButtons = await fetchDynamicDocButtons(
      databaseName,
      transactionType,
    );

    if (!Array.isArray(allButtons) || allButtons.length === 0) {
      return await whapi.sendText(
        chatId,
        "⚠️ No active document types found. Please contact support.",
      );
    }

    const pageSize = 10;
    let startIndex = pageIndex * pageSize;

    // Reset to start page if pageIndex goes out of bounds, enabling continuous cycling
    if (startIndex >= allButtons.length) {
      pageIndex = 0;
      startIndex = 0;
    }

    const endIndex = startIndex + pageSize;
    const pageItems = allButtons.slice(startIndex, endIndex);
    // Show 'Other' if total items exceed page size so user can cycle through all pages
    const hasMore = allButtons.length > pageSize;

    const displayButtons = [...pageItems];
    if (hasMore) {
      displayButtons.push({
        id: "doc_other",
        title: "Other",
      });
    }

    // Persist current pagination pageIndex in session store
    await session.set(userId, {
      docPageIndex: pageIndex,
    });

    return await whapi.sendButtons(
      chatId,
      messages.selectDocType,
      displayButtons,
    );
  } catch (err) {
    console.error(`Error in sendPaginatedDynamicDocButtons: ${err.message}`);
    await whapi.sendText(chatId, messages.internalError);
  }
}

/**
 * Validates whether a provided document number exists in the corresponding transaction table.
 *
 * @param {string} databaseName - Tenant database name
 * @param {string} transactionType - Transaction category ("Shipment Order", "File Master", or "Booking")
 * @param {string} docNum - Document identifier entered by the user
 * @returns {Promise<Object|null>} Found record object or null if not found/error
 */
async function validateAgentDocNumber(databaseName, transactionType, docNum) {
  try {
    const safeDocNum = sanitizeInput(docNum);
    if (!safeDocNum) return null;

    let query = "";
    if (transactionType === "Shipment Order") {
      query = `SELECT id FROM d_fm_shipmentorder WHERE doc_num='${safeDocNum}' LIMIT 1`;
    } else if (transactionType === "File Master") {
      query = `SELECT id FROM d_cf_filemaster WHERE doc_num='${safeDocNum}' LIMIT 1`;
    } else if (transactionType === "Booking") {
      query = `SELECT id FROM d_cfs_booking WHERE doc_num='${safeDocNum}' LIMIT 1`;
    } else {
      console.warn(
        `validateAgentDocNumber received unknown transactionType: ${transactionType}`,
      );
      return null;
    }

    const result = await db.executeQuery(databaseName, query, {}, true);
    return result && result.length > 0 ? result[0] : null;
  } catch (err) {
    console.error(
      `Error in validateAgentDocNumber (${transactionType}, ${docNum}): ${err.message}`,
    );
    return null;
  }
}

/**
 * Inserts the uploaded document metadata into the appropriate attachment table.
 *
 * @param {string} databaseName - Tenant database name
 * @param {string} transactionType - "Shipment Order", "File Master", or "Booking"
 * @param {number|string} parentId - ID of parent transaction record
 * @param {string} docName - Saved file name
 * @param {string} docUrl - Backblaze public CDN URL
 * @param {string} mimeType - Media MIME type
 * @param {number|string} docTypeId - ID from m_required_document
 * @param {number|string} userId - ID of driver or agent
 * @param {string} userRole - "DRIVER" or "AGENT"
 * @param {string} userName - Optional username of the agent
 * @returns {Promise<boolean>} Success status of the insert
 */
async function processAttachmentInsert(
  databaseName,
  transactionType,
  parentId,
  docName,
  docUrl,
  mimeType,
  docTypeId,
  userId,
  userRole,
  userName,
) {
  try {
    const attachmentDate = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 23);
    const safeDocName = sanitizeInput(docName);
    const safeDocUrl = sanitizeInput(docUrl);
    const safeMime = sanitizeInput(mimeType);
    const safeUserName = sanitizeInput(userName || "");
    const safeParentId = parseInt(parentId, 10);
    const safeDocTypeId = docTypeId ? parseInt(docTypeId, 10) : "NULL";
    const safeUserId = userId ? parseInt(userId, 10) : "NULL";

    let insertQuery = "";

    if (transactionType === "Shipment Order") {
      insertQuery = `INSERT INTO d_fm_shipmentorder_attachment 
        (parent_id, file_name, attachment_date, template, mime_type, cdn_url, document_type, user_name, is_mobile)
        VALUES (${safeParentId}, '${safeDocName}', '${attachmentDate}', NULL, '${safeMime}', '${safeDocUrl}', ${safeDocTypeId}, '${safeUserName}', 'W')`;
    } else if (transactionType === "File Master") {
      insertQuery = `INSERT INTO d_cf_filemaster_attachment 
        (parent_id, file_name, attachment_date, template, mime_type, cdn_url, document_type, user_id, is_mobile)
        VALUES (${safeParentId}, '${safeDocName}', '${attachmentDate}', NULL, '${safeMime}', '${safeDocUrl}', ${safeDocTypeId}, ${safeUserId}, 'W')`;
    } else if (transactionType === "Booking") {
      insertQuery = `INSERT INTO d_cfs_booking_attachment 
        (parent_id, file_name, attachment_date, template, mime_type, cdn_url, document_type, user_id)
        VALUES (${safeParentId}, '${safeDocName}', '${attachmentDate}', NULL, '${safeMime}', '${safeDocUrl}', ${safeDocTypeId}, ${safeUserId})`;
    }

    if (insertQuery) {
      await db.executeQuery(databaseName, insertQuery, {}, true);
      console.log(
        `Successfully attached document to ${transactionType} (Parent ID: ${safeParentId})`,
      );
      return true;
    }

    return false;
  } catch (err) {
    console.error(
      `Error in processAttachmentInsert (${transactionType}): ${err.message}`,
    );
    throw err;
  }
}

// ============================================================
// MAIN MESSAGE ROUTER
// ============================================================

/**
 * Central routing entry point for incoming WhatsApp messages.
 *
 * @param {Object} message - Whapi parsed message payload
 */
async function handleMessage(message) {
  try {
    const { type, from, chat_id, from_me, whapi_token } = message;

    // Ignore self-sent messages
    if (from_me) return;

    const whapi = new WhapiService(whapi_token);
    const userId = from;

    // 1. Prioritize media uploads (image / document)
    if (type === "image" || type === "document") {
      return await handleImage(message, whapi);
    }

    // 2. Interactive button/list selection
    if (type === "interactive") {
      return await handleInteractive(message, whapi);
    }

    // 3. Quick reply button response
    if (type === "reply") {
      return await handleReply(message, whapi);
    }

    // 4. Ongoing conversational state (e.g. Document Number input)
    const state = await session.getState(userId);
    if (state && Object.keys(state).length > 0) {
      const handled = await handleFlow(message, state, whapi);
      if (handled) return;
    }

    // 5. Default fallback if no active flow
    await whapi.sendText(chat_id, messages.promptUpload);
  } catch (err) {
    console.error(`Error in handleMessage: ${err.message}`);
  }
}

// ============================================================
// IMAGE & DOCUMENT UPLOAD HANDLER
// ============================================================

/**
 * Handles incoming file media (images, PDFs, documents), performs blur/quality validation,
 * uploads to Backblaze storage, and initiates the appropriate next flow step.
 *
 * @param {Object} message - Incoming message payload containing media
 * @param {WhapiService} whapi - Initialized Whapi API client
 */
async function handleImage(message, whapi) {
  const { chat_id, type, from: userId, userRole } = message;
  const media = message.image || message.document;

  if (!media) {
    await whapi.sendText(chat_id, messages.unsupportedFile);
    return;
  }

  const mime = media.mime_type || "";
  const mimeType = mime || "image/jpeg";
  const extension = mimeTypes.extension(mimeType) || "jpg";
  const fileName = media.file_name || `file_${Date.now()}.${extension}`;

  const uploadsDir = path.join(process.cwd(), "src", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const tempPath = path.join(uploadsDir, fileName);

  try {
    // Download media content from Whapi
    const mediaBuffer = await whapi.downloadMedia(media.id);
    if (!mediaBuffer) {
      await whapi.sendText(chat_id, messages.downloadFailed);
      return;
    }

    fs.writeFileSync(tempPath, mediaBuffer);

    // 1. Process Images
    if (mime.startsWith("image/")) {
      if (media.file_size && media.file_size < 20000) {
        await whapi.sendText(chat_id, messages.lowQuality);
        return;
      }

      // const blurResult = await checkMediaBlur(mediaBuffer, mime);
      // if (blurResult && blurResult.isBlurry) {
      //   await whapi.sendText(chat_id, messages.blurryImage);
      //   return;
      // }

      const uploadRes = await uploadFileToNG({
        filePath: tempPath,
        fileName,
        mimeType: mime,
        docType: type,
      });

      const publicUrl = uploadRes?.data?.public_url || uploadRes?.public_url;
      return await handleDocumentFlow(
        chat_id,
        userId,
        userRole,
        whapi,
        message,
        publicUrl,
        fileName,
        mimeType,
      );
    }

    // 2. Process PDFs
    if (mime === "application/pdf") {
      // const isBlurry = await checkMediaBlur(mediaBuffer, mime);
      // if (isBlurry) {
      //   await whapi.sendText(chat_id, messages.blurryPdf);
      //   return;
      // }

      const uploadRes = await uploadFileToNG({
        filePath: tempPath,
        fileName,
        mimeType: mime,
        docType: type,
      });

      const publicUrl = uploadRes?.data?.public_url || uploadRes?.public_url;
      return await handleDocumentFlow(
        chat_id,
        userId,
        userRole,
        whapi,
        message,
        publicUrl,
        fileName,
        mimeType,
      );
    }

    // 3. Process CSV/Spreadsheets
    if (
      mime === "text/csv" ||
      mime.includes("excel") ||
      mime.includes("spreadsheet")
    ) {
      await whapi.sendText(
        chat_id,
        `📊 File received: *${fileName}*\n\nNo image quality check required.\nProcessing data file...`,
      );
      return;
    }

    // Unsupported media types
    await whapi.sendText(
      chat_id,
      `📄 File received: *${fileName}*\n\nThis file format is not supported for automatic processing.`,
    );
  } catch (err) {
    console.error(`Error in handleImage: ${err.message}`);
    await whapi.sendText(chat_id, messages.internalError);
  } finally {
    // Guaranteed cleanup of temporary disk buffer
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (cleanupErr) {
        console.error(
          `Failed to delete temp file ${tempPath}: ${cleanupErr.message}`,
        );
      }
    }
  }
}

// ============================================================
// DOCUMENT FLOW INITIALIZER
// ============================================================

/**
 * Routes users post-upload depending on their role:
 * - Drivers: Directly shown dynamic document types for "Shipment Order"
 * - Agents: Shown choice between Shipment Order, File Master, and Booking
 *
 * @param {string} chatId - Whapi chat ID
 * @param {string} userId - User phone/identifier
 * @param {string} userRole - "DRIVER" or "AGENT"
 * @param {WhapiService} whapi - API client
 * @param {Object} message - Raw message context
 * @param {string} publicUrl - Uploaded file CDN link
 * @param {string} docPath - Original file name
 * @param {string} mimeType - Media MIME type
 */
async function handleDocumentFlow(
  chatId,
  userId,
  userRole,
  whapi,
  message,
  publicUrl,
  docPath,
  mimeType,
) {
  try {
    // 🧑‍💼 AGENT FLOW: Offer all 3 Transaction types
    if (userRole === "AGENT") {
      await session.setState(userId, "AGENT_TRANSACTION", {
        agent_id: message.agent_id,
        userRole: "AGENT",
        docUrl: publicUrl,
        docPath,
        mimeType,
      });

      return await whapi.sendButtons(chatId, messages.enterTransaction, [
        { id: "agent_shipmentOrder", title: agentButtonTitles.shipmentOrder },
        { id: "agent_fileMaster", title: agentButtonTitles.fileMaster },
        { id: "agent_booking", title: agentButtonTitles.booking },
      ]);
    }

    // 🚚 DRIVER FLOW: Automatically defaults to "Shipment Order" and fetches dynamic doc types directly
    await session.setState(userId, "TRANSACTION_SUB_TYPE", {
      driver_id: message.driver_id,
      userRole: "DRIVER",
      docUrl: publicUrl,
      docPath,
      mimeType,
      transactionType: "Shipment Order",
      docPageIndex: 0,
    });

    return await sendPaginatedDynamicDocButtons(
      chatId,
      userId,
      message.databaseName,
      "Shipment Order",
      whapi,
      0,
    );
  } catch (err) {
    console.error(`Error in handleDocumentFlow: ${err.message}`);
    await whapi.sendText(chatId, messages.internalError);
  }
}

// ============================================================
// INTERACTIVE SELECTION HANDLER
// ============================================================

/**
 * Handles menu buttons or list selections (e.g. manual role selection triggers).
 *
 * @param {Object} message - Raw message
 * @param {WhapiService} whapi - API client
 */
async function handleInteractive(message, whapi) {
  try {
    const { chat_id, from: userId, interactive } = message;
    const rawBtnId =
      interactive?.button_reply?.id || interactive?.list_reply?.id;
    const btnId = normalizeButtonId(rawBtnId);

    if (!btnId) return;

    if (btnId === "user_driver") {
      await session.setState(userId, "DRIVER_TRANSACTION", {});
      return await whapi.sendButtons(chat_id, messages.enterTransaction, [
        { id: "drive_shipmentOrder", title: "Shipment Order" },
      ]);
    }

    if (btnId === "user_agent") {
      await session.setState(userId, "AGENT_TRANSACTION", {});
      return await whapi.sendText(chat_id, messages.enterTransaction);
    }
  } catch (err) {
    console.error(`Error in handleInteractive: ${err.message}`);
  }
}

// ============================================================
// BUTTON REPLY HANDLER
// ============================================================

/**
 * Handles button click replies for transaction selection and dynamic document type choices.
 *
 * @param {Object} message - Incoming button reply message
 * @param {WhapiService} whapi - API client
 */
async function handleReply(message, whapi) {
  try {
    const { chat_id, from: userId, reply } = message;
    const rawBtnId = reply?.buttons_reply?.id;
    const btnId = normalizeButtonId(rawBtnId);

    if (!btnId) return;

    const stateData = (await session.get(userId)) || {};

    // ────────────────────────────────────────────────────────────
    // STEP 1: Transaction Type Selection (Shipment Order, File Master, Booking)
    // ────────────────────────────────────────────────────────────
    const transactionMap = {
      drive_shipmentOrder: "Shipment Order",
      agent_shipmentOrder: "Shipment Order",
      agent_fileMaster: "File Master",
      agent_booking: "Booking",
    };

    if (transactionMap[btnId]) {
      if (!stateData || !stateData.docUrl) {
        return await whapi.sendText(chat_id, messages.promptUpload);
      }

      const selectedTransaction = transactionMap[btnId];

      await session.setState(userId, "TRANSACTION_SUB_TYPE", {
        ...stateData,
        transactionType: selectedTransaction,
        docPageIndex: 0,
      });

      return await sendPaginatedDynamicDocButtons(
        chat_id,
        userId,
        message.databaseName,
        selectedTransaction,
        whapi,
        0,
      );
    }

    // ────────────────────────────────────────────────────────────
    // STEP 2: Document Type Button Selection (e.g. doc_pod_1, doc_receipt_2, doc_other)
    // ────────────────────────────────────────────────────────────
    if (btnId === "doc_other") {
      // Check if there is an active document upload session
      if (
        !stateData ||
        !stateData.docUrl ||
        stateData.state !== "TRANSACTION_SUB_TYPE"
      ) {
        return await whapi.sendText(chat_id, messages.promptUpload);
      }

      const activeTransaction = stateData.transactionType || "Shipment Order";
      const currentPage = stateData.docPageIndex || 0;
      const nextPage = currentPage + 1;

      return await sendPaginatedDynamicDocButtons(
        chat_id,
        userId,
        message.databaseName,
        activeTransaction,
        whapi,
        nextPage,
      );
    }

    if (btnId.startsWith("doc_")) {
      // Check if session is active. If session was already completed or expired, prompt for upload
      if (
        !stateData ||
        !stateData.docUrl ||
        stateData.state !== "TRANSACTION_SUB_TYPE"
      ) {
        return await whapi.sendText(chat_id, messages.promptUpload);
      }

      const activeTransaction = stateData.transactionType || "Shipment Order";
      const dynamicDocButtons = await fetchDynamicDocButtons(
        message.databaseName,
        activeTransaction,
      );

      const matchedButton = dynamicDocButtons.find((item) => item.id === btnId);

      if (matchedButton) {
        const docTypeId = parseInt(btnId.split("_").pop(), 10);
        const docName = matchedButton.title;

        // 🚚 DRIVER SEPARATE FLOW
        if (stateData.userRole === "DRIVER") {
          const docUrl = stateData.docUrl;
          const driver_id = stateData.driver_id;

          const strQuery = `select top 1 T0.driver_name,T1.tripno,T0.parent_id FROM 
            d_fm_shipmentorder_vehicledetails 
            T0 JOIN d_fm_shipmentorder T1 ON T0.parent_id=T1.id
            where T0.driver_id=${driver_id} AND T1.order_status='O'
            ORDER by T0.parent_id DESC`;

          const result = await db.executeQuery(
            message.databaseName,
            strQuery,
            {},
            true,
          );

          if (!result || !result[0]) {
            await session.delete(userId);
            return await whapi.sendText(
              chat_id,
              "We can not find any open trip for you.",
            );
          }

          const ship_id = result[0].parent_id;
          const pod_date = new Date();
          const formattedDate = pod_date.toISOString().split("T")[0];

          const strInsertQuery = `
            INSERT INTO d_fm_shipmentorder_attachment
            (
              parent_id,
              file_name,
              attachment_date,
              cdn_url,
              is_mobile,
              document_type
            )
            VALUES
            (
              ${ship_id},
              '${docName}',
              '${formattedDate}',
              '${docUrl}',
              'Y',
              ${docTypeId}
            )
          `;

          await db.executeQuery(message.databaseName, strInsertQuery, {}, true);

          await session.delete(userId);

          return await whapi.sendText(chat_id, messages.successDoc(docName));
        }

        // 🧑‍💼 AGENT FLOW
        if (stateData.userRole === "AGENT") {
          await session.setState(userId, "DOC_NUMBER_INPUT", {
            ...stateData,
            DocumentType: matchedButton.title,
            doc_type_id: docTypeId,
          });

          return await whapi.sendText(chat_id, messages.enterDocNo);
        }

        // Fallback if userRole is missing or corrupted
        await session.delete(userId);
        return await whapi.sendText(chat_id, messages.promptUpload);
      }
    }

    // Fallback if button did not match active context
    await whapi.sendText(chat_id, messages.promptUpload);
  } catch (err) {
    console.error(`Error in handleReply: ${err.message}`);
    await whapi.sendText(message.chat_id, messages.internalError);
  }
}

// ============================================================
// CONVERSATIONAL STATE & TEXT INPUT FLOW (AGENT EXCLUSIVE)
// ============================================================

/**
 * Handles text input during active state flows (Agent document number entry).
 * NOTE: Drivers complete in a single step upon selecting document type in handleReply.
 *
 * @param {Object} message - Incoming text message
 * @param {string} state - Current session state key
 * @param {WhapiService} whapi - API client
 * @returns {Promise<boolean>} True if handled, false otherwise
 */
async function handleFlow(message, state, whapi) {
  try {
    const { chat_id, from: userId } = message;
    const text = (message.text?.body || "").trim();

    switch (state) {
      case "DOC_NUMBER_INPUT":
      case "AGENT_DOC_NUMBER": {
        const data = await session.get(userId);
        if (!data) {
          await whapi.sendText(chat_id, messages.promptUpload);
          return true;
        }

        const transactionType = data.transactionType || "Shipment Order";

        // Validate document number in target table
        const docRecord = await validateAgentDocNumber(
          message.databaseName,
          transactionType,
          text,
        );

        if (!docRecord) {
          await whapi.sendText(
            chat_id,
            messages.invalidDocNumber(transactionType),
          );
          return true;
        }

        // Insert attachment record into database for AGENT
        await processAttachmentInsert(
          message.databaseName,
          transactionType,
          docRecord.id,
          data.docPath,
          data.docUrl,
          data.mimeType,
          data.doc_type_id,
          data.agent_id,
          "AGENT",
          message.agent_name,
        );

        // Clear active session once completed
        await session.delete(userId);

        // Notify agent of success
        await whapi.sendText(
          chat_id,
          messages.submitted(transactionType, data.DocumentType, text),
        );

        return true;
      }

      default:
        return false;
    }
  } catch (err) {
    console.error(`Error in handleFlow: ${err.message}`);
    await whapi.sendText(message.chat_id, messages.internalError);
    return true;
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  handleMessage,
  handleInteractive,
  validateAgentDocNumber,
  processAttachmentInsert,
  fetchDynamicDocButtons,
  sendPaginatedDynamicDocButtons,
};






// const fs = require("fs");
// const path = require("path");
// const mimeTypes = require("mime-types");

// const WhapiService = require("./apiConfig");
// const session = require("./sessionStore");
// const { checkMediaBlur } = require("./blurCheck");
// const db = require("../../config/database");
// const uploadFileToNG = require("./backblaze");

// // ============================================================
// // CONSTANTS & TEMPLATES
// // ============================================================

// /**
//  * Standard user-facing message strings used throughout the bot conversation.
//  */
// const messages = {
//   selectDoc: "📦 Select document type:",
//   enterTransaction: "Select *Transaction Type*:",
//   enterDocNo: "🔢 Enter *Document Number*:",
//   selectDocType: "📄 Select Document Type:",
//   promptUpload: "📸 Please send an image to start the process.",
//   unsupportedFile: "❌ Unsupported file format.",
//   downloadFailed: "❌ Failed to retrieve uploaded file. Please try again.",
//   lowQuality: "❌ Image quality too low. Please upload a clearer photo.",
//   blurryImage: "❌ The image is blurry. Please upload a clear photo.",
//   blurryPdf:
//     "❌ The PDF contains blurry pages. Please upload a clear document.",
//   internalError:
//     "⚠️ An unexpected error occurred while processing your request. Please try again.",
//   invalidDocNumber: (type) =>
//     `Document number you entered for *${type}* is not valid, please re-enter a valid number.`,
//   successDoc: (type) => `✅ *${type}* document received successfully.`,
//   submitted: (transactionType, docType, docNum) =>
//     `✅ Document submitted!\n\n` +
//     `📑 Transaction Type: *${transactionType}*\n` +
//     `📄 Doc Type: *${docType}*\n` +
//     `🔢 Doc No: *${docNum}*`,
// };

// /**
//  * Static button titles for Agent transaction options.
//  */
// const agentButtonTitles = {
//   shipmentOrder: "Shipment Order",
//   fileMaster: "File Master",
//   booking: "Booking",
// };

// // ============================================================
// // UTILITIES & DATABASE HELPERS
// // ============================================================

// /**
//  * Escapes single quotes to prevent SQL injection and syntax errors.
//  *
//  * @param {any} input - Raw string or value to sanitize
//  * @returns {string} Sanitized string safe for SQL concatenation
//  */
// function sanitizeInput(input) {
//   try {
//     if (typeof input !== "string") return String(input ?? "");
//     return input.replace(/'/g, "''").trim();
//   } catch (err) {
//     console.error(`Error in sanitizeInput: ${err.message}`);
//     return "";
//   }
// }

// /**
//  * Normalizes button IDs received from Whapi, stripping potential prefix wrappers (e.g. "ButtonsV3:").
//  *
//  * @param {string} rawId - The raw button ID from the webhook payload
//  * @returns {string} Normalized button identifier
//  */
// function normalizeButtonId(rawId) {
//   if (!rawId || typeof rawId !== "string") return "";
//   return rawId.startsWith("ButtonsV3:")
//     ? rawId.replace("ButtonsV3:", "")
//     : rawId;
// }

// /**
//  * Fetches dynamic document type options from `m_required_document` based on the selected transaction type.
//  *
//  * @param {string} databaseName - Tenant database name
//  * @param {string} transactionType - "Shipment Order", "File Master", or "Booking"
//  * @returns {Promise<Array<{id: string, title: string}>>} List of button objects
//  */
// async function fetchDynamicDocButtons(databaseName, transactionType) {
//   try {
//     let docTypeFilter = "('B','T')"; // Default for Shipment Order

//     if (transactionType === "File Master" || transactionType === "Booking") {
//       docTypeFilter = "('B','C')";
//     }

//     const query = `SELECT TOP 18 id, name FROM m_required_document WHERE is_active='Y' AND doc_type IN ${docTypeFilter}`;
//     const results = await db.executeQuery(databaseName, query, {}, true);

//     if (!Array.isArray(results) || results.length === 0) {
//       console.warn(
//         `No dynamic document types found for transaction: ${transactionType}`,
//       );
//       return [];
//     }

//     return results.map((doc) => ({
//       id: `doc_${String(doc.name).toLowerCase().replace(/\s+/g, "_")}_${doc.id}`,
//       title: doc.name,
//     }));
//   } catch (err) {
//     console.error(`Error in fetchDynamicDocButtons: ${err.message}`);
//     return [];
//   }
// }

// /**
//  * Validates whether a provided document number exists in the corresponding transaction table.
//  *
//  * @param {string} databaseName - Tenant database name
//  * @param {string} transactionType - Transaction category ("Shipment Order", "File Master", or "Booking")
//  * @param {string} docNum - Document identifier entered by the user
//  * @returns {Promise<Object|null>} Found record object or null if not found/error
//  */
// async function validateAgentDocNumber(databaseName, transactionType, docNum) {
//   try {
//     const safeDocNum = sanitizeInput(docNum);
//     if (!safeDocNum) return null;

//     let query = "";
//     if (transactionType === "Shipment Order") {
//       query = `SELECT id FROM d_fm_shipmentorder WHERE doc_num='${safeDocNum}' LIMIT 1`;
//     } else if (transactionType === "File Master") {
//       query = `SELECT id FROM d_cf_filemaster WHERE doc_num='${safeDocNum}' LIMIT 1`;
//     } else if (transactionType === "Booking") {
//       query = `SELECT id FROM d_cfs_booking WHERE doc_num='${safeDocNum}' LIMIT 1`;
//     } else {
//       console.warn(
//         `validateAgentDocNumber received unknown transactionType: ${transactionType}`,
//       );
//       return null;
//     }

//     const result = await db.executeQuery(databaseName, query, {}, true);
//     return result && result.length > 0 ? result[0] : null;
//   } catch (err) {
//     console.error(
//       `Error in validateAgentDocNumber (${transactionType}, ${docNum}): ${err.message}`,
//     );
//     return null;
//   }
// }

// /**
//  * Inserts the uploaded document metadata into the appropriate attachment table.
//  *
//  * @param {string} databaseName - Tenant database name
//  * @param {string} transactionType - "Shipment Order", "File Master", or "Booking"
//  * @param {number|string} parentId - ID of parent transaction record
//  * @param {string} docName - Saved file name
//  * @param {string} docUrl - Backblaze public CDN URL
//  * @param {string} mimeType - Media MIME type
//  * @param {number|string} docTypeId - ID from m_required_document
//  * @param {number|string} userId - ID of driver or agent
//  * @param {string} userRole - "DRIVER" or "AGENT"
//  * @param {string} userName - Optional username of the agent
//  * @returns {Promise<boolean>} Success status of the insert
//  */
// async function processAttachmentInsert(
//   databaseName,
//   transactionType,
//   parentId,
//   docName,
//   docUrl,
//   mimeType,
//   docTypeId,
//   userId,
//   userRole,
//   userName,
// ) {
//   try {
//     const attachmentDate = new Date()
//       .toISOString()
//       .replace("T", " ")
//       .substring(0, 23);
//     const safeDocName = sanitizeInput(docName);
//     const safeDocUrl = sanitizeInput(docUrl);
//     const safeMime = sanitizeInput(mimeType);
//     const safeUserName = sanitizeInput(userName || "");
//     const safeParentId = parseInt(parentId, 10);
//     const safeDocTypeId = docTypeId ? parseInt(docTypeId, 10) : "NULL";
//     const safeUserId = userId ? parseInt(userId, 10) : "NULL";

//     let insertQuery = "";

//     if (transactionType === "Shipment Order") {
//       insertQuery = `INSERT INTO d_fm_shipmentorder_attachment 
//         (parent_id, file_name, attachment_date, template, mime_type, cdn_url, document_type, user_name, is_mobile)
//         VALUES (${safeParentId}, '${safeDocName}', '${attachmentDate}', NULL, '${safeMime}', '${safeDocUrl}', ${safeDocTypeId}, '${safeUserName}', 'W')`;
//     } else if (transactionType === "File Master") {
//       insertQuery = `INSERT INTO d_cf_filemaster_attachment 
//         (parent_id, file_name, attachment_date, template, mime_type, cdn_url, document_type, user_id, is_mobile)
//         VALUES (${safeParentId}, '${safeDocName}', '${attachmentDate}', NULL, '${safeMime}', '${safeDocUrl}', ${safeDocTypeId}, ${safeUserId}, 'W')`;
//     } else if (transactionType === "Booking") {
//       insertQuery = `INSERT INTO d_cfs_booking_attachment 
//         (parent_id, file_name, attachment_date, template, mime_type, cdn_url, document_type, user_id)
//         VALUES (${safeParentId}, '${safeDocName}', '${attachmentDate}', NULL, '${safeMime}', '${safeDocUrl}', ${safeDocTypeId}, ${safeUserId})`;
//     }

//     if (insertQuery) {
//       await db.executeQuery(databaseName, insertQuery, {}, true);
//       console.log(
//         `Successfully attached document to ${transactionType} (Parent ID: ${safeParentId})`,
//       );
//       return true;
//     }

//     return false;
//   } catch (err) {
//     console.error(
//       `Error in processAttachmentInsert (${transactionType}): ${err.message}`,
//     );
//     throw err;
//   }
// }

// // ============================================================
// // MAIN MESSAGE ROUTER
// // ============================================================

// /**
//  * Central routing entry point for incoming WhatsApp messages.
//  *
//  * @param {Object} message - Whapi parsed message payload
//  */
// async function handleMessage(message) {
//   try {
//     const { type, from, chat_id, from_me, whapi_token } = message;

//     // Ignore self-sent messages
//     if (from_me) return;

//     const whapi = new WhapiService(whapi_token);
//     const userId = from;

//     // 1. Prioritize media uploads (image / document)
//     if (type === "image" || type === "document") {
//       return await handleImage(message, whapi);
//     }

//     // 2. Interactive button/list selection
//     if (type === "interactive") {
//       return await handleInteractive(message, whapi);
//     }

//     // 3. Quick reply button response
//     if (type === "reply") {
//       return await handleReply(message, whapi);
//     }

//     // 4. Ongoing conversational state (e.g. Document Number input)
//     const state = await session.getState(userId);
//     if (state && Object.keys(state).length > 0) {
//       const handled = await handleFlow(message, state, whapi);
//       if (handled) return;
//     }

//     // 5. Default fallback if no active flow
//     await whapi.sendText(chat_id, messages.promptUpload);
//   } catch (err) {
//     console.error(`Error in handleMessage: ${err.message}`);
//   }
// }

// // ============================================================
// // IMAGE & DOCUMENT UPLOAD HANDLER
// // ============================================================

// /**
//  * Handles incoming file media (images, PDFs, documents), performs blur/quality validation,
//  * uploads to Backblaze storage, and initiates the appropriate next flow step.
//  *
//  * @param {Object} message - Incoming message payload containing media
//  * @param {WhapiService} whapi - Initialized Whapi API client
//  */
// async function handleImage(message, whapi) {
//   const { chat_id, type, from: userId, userRole } = message;
//   const media = message.image || message.document;

//   if (!media) {
//     await whapi.sendText(chat_id, messages.unsupportedFile);
//     return;
//   }

//   const mime = media.mime_type || "";
//   const mimeType = mime || "image/jpeg";
//   const extension = mimeTypes.extension(mimeType) || "jpg";
//   const fileName = media.file_name || `file_${Date.now()}.${extension}`;

//   const uploadsDir = path.join(process.cwd(), "src", "uploads");
//   if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir, { recursive: true });
//   }

//   const tempPath = path.join(uploadsDir, fileName);

//   try {
//     // Download media content from Whapi
//     const mediaBuffer = await whapi.downloadMedia(media.id);
//     if (!mediaBuffer) {
//       await whapi.sendText(chat_id, messages.downloadFailed);
//       return;
//     }

//     fs.writeFileSync(tempPath, mediaBuffer);

//     // 1. Process Images
//     if (mime.startsWith("image/")) {
//       if (media.file_size && media.file_size < 20000) {
//         await whapi.sendText(chat_id, messages.lowQuality);
//         return;
//       }

//       // const blurResult = await checkMediaBlur(mediaBuffer, mime);
//       // if (blurResult && blurResult.isBlurry) {
//       //   await whapi.sendText(chat_id, messages.blurryImage);
//       //   return;
//       // }

//       const uploadRes = await uploadFileToNG({
//         filePath: tempPath,
//         fileName,
//         mimeType: mime,
//         docType: type,
//       });

//       const publicUrl = uploadRes?.data?.public_url || uploadRes?.public_url;
//       return await handleDocumentFlow(
//         chat_id,
//         userId,
//         userRole,
//         whapi,
//         message,
//         publicUrl,
//         fileName,
//         mimeType,
//       );
//     }

//     // 2. Process PDFs
//     if (mime === "application/pdf") {
//       // const isBlurry = await checkMediaBlur(mediaBuffer, mime);
//       // if (isBlurry) {
//       //   await whapi.sendText(chat_id, messages.blurryPdf);
//       //   return;
//       // }

//       const uploadRes = await uploadFileToNG({
//         filePath: tempPath,
//         fileName,
//         mimeType: mime,
//         docType: type,
//       });

//       const publicUrl = uploadRes?.data?.public_url || uploadRes?.public_url;
//       return await handleDocumentFlow(
//         chat_id,
//         userId,
//         userRole,
//         whapi,
//         message,
//         publicUrl,
//         fileName,
//         mimeType,
//       );
//     }

//     // 3. Process CSV/Spreadsheets
//     if (
//       mime === "text/csv" ||
//       mime.includes("excel") ||
//       mime.includes("spreadsheet")
//     ) {
//       await whapi.sendText(
//         chat_id,
//         `📊 File received: *${fileName}*\n\nNo image quality check required.\nProcessing data file...`,
//       );
//       return;
//     }

//     // Unsupported media types
//     await whapi.sendText(
//       chat_id,
//       `📄 File received: *${fileName}*\n\nThis file format is not supported for automatic processing.`,
//     );
//   } catch (err) {
//     console.error(`Error in handleImage: ${err.message}`);
//     await whapi.sendText(chat_id, messages.internalError);
//   } finally {
//     // Guaranteed cleanup of temporary disk buffer
//     if (fs.existsSync(tempPath)) {
//       try {
//         fs.unlinkSync(tempPath);
//       } catch (cleanupErr) {
//         console.error(
//           `Failed to delete temp file ${tempPath}: ${cleanupErr.message}`,
//         );
//       }
//     }
//   }
// }

// // ============================================================
// // DOCUMENT FLOW INITIALIZER
// // ============================================================

// /**
//  * Routes users post-upload depending on their role:
//  * - Drivers: Directly shown dynamic document types for "Shipment Order"
//  * - Agents: Shown choice between Shipment Order, File Master, and Booking
//  *
//  * @param {string} chatId - Whapi chat ID
//  * @param {string} userId - User phone/identifier
//  * @param {string} userRole - "DRIVER" or "AGENT"
//  * @param {WhapiService} whapi - API client
//  * @param {Object} message - Raw message context
//  * @param {string} publicUrl - Uploaded file CDN link
//  * @param {string} docPath - Original file name
//  * @param {string} mimeType - Media MIME type
//  */
// async function handleDocumentFlow(
//   chatId,
//   userId,
//   userRole,
//   whapi,
//   message,
//   publicUrl,
//   docPath,
//   mimeType,
// ) {
//   try {
//     // 🧑‍💼 AGENT FLOW: Offer all 3 Transaction types
//     if (userRole === "AGENT") {
//       await session.setState(userId, "AGENT_TRANSACTION", {
//         agent_id: message.agent_id,
//         userRole: "AGENT",
//         docUrl: publicUrl,
//         docPath,
//         mimeType,
//       });

//       return await whapi.sendButtons(chatId, messages.enterTransaction, [
//         { id: "agent_shipmentOrder", title: agentButtonTitles.shipmentOrder },
//         { id: "agent_fileMaster", title: agentButtonTitles.fileMaster },
//         { id: "agent_booking", title: agentButtonTitles.booking },
//       ]);
//     }

//     // 🚚 DRIVER FLOW: Automatically defaults to "Shipment Order" and fetches dynamic doc types directly
//     await session.setState(userId, "TRANSACTION_SUB_TYPE", {
//       driver_id: message.driver_id,
//       userRole: "DRIVER",
//       docUrl: publicUrl,
//       docPath,
//       mimeType,
//       transactionType: "Shipment Order",
//     });

//     const dynamicDocButtons = await fetchDynamicDocButtons(
//       message.databaseName,
//       "Shipment Order",
//     );

//     if (dynamicDocButtons.length === 0) {
//       await whapi.sendText(
//         chatId,
//         "⚠️ No active document types found. Please contact support.",
//       );
//       return;
//     }

//     return await whapi.sendButtons(
//       chatId,
//       messages.selectDocType,
//       dynamicDocButtons,
//       // [
//       //    { id: 'doc_cop_1', title: 'COP' },
//       //   { id: 'doc_receipt_2', title: 'Receipt' },
//       //   { id: 'doc_bon_de_sorte_3', title: 'Bon de Sorte' },
//       //   { id: 'doc_entry_card_4', title: 'Entry Card' },
//       //   {
//       //     id: 'doc_kurasini_-_weigh_bridge_5',
//       //     title: 'KURASINI - WEIGH BRIDGE'
//       //   },
//       //   { id: 'doc_movement_sheet_6', title: 'Movement Sheet' },
//       //   { id: 'doc_rit_-_going_7', title: 'RIT - GOING' },
//       //   { id: 'doc_rit_-_return_8', title: 'RIT - RETURN' },
//       //   { id: 'doc_delivery_note_9', title: 'Delivery Note' },
//       //   { id: 'doc_drop_off_receipt_10', title: 'Drop off Receipt' },
//       //   { id: 'doc_inward_interchange_11', title: 'Inward Interchange' },
//       //   { id: 'doc_t1_12', title: 'T1' },
//       //   { id: 'doc_zra_-drc_sydonia_13', title: 'ZRA -DRC Sydonia' },
//       //   {
//       //     id: 'doc_road_freight_manifest_14',
//       //     title: 'Road Freight Manifest'
//       //   },
//       //   { id: 'doc_commercial_invoice_15', title: 'Commercial Invoice' },
//       //   { id: 'doc_packing_list_16', title: 'Packing List' },
//       //   {
//       //     id: 'doc_loading_weighbridge_receipt__17',
//       //     title: 'Loading Weighbridge Receipt '
//       //   },
//       //   {
//       //     id: 'doc_offloading_weighbridge_receipt_18',
//       //     title: 'Offloading Weighbridge Receipt'
//       //   },
//       //   { id: 'doc_itm_19', title: 'ITM' },
//       //   { id: 'doc_wiski_receipt_kbp__20', title: 'Wiski Receipt KBP ' },
//       //   { id: 'doc_occ_21', title: 'OCC' },
//       //   { id: 'doc_border_receipts_22', title: 'Border Receipts' },
//       //   { id: 'doc_photos_24', title: 'Photos' }
//       // ]
//     );
//   } catch (err) {
//     console.error(`Error in handleDocumentFlow: ${err.message}`);
//     await whapi.sendText(chatId, messages.internalError);
//   }
// }

// // ============================================================
// // INTERACTIVE SELECTION HANDLER
// // ============================================================

// /**
//  * Handles menu buttons or list selections (e.g. manual role selection triggers).
//  *
//  * @param {Object} message - Raw message
//  * @param {WhapiService} whapi - API client
//  */
// async function handleInteractive(message, whapi) {
//   try {
//     const { chat_id, from: userId, interactive } = message;
//     const rawBtnId =
//       interactive?.button_reply?.id || interactive?.list_reply?.id;
//     const btnId = normalizeButtonId(rawBtnId);

//     if (!btnId) return;

//     if (btnId === "user_driver") {
//       await session.setState(userId, "DRIVER_TRANSACTION", {});
//       return await whapi.sendButtons(chat_id, messages.enterTransaction, [
//         { id: "drive_shipmentOrder", title: "Shipment Order" },
//       ]);
//     }

//     if (btnId === "user_agent") {
//       await session.setState(userId, "AGENT_TRANSACTION", {});
//       return await whapi.sendText(chat_id, messages.enterTransaction);
//     }
//   } catch (err) {
//     console.error(`Error in handleInteractive: ${err.message}`);
//   }
// }

// // ============================================================
// // BUTTON REPLY HANDLER
// // ============================================================

// /**
//  * Handles button click replies for transaction selection and dynamic document type choices.
//  *
//  * @param {Object} message - Incoming button reply message
//  * @param {WhapiService} whapi - API client
//  */
// async function handleReply(message, whapi) {
//   try {
//     const { chat_id, from: userId, reply } = message;
//     const rawBtnId = reply?.buttons_reply?.id;
//     const btnId = normalizeButtonId(rawBtnId);
//     console.log("BtnId",btnId);
//     if (!btnId) return;

//     const stateData = (await session.get(userId)) || {};

//     // ────────────────────────────────────────────────────────────
//     // STEP 1: Transaction Type Selection (Shipment Order, File Master, Booking)
//     // ────────────────────────────────────────────────────────────
//     const transactionMap = {
//       drive_shipmentOrder: "Shipment Order",
//       agent_shipmentOrder: "Shipment Order",
//       agent_fileMaster: "File Master",
//       agent_booking: "Booking",
//     };

//     if (transactionMap[btnId]) {
//       const selectedTransaction = transactionMap[btnId];

//       await session.setState(userId, "TRANSACTION_SUB_TYPE", {
//         ...stateData,
//         transactionType: selectedTransaction,
//       });

//       const dynamicDocButtons = await fetchDynamicDocButtons(
//         message.databaseName,
//         selectedTransaction,
//       );

//       if (dynamicDocButtons.length === 0) {
//         return await whapi.sendText(
//           chat_id,
//           "⚠️ No document categories available for this transaction.",
//         );
//       }

//       return await whapi.sendButtons(
//         chat_id,
//         messages.selectDocType,
//         dynamicDocButtons,
//       );
//     }

//     // ────────────────────────────────────────────────────────────
//     // STEP 2: Document Type Button Selection (e.g. doc_pod_1, doc_receipt_2)
//     // ────────────────────────────────────────────────────────────
//     console.log("STEP 2: Document Type Button Selection (e.g. doc_pod_1, doc_receipt_2)");
//     if (btnId.startsWith("doc_")) {
//       const activeTransaction = stateData.transactionType || "Shipment Order";
//       const dynamicDocButtons = await fetchDynamicDocButtons(
//         message.databaseName,
//         activeTransaction,
//       );

//       const matchedButton = dynamicDocButtons.find((item) => item.id === btnId);

//       if (matchedButton) {
//         const docTypeId = parseInt(btnId.split("_").pop(), 10);
//         const docName = matchedButton.title;
//         console.log("DRIVER SEPARATE FLOW 1");
//         // 🚚 DRIVER SEPARATE FLOW
//         if (stateData.userRole === "DRIVER") {
//           const docUrl = stateData.docUrl;
//           const driver_id = stateData.driver_id;

//           const strQuery = `select top 1 T0.driver_name,T1.tripno,T0.parent_id FROM 
//             d_fm_shipmentorder_vehicledetails 
//             T0 JOIN d_fm_shipmentorder T1 ON T0.parent_id=T1.id
//             where T0.driver_id=${driver_id} AND T1.order_status='O'
//             ORDER by T0.parent_id DESC`;

//           const result = await db.executeQuery(
//             message.databaseName,
//             strQuery,
//             {},
//             true,
//           );

//           if (!result || !result[0]) {
//             await session.delete(userId);
//             return await whapi.sendText(
//               chat_id,
//               "We can not find any open trip for you.",
//             );
//           }

//           const ship_id = result[0].parent_id;
//           const pod_date = new Date();
//           const formattedDate = pod_date.toISOString().split("T")[0];

//           const strInsertQuery = `
//             INSERT INTO d_fm_shipmentorder_attachment
//             (
//               parent_id,
//               file_name,
//               attachment_date,
//               cdn_url,
//               is_mobile,
//               document_type
//             )
//             VALUES
//             (
//               ${ship_id},
//               '${docName}',
//               '${formattedDate}',
//               '${docUrl}',
//               'Y',
//               ${docTypeId}
//             )
//           `;

//           await db.executeQuery(message.databaseName, strInsertQuery, {}, true);

//           await session.delete(userId);

//           return await whapi.sendText(chat_id, messages.successDoc(docName));
//         }

//         // 🧑‍💼 AGENT FLOW
//         await session.setState(userId, "DOC_NUMBER_INPUT", {
//           ...stateData,
//           DocumentType: matchedButton.title,
//           doc_type_id: docTypeId,
//         });

//         return await whapi.sendText(chat_id, messages.enterDocNo);
//       }
//     }

//     // Fallback if button did not match active context
//     await whapi.sendText(chat_id, messages.promptUpload);
//   } catch (err) {
//     console.error(`Error in handleReply: ${err.message}`);
//     await whapi.sendText(message.chat_id, messages.internalError);
//   }
// }

// // ============================================================
// // CONVERSATIONAL STATE & TEXT INPUT FLOW (AGENT EXCLUSIVE)
// // ============================================================

// /**
//  * Handles text input during active state flows (Agent document number entry).
//  * NOTE: Drivers complete in a single step upon selecting document type in handleReply.
//  *
//  * @param {Object} message - Incoming text message
//  * @param {string} state - Current session state key
//  * @param {WhapiService} whapi - API client
//  * @returns {Promise<boolean>} True if handled, false otherwise
//  */
// async function handleFlow(message, state, whapi) {
//   try {
//     const { chat_id, from: userId } = message;
//     const text = (message.text?.body || "").trim();

//     switch (state) {
//       case "DOC_NUMBER_INPUT":
//       case "AGENT_DOC_NUMBER": {
//         const data = await session.get(userId);
//         if (!data) {
//           await whapi.sendText(chat_id, messages.promptUpload);
//           return true;
//         }

//         const transactionType = data.transactionType || "Shipment Order";

//         // Validate document number in target table
//         const docRecord = await validateAgentDocNumber(
//           message.databaseName,
//           transactionType,
//           text,
//         );

//         if (!docRecord) {
//           await whapi.sendText(
//             chat_id,
//             messages.invalidDocNumber(transactionType),
//           );
//           return true;
//         }

//         // Insert attachment record into database for AGENT
//         await processAttachmentInsert(
//           message.databaseName,
//           transactionType,
//           docRecord.id,
//           data.docPath,
//           data.docUrl,
//           data.mimeType,
//           data.doc_type_id,
//           data.agent_id,
//           "AGENT",
//           message.agent_name,
//         );

//         // Clear active session once completed
//         await session.delete(userId);

//         // Notify agent of success
//         await whapi.sendText(
//           chat_id,
//           messages.submitted(transactionType, data.DocumentType, text),
//         );

//         return true;
//       }

//       default:
//         return false;
//     }
//   } catch (err) {
//     console.error(`Error in handleFlow: ${err.message}`);
//     await whapi.sendText(message.chat_id, messages.internalError);
//     return true;
//   }
// }

// // ============================================================
// // EXPORTS
// // ============================================================

// module.exports = {
//   handleMessage,
//   handleInteractive,
//   validateAgentDocNumber,
//   processAttachmentInsert,
// };
