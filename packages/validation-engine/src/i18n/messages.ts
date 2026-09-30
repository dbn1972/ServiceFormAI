/**
 * Locale-specific message maps for validation error codes.
 *
 * Each map is keyed by error code and contains a template string.
 * The `{field}` placeholder is replaced with the field label at runtime.
 */

import type { SupportedLocale } from '../types.js';

export type MessageMap = Record<string, string>;

// ---------------------------------------------------------------------------
// English (en)
// ---------------------------------------------------------------------------

export const en: MessageMap = {
  REQUIRED: '{field} is required',
  MIN_LENGTH: '{field} is too short',
  MAX_LENGTH: '{field} is too long',
  MIN_VALUE: '{field} is below the minimum value',
  MAX_VALUE: '{field} exceeds the maximum value',
  PATTERN_MISMATCH: '{field} does not match the required format',
  INVALID_OPTION: '{field} has an invalid selection',
  DATE_OUT_OF_RANGE: '{field} is outside the allowed date range',
  FILE_TOO_LARGE: '{field} exceeds the maximum file size',
  INVALID_FILE_TYPE: '{field} has an unsupported file type',
  INVALID_AADHAAR: '{field} is not a valid Aadhaar number',
  INVALID_PAN: '{field} is not a valid PAN',
  INVALID_MOBILE_IN: '{field} is not a valid Indian mobile number',
  INVALID_IFSC: '{field} is not a valid IFSC code',
  INVALID_PINCODE_IN: '{field} is not a valid Indian pincode',
  INVALID_EMAIL: '{field} is not a valid email address',
  INVALID_BANK_ACCOUNT_IN: '{field} is not a valid Indian bank account number',
  DATE_ORDER_VIOLATION: '{field} has an invalid date order',
  CONDITIONAL_REQUIRED: '{field} is required based on your selections',
  SUM_MISMATCH: '{field} values do not add up to the expected total',
  MUTUALLY_EXCLUSIVE_VIOLATION: '{field} cannot be filled together with another field',
  FIELD_MISMATCH: '{field} does not match',
  UNKNOWN_STEP: 'Unknown form step',
};

// ---------------------------------------------------------------------------
// Hindi (hi)
// ---------------------------------------------------------------------------

export const hi: MessageMap = {
  REQUIRED: '{field} आवश्यक है',
  MIN_LENGTH: '{field} बहुत छोटा है',
  MAX_LENGTH: '{field} बहुत लंबा है',
  MIN_VALUE: '{field} न्यूनतम मान से कम है',
  MAX_VALUE: '{field} अधिकतम मान से अधिक है',
  PATTERN_MISMATCH: '{field} आवश्यक प्रारूप से मेल नहीं खाता',
  INVALID_OPTION: '{field} में अमान्य चयन है',
  DATE_OUT_OF_RANGE: '{field} अनुमत तिथि सीमा से बाहर है',
  FILE_TOO_LARGE: '{field} अधिकतम फ़ाइल आकार से अधिक है',
  INVALID_FILE_TYPE: '{field} का फ़ाइल प्रकार समर्थित नहीं है',
  INVALID_AADHAAR: '{field} एक मान्य आधार संख्या नहीं है',
  INVALID_PAN: '{field} एक मान्य पैन नहीं है',
  INVALID_MOBILE_IN: '{field} एक मान्य भारतीय मोबाइल नंबर नहीं है',
  INVALID_IFSC: '{field} एक मान्य IFSC कोड नहीं है',
  INVALID_PINCODE_IN: '{field} एक मान्य भारतीय पिनकोड नहीं है',
  INVALID_EMAIL: '{field} एक मान्य ईमेल पता नहीं है',
  INVALID_BANK_ACCOUNT_IN: '{field} एक मान्य भारतीय बैंक खाता संख्या नहीं है',
  DATE_ORDER_VIOLATION: '{field} में तिथि क्रम अमान्य है',
  CONDITIONAL_REQUIRED: '{field} आपके चयन के आधार पर आवश्यक है',
  SUM_MISMATCH: '{field} के मान अपेक्षित कुल से मेल नहीं खाते',
  MUTUALLY_EXCLUSIVE_VIOLATION: '{field} को किसी अन्य फ़ील्ड के साथ नहीं भरा जा सकता',
  FIELD_MISMATCH: '{field} मेल नहीं खाता',
  UNKNOWN_STEP: 'अज्ञात फ़ॉर्म चरण',
};

// ---------------------------------------------------------------------------
// Tamil (ta)
// ---------------------------------------------------------------------------

