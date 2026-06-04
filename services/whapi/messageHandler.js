const WhapiService = require("./apiConfig");
const session = require("./sessionStore");
const {checkMediaBlur } = require("./blurCheck");
const db = require('../../config/database');
const uploadFileToNG = require("./backblaze");
const fs = require("fs");
const mimeTypes = require("mime-types");
const path = require("path");

// ============================================================
// ENTRY POINT
// ============================================================
async function handleMessage(message) {
  try {
    const { type, from, chat_id, from_me, whapi_token } = message;
   
    const whapi = new WhapiService(whapi_token);
    if (from_me) return;
    
    const userId = from;
    const text = (message.text?.body || "").trim();
    //console.log(message);
    // 1. Handle image upload
    if (type === "image" || type == "document") {
      return handleImage(message, whapi);
    }
    const state = await session.getState(userId);
    
    //console.log("Message",message);
    //console.log("state:",state);

    if (!state || (state && Object.keys(state).length == 0)) {
      return whapi.sendText(
        chat_id,
        "📸 Please send an image to start the process.",
      );
    }
    if (type === "interactive") {
      return handleInteractive(message, whapi);
    }
    if (type === "reply") {
      return handleReply(message, whapi);
    }

    
    // 2. Handle active flow

    if (state) {
      const handled = await handleFlow(message, state, whapi);
      if (handled) return;
    }

    // 3. Default fallback
    await whapi.sendText(
      chat_id,
      "📸 Please send an image to start the process.",
    );
  } catch (err) {
    console.error("Error:", err.message);
  }
}

// ============================================================
// IMAGE HANDLER
// ============================================================
async function handleImage(message, whapi) {
  const { chat_id, type, from: userId, userRole } = message;
  
  const media = message.image || message.document;
  if (type !== "image" && type !== "document") {
   
    return; // ignore other types
  }

  if (!media) {
    await whapi.sendText(chat_id, "❌ Unsupported file.");
    return;
  }

  const mime = media.mime_type || "";
  const mimeType = media.mime_type || "image/jpeg";

  const extension = mimeTypes.extension(mimeType) || "jpg";
  //console.log("FileType",extension);
  const fileName = media.file_name || `image_${Date.now()}.${extension}`;

  // ============================================================
  // DOWNLOAD MEDIA BUFFER
  // ============================================================
  const mediaBuffer = await whapi.downloadMedia(media.id);

  if (!mediaBuffer) {
    await whapi.sendText(chat_id, "❌ Failed to fetch file.");
    return;
  }
  // ============================================================
  // CREATE src/uploads DIRECTORY
  // ============================================================
  const uploadsDir = path.join(process.cwd(), "src", "uploads");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // ============================================================
  // SAVE FILE
  // ============================================================
  const tempPath = path.join(uploadsDir, fileName);

  fs.writeFileSync(tempPath, mediaBuffer);

  // ============================================================
  // 🖼️ IMAGE (blur check)
  // ============================================================
  if (mime.startsWith("image/")) {
    // ⚡ quick low-quality check
    if (media.file_size && media.file_size < 20000) {
      await whapi.sendText(
        chat_id,
        "❌ Image quality too low. Please upload a clearer photo.",
      );
      return;
    }

    // const isBlurry = await checkMediaBlur(mediaBuffer, mime);
    const result = await checkMediaBlur(mediaBuffer, mime);
    

    if (result.isBlurry) {
      await whapi.sendText(chat_id, getMessage(result.lang, "blurry"));
      return;
    }

     // ============================================================
    // UPLOAD TO NG API
    // ============================================================
    const uploadRes = await uploadFileToNG({
      filePath: tempPath,
      fileName,
      mimeType: mime,
      docType: type,
    });
    // ============================================================
    // GET PUBLIC URL
    // ============================================================
    const publicUrl = uploadRes?.data?.public_url || uploadRes?.public_url;

    // ============================================================
    // DELETE LOCAL FILE AFTER UPLOAD
    // ============================================================
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
      //console.log("Local file deleted :", tempPath);
    }

    return handleDocumentFlow(
      chat_id,
      userId,
      userRole,
      (lang = result.lang),
      whapi,
      message,
      publicUrl,
      docPath = fileName,
      mimeType
    );
  }

  // ============================================================
  // 📄 PDF (blur check)
  // ============================================================
  if (mime === "application/pdf") {
    const isBlurry = await checkMediaBlur(mediaBuffer, mime);

    if (isBlurry) {
      await whapi.sendText(
        chat_id,
        "❌ The PDF contains blurry pages. Please upload a clear document.",
      );
      return;
    }

    // ============================================================
    // UPLOAD TO NG API
    // ============================================================
    const uploadRes = await uploadFileToNG({
      filePath: tempPath,
      fileName,
      mimeType: mime,
      docType: type,
    });
    // ============================================================
    // GET PUBLIC URL
    // ============================================================
    const publicUrl = uploadRes?.data?.public_url || uploadRes?.public_url;

    // ============================================================
    // DELETE LOCAL FILE AFTER UPLOAD
    // ============================================================
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
      //("Local file deleted :", tempPath);
    }

    return handleDocumentFlow(
      chat_id,
      userId,
      userRole,
      lang = result.lang,
      whapi,
      message,
      publicUrl,
      docPath = fileName,
      mimeType
    );
  }

  // ============================================================
  // 📊 DATA FILES (CSV / Excel)
  // ============================================================
  if (
    mime === "text/csv" ||
    mime.includes("excel") ||
    mime.includes("spreadsheet")
  ) {
    await whapi.sendText(
      chat_id,
      `📊 File received: *${fileName}*\n\n` +
        `No image quality check required.\nProcessing data file...`,
    );

    return;
  }

  // ============================================================
  // 📄 OTHER DOCUMENTS
  // ============================================================
  await whapi.sendText(
    chat_id,
    `📄 File received: *${fileName}*\n\n` +
      `This file type is not supported for blur validation.`,
  );
}

