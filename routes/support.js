const express = require('express');
const router = express.Router();
const axios = require('axios');
const Complaint = require('../models/Complaint');

// Mock data for advisories
const advisories = [
    { id: 1, category: 'Market', message: 'Wheat prices are expected to rise in MP by 5% next week.', date: '2024-02-04' },
    { id: 2, category: 'Govt', message: 'New PM-Kisan installment being released soon. Check your status.', date: '2024-02-03' },
    { id: 3, category: 'Finance', message: 'Special low-interest kisan credit cards available for organic farmers.', date: '2024-02-02' }
];

const advisoryTranslations = {
    hi: {
        "Conditions are stable for most crops.": "अधिकांश फसलों के लिए स्थितियां स्थिर हैं।",
        "High heat! Rice requires standing water. Increase irrigation to prevent soil cracking.": "तेज गर्मी! धान को खड़े पानी की आवश्यकता होती है। मिट्टी को फटने से बचाने के लिए सिंचाई बढ़ाएं।",
        "Rain expected. Good for transplanting, but ensure drainage isn't blocked.": "बारिश की उम्मीद। रोपाई के लिए अच्छा है, लेकिन सुनिश्चित करें कि जल निकासी अवरुद्ध न हो।",
        "Maintain 2-3 inches of standing water in the fields.": "खेतों में 2-3 इंच खड़ा पानी बनाए रखें।",
        "Warm winds detected. Terminal heat may reduce grain size. Apply light irrigation.": "गर्म हवाओं का पता चला। गर्मी दाने का आकार कम कर सकती है। हल्की सिंचाई करें।",
        "Rain expected. Postpone irrigation to avoid waterlogging and root rot.": "बारिश की उम्मीद। जलभराव और जड़ों के सड़ने से बचने के लिए सिंचाई स्थगित करें।",
        "Ideal conditions for tillering. Monitor for rust diseases.": "कल्ले निकलने के लिए आदर्श स्थिति। रस्ट रोगों की निगरानी करें।",
        "Extreme heat can cause blossom drop. Use mulch to keep roots cool.": "अत्यधिक गर्मी से फूल गिर सकते हैं। जड़ों को ठंडा रखने के लिए मल्च का उपयोग करें।",
        "High humidity/Rain. Risk of Late Blight. Apply protective fungicide spray.": "उच्च आर्द्रता/बारिश। लेट ब्लाइट का खतरा। सुरक्षात्मक कवकनाशी स्प्रे करें।",
        "Perfect for fruit setting. Maintain consistent soil moisture.": "फल लगने के लिए बिल्कुल सही। मिट्टी में नमी बनाए रखें।",
        "Extreme heat alert! Protect all young saplings and increase water frequency.": "भीषण गर्मी की चेतावनी! सभी छोटे पौधों की रक्षा करें और पानी की आवृत्ति बढ़ाएं।",
        "Precipitation alert. Delay pesticide application and check drainage channels.": "बारिश की चेतावनी। कीटनाशक लगाने में देरी करें और जल निकासी चैनलों की जांच करें।"
    },
    te: {
        "Conditions are stable for most crops.": "చాలా పంటలకు పరిస్థితులు స్థిరంగా ఉన్నాయి.",
        "High heat! Rice requires standing water. Increase irrigation to prevent soil cracking.": "తీవ్రమైన వేడి! వరి పంటకు నీరు అవసరం. నేల పగుళ్లు రాకుండా నీటి పారుదల పెంచండి.",
        "Rain expected. Good for transplanting, but ensure drainage isn't blocked.": "వర్షం పడే అవకాశం ఉంది. వరి నాట్లకు మంచిది, కానీ నీరు నిలవకుండా చూసుకోండి.",
        "Maintain 2-3 inches of standing water in the fields.": "పొలాల్లో 2-3 అంగుళాల నీరు ఉండేలా చూసుకోండి.",
        "Warm winds detected. Terminal heat may reduce grain size. Apply light irrigation.": "వేడి గాలులు వీస్తున్నాయి. వేడి వల్ల గింజ పరిమాణం తగ్గే అవకాశం ఉంది. తేలికపాటి తడులు ఇవ్వండి.",
        "Rain expected. Postpone irrigation to avoid waterlogging and root rot.": "వర్షం పడే అవకాశం ఉంది. నీరు నిలవకుండా మరియు వేరు కుళ్లు రాకుండా నీటి తడులను వాయిదా వేయండి.",
        "Ideal conditions for tillering. Monitor for rust diseases.": "పిలకలు రావడానికి అనుకూలమైన పరిస్థితులు. తుప్పు తెగులు రాకుండా గమనించండి.",
        "Extreme heat can cause blossom drop. Use mulch to keep roots cool.": "తీవ్రమైన వేడి వల్ల పూత రాలిపోయే అవకాశం ఉంది. వేళ్లు చల్లగా ఉండటానికి మల్చింగ్ వాడండి.",
        "High humidity/Rain. Risk of Late Blight. Apply protective fungicide spray.": "అధిక తేమ/వర్షం. లేట్ బ్లైట్ తెగులు వచ్చే ప్రమాదం ఉంది. శిలీంధ్ర నాశిని పిచికారీ చేయండి.",
        "Perfect for fruit setting. Maintain consistent soil moisture.": "కాయ దశకు అనుకూలమైన సమయం. నేలలో తేమ తగ్గకుండా చూసుకోండి.",
        "Extreme heat alert! Protect all young saplings and increase water frequency.": "తీవ్రమైన వేడి హెచ్చరిక! చిన్న మొక్కలను కాపాడుకోండి మరియు నీటి తడులు పెంచండి.",
        "Precipitation alert. Delay pesticide application and check drainage channels.": "వర్షపాతం హెచ్చరిక. పురుగుమందుల పిచికారీని వాయిదా వేయండి మరియు కాలువలను శుభ్రం చేయండి."
    },
    ta: {
        "Conditions are stable for most crops.": "பெரும்பாலான பயிர்களுக்கு நிலைமைகள் சீராக உள்ளன.",
        "High heat! Rice requires standing water. Increase irrigation to prevent soil cracking.": "கடுமையான வெப்பம்! நெல் பயிருக்கு நீர் தேவை. மண் வெடிப்பதைத் தடுக்க நீர் பாசனத்தை அதிகரிக்கவும்.",
        "Rain expected. Good for transplanting, but ensure drainage isn't blocked.": "மழை எதிர்பார்க்கப்படுகிறது. நடவு செய்ய நல்லது, ஆனால் வடிகால் அடைக்கப்படவில்லை என்பதை உறுதிப்படுத்தவும்.",
        "Maintain 2-3 inches of standing water in the fields.": "வயல்களில் 2-3 அங்குல நீர் தேங்குவதை உறுதி செய்யவும்.",
        "Warm winds detected. Terminal heat may reduce grain size. Apply light irrigation.": "வெப்பமான காற்று வீசுகிறது. வெப்பத்தால் தானிய அளவு குறையக்கூடும். லேசான நீர் பாசனம் செய்யவும்.",
        "Rain expected. Postpone irrigation to avoid waterlogging and root rot.": "மழை எதிர்பார்க்கப்படுகிறது. நீர் தேங்குவதையும் வேர் அழுகலையும் தவிர்க்க நீர் பாசனத்தைத் தள்ளிப்போடுங்கள்.",
        "Ideal conditions for tillering. Monitor for rust diseases.": "தூர்கள் வருவதற்கு ஏற்ற கால நிலை. துரு நோயைக் கண்காணிக்கவும்.",
        "Extreme heat can cause blossom drop. Use mulch to keep roots cool.": "அதிக வெப்பம் பூக்கள் உதிர்வதற்கு காரணமாகலாம். வேர்களைக் குளிர்ச்சியாக வைத்திருக்க மூடாக்கு பயன்படுத்தவும்.",
        "High humidity/Rain. Risk of Late Blight. Apply protective fungicide spray.": "அதிக ஈரப்பதம்/மழை. லேட் பிளைட் நோய் அபாயம். பூஞ்சைக் கொல்லி தெளிக்கவும்.",
        "Perfect for fruit setting. Maintain consistent soil moisture.": "காய் பிடிப்பதற்கு ஏற்ற சமயம். சீரான மண் ஈரப்பதத்தைப் பராமரிக்கவும்.",
        "Extreme heat alert! Protect all young saplings and increase water frequency.": "கடுமையான வெப்ப எச்சரிக்கை! இளம் கன்றுகளைப் பாதுகாத்து நீர் பாசனத்தை அதிகரிக்கவும்.",
        "Precipitation alert. Delay pesticide application and check drainage channels.": "மழை எச்சரிக்கை. பூச்சிக்கொல்லி தெளிப்பதைத் தள்ளிப்போட்டு வடிகால் வாய்க்கால்களைச் சரிபார்க்கவும்."
    },
    kn: {
        "Conditions are stable for most crops.": "ಹೆಚ್ಚಿನ ಬೆಳೆಗಳಿಗೆ ಪರಿಸ್ಥಿತಿಗಳು ಸ್ಥಿರವಾಗಿವೆ.",
        "High heat! Rice requires standing water. Increase irrigation to prevent soil cracking.": "ಹೆಚ್ಚಿನ ತಾಪಮಾನ! ಭತ್ತಕ್ಕೆ ನಿಂತ ನೀರಿನ ಅವಶ್ಯಕತೆಯಿದೆ. ಮಣ್ಣಿನ ಬಿರುಕು ತಡೆಯಲು ನೀರಾವರಿ ಹೆಚ್ಚಿಸಿ.",
        "Rain expected. Good for transplanting, but ensure drainage isn't blocked.": "ಮಳೆಯ ನಿರೀಕ್ಷೆಯಿದೆ. ನಾಟಿಗೆ ಉತ್ತಮವಾಗಿದೆ, ಆದರೆ ನೀರು ಸರಾಗವಾಗಿ ಹರಿಯುವಂತೆ ನೋಡಿಕೊಳ್ಳಿ.",
        "Maintain 2-3 inches of standing water in the fields.": "ಗದ್ದೆಗಳಲ್ಲಿ 2-3 ಇಂಚು ನಿಂತ ನೀರನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಿ.",
        "Warm winds detected. Terminal heat may reduce grain size. Apply light irrigation.": "ಬಿಸಿ ಗಾಳಿ ಪತ್ತೆಯಾಗಿದೆ. ಶಾಖದಿಂದ ಧಾನ್ಯದ ಗಾತ್ರ ಕಡಿಮೆಯಾಗಬಹುದು. ಲಘು ನೀರಾವರಿ ನೀಡಿ.",
        "Rain expected. Postpone irrigation to avoid waterlogging and root rot.": "ಮಳೆಯ ನಿರೀಕ್ಷೆಯಿದೆ. ನೀರು ನಿಲ್ಲದಂತೆ ಮತ್ತು ಬೇರು ಕೊಳೆಯದಂತೆ ತಡೆಯಲು ನೀರಾವರಿ ಮುಂದೂಡಿ.",
        "Ideal conditions for tillering. Monitor for rust diseases.": "ಮರಿ ಸಸಿಗಳು ಬರಲು ಪೂರಕ ವಾತಾವರಣ. ತುಕ್ಕು ರೋಗದ ಬಗ್ಗೆ ನಿಗಾ ಇರಲಿ.",
        "Extreme heat can cause blossom drop. Use mulch to keep roots cool.": "ಅತಿಯಾದ ಶಾಖದಿಂದ ಹೂವು ಉದುರಬಹುದು. ಮಣ್ಣಿನ ತೇವಾಂಶ ಕಾಪಾಡಲು ಆಚ್ಚಾದನೆ ಬಳಸಿ.",
        "High humidity/Rain. Risk of Late Blight. Apply protective fungicide spray.": "ಹೆಚ್ಚಿನ ಆರ್ದ್ರತೆ/ಮಳೆ. ತಡವಾಗಿ ಬರುವ ರೋಗಗಳ ಅಪಾಯ. ರಕ್ಷಣಾತ್ಮಕ ಶಿಲೀಂಧ್ರನಾಶಕ ಸ್ಪ್ರೇ ಮಾಡಿ.",
        "Perfect for fruit setting. Maintain consistent soil moisture.": "ಹಣ್ಣು ಬಿಡಲು ಸೂಕ್ತ ಸಮಯ. ಮಣ್ಣಿನ ತೇವಾಂಶವನ್ನು ಸ್ಥಿರವಾಗಿ ಕಾಪಾಡಿಕೊಳ್ಳಿ.",
        "Extreme heat alert! Protect all young saplings and increase water frequency.": "ಬಿಸಿಗಾಳಿಯ ಎಚ್ಚರಿಕೆ! ಎಳೆಯ ಸಸಿಗಳನ್ನು ರಕ್ಷಿಸಿ ಮತ್ತು ನೀರುಣಿಸುವ ಪ್ರಮಾಣ ಹೆಚ್ಚಿಸಿ.",
        "Precipitation alert. Delay pesticide application and check drainage channels.": "ಮಳೆಯ ಎಚ್ಚರಿಕೆ. ಕೀಟನಾಶಕ ಸಿಂಪಡನೆ ಮುಂದೂಡಿ ಮತ್ತು ಚರಂಡಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ."
    },
    mr: {
        "Conditions are stable for most crops.": "बहुतेक पिकांसाठी परिस्थिती स्थिर आहे.",
        "High heat! Rice requires standing water. Increase irrigation to prevent soil cracking.": "कडक ऊन! भात पिकासाठी उभ्या पाण्याची गरज असते. जमीन फाटू नये म्हणून सिंचन वाढवा.",
        "Rain expected. Good for transplanting, but ensure drainage isn't blocked.": "पावसाची शक्यता. लावणीसाठी चांगले आहे, परंतु निचरा व्यवस्था नीट असल्याची खात्री करा.",
        "Maintain 2-3 inches of standing water in the fields.": "शेतात 2-3 इंच उभे पाणी ठेवा.",
        "Warm winds detected. Terminal heat may reduce grain size. Apply light irrigation.": "उष्ण वारे वाहत आहेत. उष्णतेमुळे दाण्यांचा आकार कमी होऊ शकतो. हलके सिंचन करा.",
        "Rain expected. Postpone irrigation to avoid waterlogging and root rot.": "पावसाची शक्यता. पाणी साचणे आणि मूळ कुजणे टाळण्यासाठी सिंचन पुढे ढकला.",
        "Ideal conditions for tillering. Monitor for rust diseases.": "फुटवे येण्यासाठी पोषक वातावरण. तांबेरा रोगावर लक्ष ठेवा.",
        "Extreme heat can cause blossom drop. Use mulch to keep roots cool.": "अत्यधिक उष्णतेमुळे फुले गळू शकतात. मुळे थंड ठेवण्यासाठी आच्छादनाचा वापर करा.",
        "High humidity/Rain. Risk of Late Blight. Apply protective fungicide spray.": "जास्त आर्द्रता/पाऊस. करपा रोगाचा धोका. संरक्षक बुरशीनाशकाची फवारणी करा.",
        "Perfect for fruit setting. Maintain consistent soil moisture.": "फळधारणेसाठी योग्य वेळ. जमिनीत ओलावा टिकवून ठेवा.",
        "Extreme heat alert! Protect all young saplings and increase water frequency.": "अत्यंत उष्णतेचा इशारा! सर्व लहान रोपांचे संरक्षण करा आणि पाणी देण्याचे प्रमाण वाढवा.",
        "Precipitation alert. Delay pesticide application and check drainage channels.": "पावसाचा इशारा. कीटकनाशकांची फवारणी पुढे ढकला आणि पाण्याचा निचरा तपासा."
    },
    ml: {
        "Conditions are stable for most crops.": "മിക്ക വിളകൾക്കും അന്തരീക്ഷം അനുയോജ്യമാണ്.",
        "High heat! Rice requires standing water. Increase irrigation to prevent soil cracking.": "കഠിനമായ ചൂട്! നെൽകൃഷിക്ക് വെള്ളം ആവശ്യമാണ്. മണ്ണ് വിണ്ടുകീറുന്നത് തടയാൻ നനയ്ക്കുന്നത് വർദ്ധിപ്പിക്കുക.",
        "Rain expected. Good for transplanting, but ensure drainage isn't blocked.": "മഴയ്ക്ക് സാധ്യത. ഞാറുനടീലിന് അനുയോജ്യം, പക്ഷേ വെള്ളക്കെട്ട് ഉണ്ടാകാതെ ശ്രദ്ധിക്കുക.",
        "Maintain 2-3 inches of standing water in the fields.": "പാടങ്ങളിൽ 2-3 ഇഞ്ച് വെള്ളം നിലനിർത്തുക.",
        "Warm winds detected. Terminal heat may reduce grain size. Apply light irrigation.": "ചൂട് കാറ്റ് വീശുന്നു. ഇത് നെന്മണികളുടെ വലിപ്പം കുറച്ചേക്കാം. ഇടവിട്ട് നനയ്ക്കുക.",
        "Rain expected. Postpone irrigation to avoid waterlogging and root rot.": "മഴയ്ക്ക് സാധ്യത. വെള്ളക്കെട്ടും വേരുചീയലും ഒഴിവാക്കാൻ നനയ്ക്കുന്നത് ഒഴിവാക്കുക.",
        "Ideal conditions for tillering. Monitor for rust diseases.": "കതിരുകൾ വരാൻ അനുയോജ്യമായ സമയം. തുരുമ്പ് രോഗമുണ്ടോ എന്ന് നിരീക്ഷിക്കുക.",
        "Extreme heat can cause blossom drop. Use mulch to keep roots cool.": "കൂടുതൽ ചൂട് പൂക്കൾ കൊഴിയാൻ കാരണമാകും. വേരുകൾ തണുപ്പിക്കാൻ പുതയിടുക.",
        "High humidity/Rain. Risk of Late Blight. Apply protective fungicide spray.": "കൂടുതൽ ഈർപ്പം/മഴ. കുമിൾ രോഗത്തിന് സാധ്യത. കുമിൾനാശിനി പ്രയോഗിക്കുക.",
        "Perfect for fruit setting. Maintain consistent soil moisture.": "കായ പിടിക്കാൻ പറ്റിയ സമയം. മണ്ണിൽ ആവശ്യത്തിന് ഈർപ്പം ഉറപ്പുവരുത്തുക.",
        "Extreme heat alert! Protect all young saplings and increase water frequency.": "കഠിനമായ ചൂട് മുന്നറിയിപ്പ്! ചെറിയ തൈകൾ സംരക്ഷിക്കുകയും നനയ്ക്കുന്നത് കൂട്ടുകയും ചെയ്യുക.",
        "Precipitation alert. Delay pesticide application and check drainage channels.": "മഴ മുന്നറിയിപ്പ്. കീടനാശിനി പ്രയോഗം മാറ്റിവെക്കുക, ചാലുകൾ വൃത്തിയാക്കുക."
    },
    bn: {
        "Conditions are stable for most crops.": "অধিকাংশ ফসলের জন্য আবহাওয়া স্থিতিশীল।",
        "High heat! Rice requires standing water. Increase irrigation to prevent soil cracking.": "প্রচণ্ড গরম! ধানের জন্য দাঁড়িয়ে থাকা জলের প্রয়োজন। মাটি ফাটা রোধ করতে সেচ বাড়ান।",
        "Rain expected. Good for transplanting, but ensure drainage isn't blocked.": "বৃষ্টির সম্ভাবনা। চারা রোপণের জন্য ভালো, তবে নিকাশি ব্যবস্থা পরিষ্কার রাখুন।",
        "Maintain 2-3 inches of standing water in the fields.": "জমিতে ২-৩ ইঞ্চি জল ধরে রাখুন।",
        "Warm winds detected. Terminal heat may reduce grain size. Apply light irrigation.": "গরম বাতাস বইছে। তাপের কারণে দানা ছোট হতে পারে। হালকা সেচ দিন।",
        "Rain expected. Postpone irrigation to avoid waterlogging and root rot.": "বৃষ্টির সম্ভাবনা। জল জমে যাওয়া এবং শিকড় পচা রোধে সেচ স্থগিত করুন।",
        "Ideal conditions for tillering. Monitor for rust diseases.": "গাছ বাড়ার জন্য আদর্শ সময়। মরচে রোগের দিকে নজর দিন।",
        "Extreme heat can cause blossom drop. Use mulch to keep roots cool.": "প্রচণ্ড গরমে ফুল ঝরে যেতে পারে। শিকড় ঠান্ডা রাখতে মালচিং ব্যবহার করুন।",
        "High humidity/Rain. Risk of Late Blight. Apply protective fungicide spray.": "অধিক আর্দ্রতা/বৃষ্টি। লেট ব্লাইটের ঝুঁকি। ছত্রাকনাশক স্প্রে করুন।",
        "Perfect for fruit setting. Maintain consistent soil moisture.": "ফল আসার জন্য উপযুক্ত সময়। মাটিতে আর্দ্রতা বজায় রাখুন।",
        "Extreme heat alert! Protect all young saplings and increase water frequency.": "প্রচণ্ড গরমের সতর্কতা! ছোট চারা রক্ষা করুন এবং সেচের পরিমাণ বাড়ান।",
        "Precipitation alert. Delay pesticide application and check drainage channels.": "বৃষ্টির সতর্কতা। কীটনাশক প্রয়োগ স্থগিত করুন এবং নিকাশি নালা পরীক্ষা করুন।"
    }
};

