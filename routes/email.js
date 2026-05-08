const express = require('express');
const router = express.Router();
const axios = require('axios');


/**
 * Public route - No authentication required
 * GET /api/email/health
 * Note: Health check doesn't need domain middleware (no database access)
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Email API is healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Public Agreement Routes
 */
const mailApiUrl = 'https://microservices.dcctz.com/api/send_email';
const mailApiToken = 'EAAWOFw8QuSgBOZB6IYFbdSTpTBWD9pXeI5DEZB8ZCs8Ivtg7Fopi9llcc5hddMgUx65IiLe7cZCJevlWMV7JVkTbwm8qG7FMDh3PMoiGabhuufRtgRV32gy0Ttw0XeZAJcBj48gEywbPrQ3K6wxL0ZBabBfsVhGBcqVTxGWHJ1UZBUXPkKoMiJ1QbIHnBAu0pL1';
router.post('/send', async (req, res)=>{
    try{
    const response = await axios.post(`${mailApiUrl}`, req.body, {
        headers: {
            'Authorization': `Bearer ${mailApiToken}`
        },
        timeout: 5000
    });
    //console.log("response ", response)
    if(response?.data?.success) {
            res.status(200).json({
                success: true,
                message: 'Email sent successfully',
                timestamp: new Date().toISOString()
            });
        }else{
            res.status(500).json({
                success: false,
                message: 'Email sending failed',
                timestamp: new Date().toISOString()
            });
        }
    }catch(error){
        console.error('Error in email API:', error);
        res.status(500).json({
            success: false,
            message: 'Email sending failed',
            error: error.message
        });
    }
});

module.exports = router;
