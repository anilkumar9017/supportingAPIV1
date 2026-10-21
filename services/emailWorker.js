const axios = require('axios');

async function startEmailWorker(payload) {
  const workerUrl = 'https://ng_supporting_api.dcctz.com/email_scheduler/api/trigger';

  const headers = {};
  headers.Authorization = `Bearer ${process.env.EMAIL_WORKER_API_TOKEN}`;

  const timeout = Number.parseInt(process.env.EMAIL_WORKER_TIMEOUT_MS, 10) || 10000;
  const response = await axios.post(workerUrl, payload, { headers, timeout });
  return response.data;
}

module.exports = { startEmailWorker };