export const ta: MessageMap = {
  REQUIRED: '{field} தேவை',
  MIN_LENGTH: '{field} மிகவும் குறுகியது',
  MAX_LENGTH: '{field} மிகவும் நீளமானது',
  MIN_VALUE: '{field} குறைந்தபட்ச மதிப்பை விட குறைவு',
  MAX_VALUE: '{field} அதிகபட்ச மதிப்பை மீறுகிறது',
  PATTERN_MISMATCH: '{field} தேவையான வடிவத்துடன் பொருந்தவில்லை',
  INVALID_OPTION: '{field} தவறான தேர்வு உள்ளது',
  DATE_OUT_OF_RANGE: '{field} அனுமதிக்கப்பட்ட தேதி வரம்பிற்கு வெளியே உள்ளது',
  FILE_TOO_LARGE: '{field} அதிகபட்ச கோப்பு அளவை மீறுகிறது',
  INVALID_FILE_TYPE: '{field} ஆதரிக்கப்படாத கோப்பு வகை',
  INVALID_AADHAAR: '{field} சரியான ஆதார் எண் அல்ல',
  INVALID_PAN: '{field} சரியான PAN அல்ல',
  INVALID_MOBILE_IN: '{field} சரியான இந்திய மொபைல் எண் அல்ல',
  INVALID_IFSC: '{field} சரியான IFSC குறியீடு அல்ல',
  INVALID_PINCODE_IN: '{field} சரியான இந்திய அஞ்சல் குறியீடு அல்ல',
  INVALID_EMAIL: '{field} சரியான மின்னஞ்சல் முகவரி அல்ல',
  INVALID_BANK_ACCOUNT_IN: '{field} சரியான இந்திய வங்கி கணக்கு எண் அல்ல',
  DATE_ORDER_VIOLATION: '{field} தேதி வரிசை தவறானது',
  CONDITIONAL_REQUIRED: '{field} உங்கள் தேர்வுகளின் அடிப்படையில் தேவை',
  SUM_MISMATCH: '{field} மதிப்புகள் எதிர்பார்த்த மொத்தத்துடன் பொருந்தவில்லை',
  MUTUALLY_EXCLUSIVE_VIOLATION: '{field} மற்றொரு புலத்துடன் சேர்த்து நிரப்ப முடியாது',
  FIELD_MISMATCH: '{field} பொருந்தவில்லை',
  UNKNOWN_STEP: 'அறியப்படாத படிவ படி',
};

// ---------------------------------------------------------------------------
// Telugu (te)
// ---------------------------------------------------------------------------

export const te: MessageMap = {
  REQUIRED: '{field} అవసరం',
  MIN_LENGTH: '{field} చాలా చిన్నది',
  MAX_LENGTH: '{field} చాలా పొడవుగా ఉంది',
  MIN_VALUE: '{field} కనిష్ట విలువ కంటే తక్కువ',
  MAX_VALUE: '{field} గరిష్ట విలువను మించిపోయింది',
  PATTERN_MISMATCH: '{field} అవసరమైన ఆకృతికి సరిపోలడం లేదు',
  INVALID_OPTION: '{field} చెల్లని ఎంపిక ఉంది',
  DATE_OUT_OF_RANGE: '{field} అనుమతించబడిన తేదీ పరిధి వెలుపల ఉంది',
  FILE_TOO_LARGE: '{field} గరిష్ట ఫైల్ పరిమాణాన్ని మించిపోయింది',
  INVALID_FILE_TYPE: '{field} మద్దతు లేని ఫైల్ రకం',
  INVALID_AADHAAR: '{field} చెల్లుబాటు అయ్యే ఆధార్ సంఖ్య కాదు',
  INVALID_PAN: '{field} చెల్లుబాటు అయ్యే PAN కాదు',
  INVALID_MOBILE_IN: '{field} చెల్లుబాటు అయ్యే భారతీయ మొబైల్ నంబర్ కాదు',
  INVALID_IFSC: '{field} చెల్లుబాటు అయ్యే IFSC కోడ్ కాదు',
  INVALID_PINCODE_IN: '{field} చెల్లుబాటు అయ్యే భారతీయ పిన్‌కోడ్ కాదు',
  INVALID_EMAIL: '{field} చెల్లుబాటు అయ్యే ఇమెయిల్ చిరునామా కాదు',
  INVALID_BANK_ACCOUNT_IN: '{field} చెల్లుబాటు అయ్యే భారతీయ బ్యాంక్ ఖాతా సంఖ్య కాదు',
  DATE_ORDER_VIOLATION: '{field} తేదీ క్రమం చెల్లదు',
  CONDITIONAL_REQUIRED: '{field} మీ ఎంపికల ఆధారంగా అవసరం',
  SUM_MISMATCH: '{field} విలువలు ఆశించిన మొత్తానికి సరిపోలడం లేదు',
  MUTUALLY_EXCLUSIVE_VIOLATION: '{field} మరొక ఫీల్డ్‌తో కలిపి నింపలేరు',
  FIELD_MISMATCH: '{field} సరిపోలడం లేదు',
  UNKNOWN_STEP: 'తెలియని ఫారం దశ',
};


