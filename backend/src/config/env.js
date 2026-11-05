const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB || 250),
  hasSupabaseKeys: Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_URL !== 'your_supabase_project_url'
  ),
  hasGeminiKey: Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'your_google_gemini_api_key'
  ),
  hasTranscriptionKey: Boolean(
    process.env.TRANSCRIPTION_API_KEY &&
    process.env.TRANSCRIPTION_API_KEY !== 'your_whisper_or_groq_api_key'
  )
};
