const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
    console.log('❌ Error loading .env:', result.error.message);
    process.exit(1);
}

console.log('✅ .env loaded successfully!');
console.log('=== Environment Variables Status ===');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET);
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('');
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