async function handleDocumentFlow(
  chatId,
  userId,
  userRole,
  lang = "english",
  whapi,
  message,
  publicUrl,
  docPath,
  mimeType
) {
  const msg = messages[lang] || messages.english;
  const titles = buttonTitles[lang] || buttonTitles.english;
  const agentTitles = agentButtonTitles[lang] || agentButtonTitles.english;
  
  // ============================
  // 🧑‍💼 AGENT FLOW
  // ============================
  
  if (userRole === "AGENT") 
    {
    session.setState(userId, "AGENT_TRANSACTION", { lang, agent_id:message.agent_id, docUrl: publicUrl, docPath,mimeType});
    //console.log("Agentbutton",agentTitles);
    return whapi.sendButtons(chatId, msg.enterTransaction, [
      { id: "agent_shipmentOrder", title: agentTitles.shipmentOrder },
      { id: "agent_fileMaster", title: agentTitles.fileMaster },
      { id: "agent_booking", title: agentTitles.booking },
    ]);
    //return whapi.sendText(chatId, msg.enterTransaction);
  }


  // ============================
  // 🚚 DRIVER FLOW
  // ============================
  session.setState(userId, "DRIVER_DOC_TYPE", { lang,driver_id:message.driver_id, docUrl: publicUrl, docPath,mimeType });

  return whapi.sendButtons(chatId, msg.selectDoc, [
    { id: "doc_pod", title: titles.pod },
    { id: "doc_receipt", title: titles.receipt },
    { id: "doc_other", title: titles.other },
  ]);
}
const buttonTitles = {
  english: {
    pod: "POD",
    receipt: "Receipt",
    other: "Other",
  },
  hindi: {
    pod: "पीओडी",
    receipt: "रसीद",
    other: "अन्य",
  },
  arabic: {
    pod: "إثبات التسليم",
    receipt: "إيصال",
    other: "أخرى",
  },
  swahili: {
    pod: "POD",
    receipt: "Risiti",
    other: "Nyingine",
  },
};