const translateAdvisory = (text, lang) => {
    if (!lang || lang === 'en') return text;
    if (advisoryTranslations[lang] && advisoryTranslations[lang][text]) {
        return advisoryTranslations[lang][text];
    }
    return text;
};


// @route   POST api/support/query
// @desc    Submit a general support query
router.post('/query', async (req, res) => {
    const { name, email, subject, message, language } = req.body;
    console.log('📬 NEW SUPPORT QUERY:', { name, email, subject, message, language });

    try {
        const newComplaint = new Complaint({
            type: 'query',
            userName: name || 'Anonymous',
            userEmail: email,
            subject: subject || 'General Inquiry',
            details: { message, language }
        });
        await newComplaint.save();

        res.status(200).json({
            success: true,
            message: 'Your query has been received. Our expert will contact you soon.'
        });
    } catch (error) {
        console.error('❌ QUERY ERROR:', error);
        res.status(500).json({ success: false, error: 'Failed to save query' });
    }
});

// @route   POST api/support/dispute
// @desc    Submit a dispute report
router.post('/dispute', async (req, res) => {
    const { name, email, buyerName, orderId, issue, details } = req.body;
    console.log('⚖️ NEW DISPUTE REPORTED:', { name, email, buyerName, orderId, issue, details });

    try {
        const newComplaint = new Complaint({
            type: 'dispute',
            userName: name || 'Anonymous',
            userEmail: email,
            subject: `Dispute: ${issue}`,
            details: { buyerName, orderId, issue, details }
        });
        await newComplaint.save();

        res.status(200).json({
            success: true,
            message: 'Dispute has been registered. Our resolution team is looking into it.'
        });
    } catch (error) {
        console.error('❌ DISPUTE ERROR:', error);
        res.status(500).json({ success: false, error: 'Failed to register dispute' });
    }
});