// ---------------------------------------------------------------------------
// Bengali (bn)
// ---------------------------------------------------------------------------

export const bn: MessageMap = {
  REQUIRED: '{field} আবশ্যক',
  MIN_LENGTH: '{field} খুব ছোট',
  MAX_LENGTH: '{field} খুব দীর্ঘ',
  MIN_VALUE: '{field} ন্যূনতম মানের চেয়ে কম',
  MAX_VALUE: '{field} সর্বোচ্চ মান অতিক্রম করেছে',
  PATTERN_MISMATCH: '{field} প্রয়োজনীয় বিন্যাসের সাথে মেলে না',
  INVALID_OPTION: '{field} একটি অবৈধ নির্বাচন আছে',
  DATE_OUT_OF_RANGE: '{field} অনুমোদিত তারিখ সীমার বাইরে',
  FILE_TOO_LARGE: '{field} সর্বোচ্চ ফাইলের আকার অতিক্রম করেছে',
  INVALID_FILE_TYPE: '{field} অসমর্থিত ফাইল ধরন',
  INVALID_AADHAAR: '{field} একটি বৈধ আধার নম্বর নয়',
  INVALID_PAN: '{field} একটি বৈধ PAN নয়',
  INVALID_MOBILE_IN: '{field} একটি বৈধ ভারতীয় মোবাইল নম্বর নয়',
  INVALID_IFSC: '{field} একটি বৈধ IFSC কোড নয়',
  INVALID_PINCODE_IN: '{field} একটি বৈধ ভারতীয় পিনকোড নয়',
  INVALID_EMAIL: '{field} একটি বৈধ ইমেল ঠিকানা নয়',
  INVALID_BANK_ACCOUNT_IN: '{field} একটি বৈধ ভারতীয় ব্যাংক অ্যাকাউন্ট নম্বর নয়',
  DATE_ORDER_VIOLATION: '{field} তারিখ ক্রম অবৈধ',
  CONDITIONAL_REQUIRED: '{field} আপনার নির্বাচনের উপর ভিত্তি করে আবশ্যক',
  SUM_MISMATCH: '{field} মানগুলি প্রত্যাশিত মোটের সাথে মেলে না',
  MUTUALLY_EXCLUSIVE_VIOLATION: '{field} অন্য একটি ক্ষেত্রের সাথে একসাথে পূরণ করা যাবে না',
  FIELD_MISMATCH: '{field} মেলে না',
  UNKNOWN_STEP: 'অজানা ফর্ম ধাপ',
};

// ---------------------------------------------------------------------------
// Marathi (mr)
// ---------------------------------------------------------------------------

export const mr: MessageMap = {
  REQUIRED: '{field} आवश्यक आहे',
  MIN_LENGTH: '{field} खूप लहान आहे',
  MAX_LENGTH: '{field} खूप मोठे आहे',
  MIN_VALUE: '{field} किमान मूल्यापेक्षा कमी आहे',
  MAX_VALUE: '{field} कमाल मूल्यापेक्षा जास्त आहे',
  PATTERN_MISMATCH: '{field} आवश्यक स्वरूपाशी जुळत नाही',
  INVALID_OPTION: '{field} मध्ये अवैध निवड आहे',
  DATE_OUT_OF_RANGE: '{field} अनुमत तारीख मर्यादेबाहेर आहे',
  FILE_TOO_LARGE: '{field} कमाल फाइल आकार ओलांडला आहे',
  INVALID_FILE_TYPE: '{field} असमर्थित फाइल प्रकार आहे',
  INVALID_AADHAAR: '{field} वैध आधार क्रमांक नाही',
  INVALID_PAN: '{field} वैध PAN नाही',
  INVALID_MOBILE_IN: '{field} वैध भारतीय मोबाइल क्रमांक नाही',
  INVALID_IFSC: '{field} वैध IFSC कोड नाही',
  INVALID_PINCODE_IN: '{field} वैध भारतीय पिनकोड नाही',
  INVALID_EMAIL: '{field} वैध ईमेल पत्ता नाही',
  INVALID_BANK_ACCOUNT_IN: '{field} वैध भारतीय बँक खाते क्रमांक नाही',
  DATE_ORDER_VIOLATION: '{field} तारीख क्रम अवैध आहे',
  CONDITIONAL_REQUIRED: '{field} आपल्या निवडीनुसार आवश्यक आहे',
  SUM_MISMATCH: '{field} मूल्ये अपेक्षित एकूणाशी जुळत नाहीत',
  MUTUALLY_EXCLUSIVE_VIOLATION: '{field} दुसऱ्या फील्डसोबत भरता येत नाही',
  FIELD_MISMATCH: '{field} जुळत नाही',
  UNKNOWN_STEP: 'अज्ञात फॉर्म टप्पा',
};

