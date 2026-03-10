const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.analyzeCropImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('Gemini API key is not configured.');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an AI crop agricultural expert. The user has uploaded an image of a crop or harvest.
Analyze the image and realistically identify the crop type. Assess its visual quality (e.g. perfect, standard, or damaged). 
Then return a JSON object with this EXACT structure (strict JSON format without markdown wrapping):
{
  "crop": "Tomato",
  "translationKey": "tomato",
  "gradeLetter": "A",
  "grade": {
    "title": "Premium (Export Quality)",
    "multiplier": 1.3,
    "color": "text-emerald-400",
    "bg": "bg-emerald-500/20",
    "desc": "Optimal size, zero visible bruising, perfect color."
  },
  "price": 2600,
  "confidence": 94,
  "moisture": 18
}

Guidelines for grade assignment:
- A: Premium (Export Quality) - text-emerald-400 / bg-emerald-500/20. Multiplier 1.3. Perfect looking.
- B: Standard (Domestic Market) - text-blue-400 / bg-blue-500/20. Multiplier 1.0. Average looking.
- C: Processing (Industrial Use) - text-amber-400 / bg-amber-500/20. Multiplier 0.7. Damaged/overripe.

Set the confidence score (80-99) and moisture percentage appropriately. Estimate a base price in INR per quintal (e.g., Tomatos 2000, Rice 3000, Wheat 2500, Apple 8000, Onion 1800, Potato 1500) and multiply it by the grade multiplier. Return ONLY valid JSON.`;

        console.log('Sending image to Gemini SDK for analysis...');

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        if (!responseText) {
            throw new Error('No valid response from Gemini API');
        }

        let resultJson;
        try {
            // Find the first { and the last } in case the AI wraps it in conversational text or markdown
            const firstBrace = responseText.indexOf('{');
            const lastBrace = responseText.lastIndexOf('}');

            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error("No JSON object found in response");
            }

            const jsonString = responseText.substring(firstBrace, lastBrace + 1);
            resultJson = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', responseText);
            throw new Error('Invalid JSON format from AI');
        }

        res.status(200).json(resultJson);

    } catch (error) {
        console.error('Error analyzing image with Gemini SDK:', error.message || error);
        res.status(500).json({ error: 'Failed to analyze image' });
    }
};