// @route   GET api/support/all-reports
// @desc    Get all complaints (Admin Only)
router.get('/all-reports', async (req, res) => {
    try {
        const reports = await Complaint.find().sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error) {
        console.error('❌ FETCH REPORTS ERROR:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reports' });
    }
});

// @route   PUT api/support/:id/status
// @desc    Update complaint status (Admin Only)
router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        const report = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );
        res.json({ success: true, data: report });
    } catch (error) {
        console.error('❌ UPDATE STATUS ERROR:', error);
        res.status(500).json({ success: false, error: 'Failed to update status' });
    }
});

// @route   GET api/support/my-reports
// @desc    Get complaints for a specific user
router.get('/my-reports', async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
    }
    try {
        const reports = await Complaint.find({ userEmail: email }).sort({ createdAt: -1 });
        res.json({ success: true, data: reports });
    } catch (error) {
        console.error('❌ FETCH MY REPORTS ERROR:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user reports' });
    }
});

// In-memory cache for weather data to prevent 429 Rate Limit errors on shared hosting
const weatherCache = {};
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

const getCacheKey = (lat, lon, crop, lang) => {
    // Round coordinates to 2 decimal places to group nearby requests (~1.1km)
    const roundedLat = parseFloat(lat).toFixed(2);
    const roundedLon = parseFloat(lon).toFixed(2);
    return `${roundedLat}_${roundedLon}_${crop}_${lang}`;
};