const agentButtonTitles = {
  english: {
    shipmentOrder: "Shipment Order",
    fileMaster: "File Master",
    booking: "Booking",
  },
  hindi: {
    shipmentOrder: "शिपमेंट ऑर्डर",
    fileMaster: "फ़ाइल मास्टर",
    booking: "बुकिंग",
  },
  arabic: {
    shipmentOrder: "أمر الشحنة",
    fileMaster: "ملف رئيسي",
    booking: "الحجز",
  },
  swahili: {
    shipmentOrder: "Agizo la Usafirishaji",
    fileMaster: "Faili Kuu",
    booking: "Uhifadhi",
  },
};

function getMessage(lang, type) {
  const messages = {
    english: {
      blurry: "❌ The image is blurry. Please upload a clear one.",
    },
    hindi: {
      blurry: "❌ छवि धुंधली है, कृपया साफ़ फोटो अपलोड करें।",
    },
    arabic: {
      blurry: "❌ الصورة غير واضحة، يرجى رفع صورة واضحة.",
    },
    swahili: {
      blurry: "❌ Picha haiko wazi, tafadhali pakia picha safi.",
    },
  };

  return messages[lang]?.[type] || messages.english[type];
}

async function handleInteractive(message, whapi) {
  const { chat_id, from: userId, interactive } = message;

  const btnId = interactive?.button_reply?.id || interactive?.list_reply?.id;
  if (!btnId) return;

  const stateData = (await session.get(userId)) || {};
  const lang = stateData.lang || "english";
  const msg = messages[lang];
  
  // DRIVER FLOW
  if (btnId === "user_driver") {
    session.setState(userId, "DRIVER_DOC_TYPE", { lang });

    return whapi.sendButtons(chat_id, msg.selectDoc, [
      { id: "doc_pod", title: "POD" },
      { id: "doc_receipt", title: "Receipt" },
      { id: "doc_other", title: "Other" },
    ]);
  }

 
  if (["ButtonsV3:doc_pod", "ButtonsV3:doc_receipt"].includes(btnId)) {
    const typeMap = {
      "ButtonsV3:doc_pod": "POD",
      "ButtonsV3:doc_receipt": "Receipt",
    };
    if (typeMap[btnId]) {
      await session.delete(userId);
      return whapi.sendText(chat_id, msg.successDoc(typeMap[btnId]));
    } else {
      await whapi.sendText(
        chat_id,
        "📸 Please send an image to start the process.",
      );
    }
  }

  // OTHER BUTTON FLOW
  if (btnId == "ButtonsV3:doc_other") {
    await session.setState(userId, "DRIVER_OTHER_INPUT", {
      lang,
    });

    return whapi.sendText(chat_id, "📝 Please enter other document type:");
  }

  // AGENT FLOW
  if (btnId === "user_agent") {
    await session.setState(userId, "AGENT_TRANSACTION", { lang });

    return whapi.sendText(chat_id, msg.enterTransaction);
  }

  
  if (["agent_gatepass", "agent_intercity"].includes(btnId)) {
    const data = await session.get(userId);

    const typeMap = {
      agent_gatepass: "Gate Pass",
      agent_intercity: "Intercity",
    };
    if (typeMap[btnId]) {
      await session.delete(userId);
      return whapi.sendText(chat_id, msg.submitted(data, typeMap[btnId]));
    } else {
      await whapi.sendText(
        chat_id,
        "📸 Please send an image to start the process.",
      );
    }
  }

  // AGENT OTHER FLOW
  if (btnId === "agent_other") {
    const data = await session.get(userId);

    await session.setState(userId, "AGENT_OTHER_INPUT", {
      ...data,
      lang,
    });

    return whapi.sendText(chat_id, "📝 Please enter other document type:");
  }
}
async function handleReply(message, whapi) {
  const { chat_id, from: userId, reply } = message;
  //console.log("Test Anil1");
  const btnId = reply?.buttons_reply?.id || reply?.buttons_reply?.id;
  if (!btnId) return;

  const stateData = (await session.get(userId)) || {};
  const lang = stateData.lang || "english";
  const agentTitles = agentButtonTitles[lang] || agentButtonTitles.english;
  const msg = messages[lang];
  // DRIVER FLOW
   
  //Get Document Type
  const strDocTypeQuery = `select id,name FROM m_required_document where is_active='Y' AND doc_type IN('B','T') AND name IN('receipt','Other')`;
  const arrDocType = await db.executeQuery(message.databaseName,strDocTypeQuery, {  }, true)
  // Default buttons
  const buttons = [
      { id: "doc_pod", title: "POD" }
  ];
  const arrDocTypeByName=[];
  // Push DB results dynamically
  if (arrDocType && arrDocType.length > 0) {
    arrDocType.forEach(doc => {
      buttons.push({
        id: `doc_${doc.name.toLowerCase()}`,
        title: doc.name
      });
      arrDocTypeByName[doc.name.toLowerCase()] = doc.id;
    });
  }

  if (btnId === "user_driver") {
    await session.setState(userId, "DRIVER_DOC_TYPE", { lang });
    return whapi.sendButtons(chat_id, msg.selectDoc, buttons);
  }

  
  if (["ButtonsV3:doc_pod", "ButtonsV3:doc_receipt","ButtonsV3:doc_other"].includes(btnId)) {
    const typeMap = {
      "ButtonsV3:doc_pod": "POD",
      "ButtonsV3:doc_receipt": "Receipt",
      "ButtonsV3:doc_other": "Other",
    };
    if(btnId=="ButtonsV3:doc_pod"){
      const userData = await session.get(userId);
      //Connect to Db to check message from driver or AGENT
      const docUrl= userData.docUrl;
      const docName = userData.docPath;
      const driver_id = userData.driver_id;
      const mimeType = userData.mimeType;

      const strQuery =`select top 1 T0.driver_name,T1.tripno,T0.parent_id FROM 
      d_fm_shipmentorder_vehicledetails 
      T0 JOIN d_fm_shipmentorder T1 ON  T0.parent_id=T1.id
      where T0.driver_id=${driver_id} AND T1.order_status='O'
      ORDER by T0.parent_id DESC`;
      const result = await db.executeQuery(message.databaseName, strQuery, {  }, true);
      if(!result[0]){
         await session.delete(userId);
        return await whapi.sendText(chat_id,"We can not find any open trip for you.",);
      }
      //Code to upload POD
      const ship_id= result[0].parent_id;
      const pod_date = new Date();
      // Format as YYYY-MM-DD
      const formattedDate = pod_date.toISOString().split('T')[0];
      
      const strUpdateQuery= `UPDATE d_fm_shipmentorder_cargodetails SET template=null,mime_type='${mimeType}', pod_date='${formattedDate}',pod_attchment='${docName}',cdn_url='${docUrl}' WHERE parent_id=${ship_id} AND pod_verify!='Y'`;
      //console.log(strUpdateQuery,userData);
      await db.executeQuery(message.databaseName, strUpdateQuery, {  }, true);

      //console.log("UserData",userData);
    }
    if(btnId=="ButtonsV3:doc_receipt" || btnId=="ButtonsV3:doc_other" ){
      const userData = await session.get(userId);
      //Connect to Db to check message from driver or AGENT
      const docUrl= userData.docUrl;
      const docName = userData.docPath;
      const driver_id = userData.driver_id;
      const mimeType = userData.mimeType;

      const strQuery =`select top 1 T0.driver_name,T1.tripno,T0.parent_id FROM 
      d_fm_shipmentorder_vehicledetails 
      T0 JOIN d_fm_shipmentorder T1 ON  T0.parent_id=T1.id
      where T0.driver_id=${driver_id} AND T1.order_status='O'
      ORDER by T0.parent_id DESC`;
      const result = await db.executeQuery(message.databaseName, strQuery, {  }, true);
      if(!result[0]){
         await session.delete(userId);
        return await whapi.sendText(chat_id,"We can not find any open trip for you.",);
      }
      
      //Code to upload POD
      const ship_id= result[0].parent_id;
      const attachment_date = new Date().toISOString().replace('T', ' ').substring(0, 23);
      let doc_type_id = arrDocTypeByName['receipt'];
      if (btnId == "ButtonsV3:doc_other") {
        doc_type_id = arrDocTypeByName['other'];
      }
      
      const strInsertQuery= `INSERT INTO d_fm_shipmentorder_attachment (parent_id,file_name,attachment_date,template,mime_type,cdn_url,document_type)
      VALUES (${ship_id},'${docName}','${attachment_date}',NULL,'${mimeType}','${docUrl}',${doc_type_id})`;
      
     //console.log(strInsertQuery,userData);
      await db.executeQuery(message.databaseName, strInsertQuery, {  }, true);

     //console.log("UserData",userData);
    }
    if (typeMap[btnId]) {
      
      await session.delete(userId);
      return whapi.sendText(chat_id, msg.successDoc(typeMap[btnId]));
    } else {
      await whapi.sendText(
        chat_id,
        "📸 Please send an image to start the process.",
      );
    }
  }
  //Agent Flow
  
  // Default buttons
  const agentButton2 = [];
  const arrAgentDocTypeByName=[];
  let arrAgentDocType =[];
  
   //Code to get Document Type From DB
//console.log("Step 1 sessionData",stateData);
  if(btnId==="ButtonsV3:agent_shipmentOrder" || stateData.transactionType=="Shipment Order"){
    const strDocTypeQuery = `select id,name FROM m_required_document where is_active='Y' AND doc_type IN('B','T')`;
    arrAgentDocType = await db.executeQuery(message.databaseName,strDocTypeQuery, {  }, true);
    //console.log("arrDocType", arrAgentDocType);
  }
  if(btnId==="ButtonsV3:agent_fileMaster" || btnId==="ButtonsV3:agent_booking" || stateData.transactionType=="File Master" || stateData.transactionType=="Booking" ){
    const strDocTypeQuery = `select id,name FROM m_required_document where is_active='Y' AND doc_type IN('B','C')`;
    arrAgentDocType = await db.executeQuery(message.databaseName,strDocTypeQuery, {  }, true);
    //console.log("arrDocType", arrAgentDocType);
  }    
  // Push DB results dynamically
  if (arrAgentDocType && arrAgentDocType.length > 0) {
    arrAgentDocType.forEach(doc => {
      agentButton2.push({
        id: `doc_${doc.name.toLowerCase()}_${doc.id}`,
        title: doc.name
      });
     
    });
  }

  //console.log("Agenet Btn",agentButton2);

//Step 1
if (["ButtonsV3:agent_shipmentOrder","ButtonsV3:agent_booking", "ButtonsV3:agent_fileMaster",].includes(btnId))
   {
    const typeMap = {
      "ButtonsV3:agent_shipmentOrder": "Shipment Order",
      "ButtonsV3:agent_fileMaster": "File Master",
      "ButtonsV3:agent_booking": "Booking",
    };
    const sessionData = await session.get(userId);
    
    if (typeMap[btnId]) {
      await session.setState(userId, "TRANSACTION_SUB_TYPE", {
        lang,
        transactionType: typeMap[btnId],
      });
      //console.log("Session Data for Reply", sessionData);
      
      return whapi.sendButtons(chat_id, msg.selectDocType, agentButton2);

    } else {
      await whapi.sendText(
        chat_id,
        "📸 Please send an image to start the process.",
      );
    }
  }
  //Step 2

 
  if (agentButton2.some(item =>  `ButtonsV3:${item.id}` === btnId)) {
    const doc_type = agentButton2.find(item =>  `ButtonsV3:${item.id}` === btnId);
    //console.log("Step 2 Btn",parseInt(doc_type.id.split('_').pop(), 10));
    const sessionData = await session.get(userId);
    //console.log("Session Data for Reply", sessionData);
    //Validate Document Number 
  
    if ( agentButton2.some(item =>  `ButtonsV3:${item.id}` === btnId)) {
      await session.setState(userId, "AGENT_DOC_NUMBER", {
        lang,
        DocumentType:doc_type.title,
        doc_type_id:parseInt(doc_type.id.split('_').pop(), 10),
      });
      return whapi.sendText(chat_id, msg.enterDocNo);
    } else {
      await whapi.sendText(
        chat_id,
        "📸 Please send an image to start the process.",
      );
    }
  }
  
}
// ============================================================
// FLOW HANDLER
// ============================================================
async function handleFlow(message, state, whapi) {
  const { chat_id, from: userId } = message;
  const text = (message.text?.body || "").trim();

  const stateData = (await session.get(userId)) || {};
  const lang = stateData.lang || "english";
  const msg = messages[lang];

  switch (state) {
  
    case "AGENT_DOC_NUMBER": {
      const data = await session.get(userId);
      //console.log("AGENT SESSION",data);
      let arrCheckDoc=[];
      if(data.transactionType=="Shipment Order"){
        const strQuery= `select id FROM d_fm_shipmentorder where doc_num='${text}'`;
        console.log(strQuery,message);
        arrCheckDoc = await db.executeQuery(message.databaseName,strQuery, {  }, true);
        console.log(arrCheckDoc);
      }
      if(data.transactionType=="File Master"){
        const strQuery= `select id FROM d_cf_filemaster where doc_num='${text}'`;
        arrCheckDoc = await db.executeQuery(message.databaseName,strQuery, {  }, true);
      }
      if(data.transactionType=="Booking"){
        const strQuery= `select id FROM d_cfs_booking where doc_num='${text}'`;
        //console.log("Check Doc Number: ",strQuery);
        arrCheckDoc = await db.executeQuery(message.databaseName,strQuery, {  }, true);
      }
      if (!arrCheckDoc[0]) {
        return await whapi.sendText(
        chat_id,
        `Document number you entered for *${data.transactionType}* not valid, please re-enter valid number.` ,);
      }
      const attachment_date = new Date().toISOString().replace('T', ' ').substring(0, 23);
      const docUrl= data.docUrl;
      const docName = data.docPath;
      const agent_id = data.agent_id;
      const agent_name = message.agent_name;
      const mimeType = data.mimeType;
      const doc_type_id = data.doc_type_id;
      const parent_id= arrCheckDoc[0].id;
      //Code to add document in DB

      if(data.transactionType=="Shipment Order"){
        const strInsertQuery= `INSERT INTO d_fm_shipmentorder_attachment (parent_id,file_name,attachment_date,template,mime_type,cdn_url,document_type,user_name,is_mobile)
        VALUES (${parent_id},'${docName}','${attachment_date}',NULL,'${mimeType}','${docUrl}',${doc_type_id},'${agent_name}','W')`;
        console.log("Insert:",strInsertQuery);
        await db.executeQuery(message.databaseName, strInsertQuery, {  }, true);
      }
      if(data.transactionType=="File Master"){
        const strInsertQuery= `INSERT INTO d_cf_filemaster_attachment (parent_id,file_name,attachment_date,template,mime_type,cdn_url,document_type,user_id,is_mobile)
        VALUES (${parent_id},'${docName}','${attachment_date}',NULL,'${mimeType}','${docUrl}',${doc_type_id},${agent_id},'W')`;
        //console.log("File Master Attachement",strInsertQuery);
        await db.executeQuery(message.databaseName, strInsertQuery, {  }, true);
      }
      if(data.transactionType=="Booking"){
        const strInsertQuery= `INSERT INTO d_cfs_booking_attachment (parent_id,file_name,attachment_date,template,mime_type,cdn_url,document_type,user_id)
        VALUES (${parent_id},'${docName}','${attachment_date}',NULL,'${mimeType}','${docUrl}',${doc_type_id},${agent_id})`;
        //console.log("Booking Attachement",strInsertQuery);
        await db.executeQuery(message.databaseName, strInsertQuery, {  }, true);
      }
      console.log("Final",userId);
      await session.delete(userId);

      return await whapi.sendText(
        chat_id,
        `✅ Document submitted!\n\n` +
          `📑 Transaction Type: *${data.transactionType}*\n` +
          `📄 Doc Type: *${data.DocumentType}*\n`+
          `🔢 Doc No: *${text}*` ,
          
      );
    }
    case "DRIVER_OTHER_INPUT": {
      const otherType = text;

      await session.delete(userId);

      await whapi.sendText(
        chat_id,
        `✅ Other document type received: *${otherType}*`,
      );

      return true;
    }

    case "AGENT_OTHER_INPUT": {
      const data = await session.get(userId);
      const otherType = text;

      await session.delete(userId);

      await whapi.sendText(
        chat_id,
        `✅ Document submitted!\n\n` +
          `📑 Transaction Type: *${data.transactionType}*\n` +
          `📄 Document Type: *${otherType}*`+
          `🔢 Document No: *${data.docNumber}*\n`,
          
      );

      return true;
    }

    default:
      return false;
  }
}