// ---------------------------------------------------------------------------
// Kannada (kn)
// ---------------------------------------------------------------------------

export const kn: MessageMap = {
  REQUIRED: '{field} ಅಗತ್ಯವಿದೆ',
  MIN_LENGTH: '{field} ತುಂಬಾ ಚಿಕ್ಕದಾಗಿದೆ',
  MAX_LENGTH: '{field} ತುಂಬಾ ಉದ್ದವಾಗಿದೆ',
  MIN_VALUE: '{field} ಕನಿಷ್ಠ ಮೌಲ್ಯಕ್ಕಿಂತ ಕಡಿಮೆಯಾಗಿದೆ',
  MAX_VALUE: '{field} ಗರಿಷ್ಠ ಮೌಲ್ಯವನ್ನು ಮೀರಿದೆ',
  PATTERN_MISMATCH: '{field} ಅಗತ್ಯ ಸ್ವರೂಪಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುವುದಿಲ್ಲ',
  INVALID_OPTION: '{field} ಅಮಾನ್ಯ ಆಯ್ಕೆ ಹೊಂದಿದೆ',
  DATE_OUT_OF_RANGE: '{field} ಅನುಮತಿಸಲಾದ ದಿನಾಂಕ ವ್ಯಾಪ್ತಿಯ ಹೊರಗಿದೆ',
  FILE_TOO_LARGE: '{field} ಗರಿಷ್ಠ ಫೈಲ್ ಗಾತ್ರವನ್ನು ಮೀರಿದೆ',
  INVALID_FILE_TYPE: '{field} ಬೆಂಬಲಿಸದ ಫೈಲ್ ಪ್ರಕಾರ',
  INVALID_AADHAAR: '{field} ಮಾನ್ಯ ಆಧಾರ್ ಸಂಖ್ಯೆ ಅಲ್ಲ',
  INVALID_PAN: '{field} ಮಾನ್ಯ PAN ಅಲ್ಲ',
  INVALID_MOBILE_IN: '{field} ಮಾನ್ಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಲ್ಲ',
  INVALID_IFSC: '{field} ಮಾನ್ಯ IFSC ಕೋಡ್ ಅಲ್ಲ',
  INVALID_PINCODE_IN: '{field} ಮಾನ್ಯ ಭಾರತೀಯ ಪಿನ್‌ಕೋಡ್ ಅಲ್ಲ',
  INVALID_EMAIL: '{field} ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸ ಅಲ್ಲ',
  INVALID_BANK_ACCOUNT_IN: '{field} ಮಾನ್ಯ ಭಾರತೀಯ ಬ್ಯಾಂಕ್ ಖಾತೆ ಸಂಖ್ಯೆ ಅಲ್ಲ',
  DATE_ORDER_VIOLATION: '{field} ದಿನಾಂಕ ಕ್ರಮ ಅಮಾನ್ಯವಾಗಿದೆ',
  CONDITIONAL_REQUIRED: '{field} ನಿಮ್ಮ ಆಯ್ಕೆಗಳ ಆಧಾರದ ಮೇಲೆ ಅಗತ್ಯವಿದೆ',
  SUM_MISMATCH: '{field} ಮೌಲ್ಯಗಳು ನಿರೀಕ್ಷಿತ ಒಟ್ಟು ಮೊತ್ತಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುವುದಿಲ್ಲ',
  MUTUALLY_EXCLUSIVE_VIOLATION: '{field} ಮತ್ತೊಂದು ಕ್ಷೇತ್ರದೊಂದಿಗೆ ಒಟ್ಟಿಗೆ ಭರ್ತಿ ಮಾಡಲಾಗುವುದಿಲ್ಲ',
  FIELD_MISMATCH: '{field} ಹೊಂದಿಕೆಯಾಗುವುದಿಲ್ಲ',
  UNKNOWN_STEP: 'ತಿಳಿಯದ ಫಾರ್ಮ್ ಹಂತ',
};

// ---------------------------------------------------------------------------
// Locale → MessageMap lookup
// ---------------------------------------------------------------------------

export const localeMessages: Record<SupportedLocale, MessageMap> = {
  en,
  hi,
  ta,
  te,
  bn,
  mr,
  kn,
};