// @route   GET api/support/weather
// @desc    Get real-time weather and crop-specific advisories
router.get('/weather', async (req, res) => {
    const { lat = 28.6139, lon = 77.2090, crop = 'General', lang = 'en' } = req.query;
    const cacheKey = getCacheKey(lat, lon, crop, lang);

    // Check cache
    const cachedData = weatherCache[cacheKey];
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
        console.log('⚡ Using Cached Weather Data for:', cacheKey);
        return res.json({ success: true, data: cachedData.data });
    }

    try {
        console.log('📡 Fetching Fresh Weather Data from OpenWeatherMap...');
        
        const API_KEY = process.env.WEATHER_API_KEY?.trim(); // The user provided the OpenWeatherMap key
        if (!API_KEY) {
            throw new Error('WEATHER_API_KEY is not configured in environment variables');
        }

        let weatherRes;
        let retries = 3;
        while (retries > 0) {
            try {
                // OpenWeatherMap 5-day / 3-hour forecast using native fetch and AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);
                
                const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                weatherRes = { data };
                break; // Success, exit loop
            } catch (err) {
                console.log(`⚠️ Weather API Error. Retrying in ${4 - retries} seconds...`);
                await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
                retries--;
                if (retries === 0) throw err;
            }
        }

        const forecastList = weatherRes.data.list;
        const current = forecastList[0]; // Nearest 3-hour block is our "current"

        // Agricultural Advisory Logic
        let advisory = "Conditions are stable for most crops.";
        let level = "Normal";
        let icon = "✅";

        const temp = current.main.temp;
        
        // Map OpenWeatherMap codes to Open-Meteo style codes for frontend compatibility
        // OpenWeatherMap uses 2xx (Thunderstorm), 3xx (Drizzle), 5xx (Rain), 6xx (Snow), 7xx (Atmosphere/Mist), 800 (Clear), 80x (Clouds)
        let code = 0; // default clear
        const wCode = current.weather[0].id;
        if (wCode >= 801 && wCode <= 804) code = 2; // cloudy
        else if (wCode >= 701 && wCode <= 781) code = 45; // mist/fog
        else if (wCode >= 300 && wCode <= 531) code = 51; // rain/drizzle
        else if (wCode >= 600 && wCode <= 622) code = 71; // snow
        else if (wCode >= 200 && wCode <= 232) code = 95; // thunder/storm

        // Crop-Specific Logic
        if (crop === 'Rice') {
            if (temp > 35) advisory = "High heat! Rice requires standing water. Increase irrigation to prevent soil cracking.";
            else if (code >= 51) advisory = "Rain expected. Good for transplanting, but ensure drainage isn't blocked.";
            else advisory = "Maintain 2-3 inches of standing water in the fields.";
        } else if (crop === 'Wheat') {
            if (temp > 28) advisory = "Warm winds detected. Terminal heat may reduce grain size. Apply light irrigation.";
            else if (code >= 51) advisory = "Rain expected. Postpone irrigation to avoid waterlogging and root rot.";
            else advisory = "Ideal conditions for tillering. Monitor for rust diseases.";
        } else if (crop === 'Tomato') {
            if (temp > 32) advisory = "Extreme heat can cause blossom drop. Use mulch to keep roots cool.";
            else if (code >= 51) advisory = "High humidity/Rain. Risk of Late Blight. Apply protective fungicide spray.";
            else advisory = "Perfect for fruit setting. Maintain consistent soil moisture.";
        } else {
            // General Logic
            if (temp > 38) {
                advisory = "Extreme heat alert! Protect all young saplings and increase water frequency.";
                level = "Critical"; icon = "🔥";
            } else if (code >= 51) {
                advisory = "Precipitation alert. Delay pesticide application and check drainage channels.";
                level = "Warning"; icon = "🌧️";
            }
        }

        // Translate advisory before sending
        const translatedAdvisory = translateAdvisory(advisory, lang);

        // Extract precipitation probability for the next 8 hours (OpenWeatherMap gives 3-hour chunks, so we'll grab the first 3 chunks to approximate 9 hours)
        let rainProb = [];
        for (let i = 0; i < 3; i++) {
            // populating 3 entries per 3-hour block to simulate hourly chart in frontend
            const prob = Math.round((forecastList[i]?.pop || 0) * 100);
            rainProb.push(prob, prob, prob); 
        }
        rainProb = rainProb.slice(0, 8); // trim strictly exactly to 8 hours

        // Process 5-day forecast (OpenWeatherMap gives 40 records, 1 per 3 hours. We take 1 per day)
        const dailyForecasts = [];
        const seenDays = new Set();
        for (let i = 0; i < forecastList.length; i++) {
            const dateObj = new Date(forecastList[i].dt * 1000);
            const dateStr = dateObj.toISOString().split('T')[0];
            
            if (!seenDays.has(dateStr)) {
                seenDays.add(dateStr);
                
                const dwCode = forecastList[i].weather[0].id;
                let dCode = 0;
                if (dwCode >= 801 && dwCode <= 804) dCode = 2; 
                else if (dwCode >= 701 && dwCode <= 781) dCode = 45; 
                else if (dwCode >= 300 && dwCode <= 531) dCode = 51; 
                else if (dwCode >= 600 && dwCode <= 622) dCode = 71; 
                else if (dwCode >= 200 && dwCode <= 232) dCode = 95;

                dailyForecasts.push({
                    date: dateStr,
                    max: forecastList[i].main.temp_max + 2, // Slight adjustment for daily max approximation from 3hr snippet
                    min: forecastList[i].main.temp_min - 2,
                    code: dCode
                });
                
                if (dailyForecasts.length === 5) break;
            }
        }

        const responseData = {
            temp,
            humidity: current.main.humidity,
            wind: Math.round(current.wind.speed * 3.6), // Convert m/s to km/h
            code,
            advisory: translatedAdvisory,
            level,
            icon,
            rainProb,
            crop,
            location: { lat, lon },
            forecast: dailyForecasts
        };

        // Update cache
        weatherCache[cacheKey] = {
            timestamp: Date.now(),
            data: responseData
        };

        res.json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('❌ WEATHER API ERROR:', error.message);
        
        // If we have any expired cache, return it as a fallback instead of failing
        if (cachedData) {
            console.log('🔄 Fallback to expired cache due to API error');
            return res.json({ success: true, data: cachedData.data });
        }

        res.status(500).json({ success: false, message: 'Failed to fetch regional weather intelligence. Please try again later.' });
    }
});

// @route   GET api/support/advisory
// @desc    Get latest farmer advisories
router.get('/advisory', (req, res) => {
    res.json(advisories);
});

module.exports = router;