const messages = {
  english: {
    selectDoc: "📦 Select document type:",
    enterTransaction: "Select *Transaction Type*:",
    enterDocNo: "🔢 Enter *Document Number*:",
    selectDocType: "📄 Select Document Type:",
    successDoc: (type) => `✅ *${type}* document received successfully.`,
    submitted: (data, type) =>
      `✅ Document submitted!\n\n` +
      `📑 Transaction: *${data.transactionType}*\n` +
      `🔢 Doc No: *${data.docNumber}*\n` +
      `📄 Type: *${type}*`,
  },

  hindi: {
    selectDoc: "📦 दस्तावेज़ प्रकार चुनें:",
    enterTransaction: "📑 Transaction type दर्ज करें (जैसे- Invoice,SO):",
    enterDocNo: "🔢 दस्तावेज़ संख्या दर्ज करें:",
    selectDocType: "📄 दस्तावेज़ प्रकार चुनें:",
    successDoc: (type) => `✅ *${type}* दस्तावेज़ सफलतापूर्वक प्राप्त हुआ।`,
    submitted: (data, type) =>
      `✅ दस्तावेज़ जमा किया गया!\n\n` +
      `📑 Transaction: *${data.transactionType}*\n` +
      `🔢 दस्तावेज़ संख्या: *${data.docNumber}*\n` +
      `📄 प्रकार: *${type}*`,
  },

  arabic: {
    selectDoc: "📦 اختر نوع المستند:",
    enterTransaction: "📑 أدخل نوع المعاملة:",
    enterDocNo: "🔢 أدخل رقم المستند:",
    selectDocType: "📄 اختر نوع المستند:",
    successDoc: (type) => `✅ تم استلام مستند *${type}* بنجاح.`,
    submitted: (data, type) =>
      `✅ تم إرسال المستند!\n\n` +
      `📑 المعاملة: *${data.transactionType}*\n` +
      `🔢 رقم المستند: *${data.docNumber}*\n` +
      `📄 النوع: *${type}*`,
  },

  swahili: {
    selectDoc: "📦 Chagua aina ya hati:",
    enterTransaction: "📑 Ingiza aina ya muamala:",
    enterDocNo: "🔢 Ingiza nambari ya hati:",
    selectDocType: "📄 Chagua aina ya hati:",
    successDoc: (type) => `✅ Hati ya *${type}* imepokelewa.`,
    submitted: (data, type) =>
      `✅ Hati imewasilishwa!\n\n` +
      `📑 Muamala: *${data.transactionType}*\n` +
      `🔢 Namba: *${data.docNumber}*\n` +
      `📄 Aina: *${type}*`,
  },
};
// ============================================================
// EXPORT
// ============================================================

module.exports = {
  handleMessage,
  handleInteractive,
};