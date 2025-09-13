/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    MAPS_API_KEY: process.env.MAPS_API_KEY,
    WEATHER_API_KEY: process.env.WEATHER_API_KEY,
  }
}

module.exports = nextConfig
