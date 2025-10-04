const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// OCR endpoint for receipt processing
router.post('/process-receipt', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      },
    });

    const prompt = `
You are an expert at extracting information from receipts.
Analyze this receipt image carefully and extract the following information.
Return ONLY a valid JSON object with no extra text or markdown formatting.

{
  "amount": <total amount as a number>,
  "currency": "<currency code like INR, USD, EUR>",
  "date": "<date in YYYY-MM-DD format>",
  "description": "<brief description of the expense>",
  "category": "<one of: Food, Travel, Office Supplies, Transportation, Accommodation, Entertainment, Other>",
  "merchant": "<name of the merchant/restaurant/store>",
  "items": [
    {
      "name": "<item name>",
      "amount": <item amount as number>
    }
  ]
}

Rules:
- Extract the total amount (not subtotal)
- If currency symbol is ₹, use INR
- If currency symbol is $, use USD
- If currency symbol is €, use EUR
- Date should be in YYYY-MM-DD format
- Category must be one of the listed options
- If unclear, make a reasonable guess
- Return ONLY the JSON object (no markdown or explanation)
`;

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().trim();

    // Clean up markdown or extra formatting
    let cleanedText = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // Extract JSON object if surrounded by extra characters
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in AI response');

    let extractedData;
    try {
      extractedData = JSON.parse(jsonMatch[0]);
    } catch (err) {
      throw new Error('Invalid JSON format in AI response');
    }

    // Normalize and validate fields
    const validCategories = [
      'Food',
      'Travel',
      'Office Supplies',
      'Transportation',
      'Accommodation',
      'Entertainment',
      'Other',
    ];

    const cleanedData = {
      amount: parseFloat(extractedData.amount) || 0,
      currency: extractedData.currency || 'INR',
      date: extractedData.date || new Date().toISOString().split('T')[0],
      description: extractedData.description || 'Receipt expense',
      category: validCategories.includes(extractedData.category)
        ? extractedData.category
        : 'Other',
      merchant: extractedData.merchant || 'Unknown',
      items: Array.isArray(extractedData.items)
        ? extractedData.items.map((item) => ({
            name: item.name || 'Unknown Item',
            amount: parseFloat(item.amount) || 0,
          }))
        : [],
    };

    res.json({
      success: true,
      data: cleanedData,
      message: 'Receipt processed successfully',
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({
      error: 'Failed to process receipt',
      details: error.message,
    });
  }
});

module.exports = router;
