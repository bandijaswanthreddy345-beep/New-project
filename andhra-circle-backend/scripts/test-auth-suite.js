const http = require('http');
const mongoose = require('../node_modules/mongoose');
const dotenv = require('../node_modules/dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
require('../models/user');

function postJson(urlPath, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fullSuite() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = mongoose.model('User');
  const bcrypt = require('../node_modules/bcryptjs');

  const timestamp = Date.now();
  const testUserEmail = 'authtest_throwaway_' + timestamp + '@example.com';
  const testPassword = 'SecretPassword123!';

  // Create user directly in scratch / test to verify login flows
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(testPassword, salt);
  const createdUser = await User.create({
    name: 'Ephemeral Auth Tester',
    email: testUserEmail.toLowerCase(),
    password: hash,
    role: 'student',
    termsConsent: true,
    privacyConsent: true,
    consentTimestamp: new Date(),
    termsVersion: '1.0'
  });

  console.log('\n--- 1. DIRECT LOGIN (MATCHING CREDENTIALS) ---');
  const loginRes = await postJson('/api/auth/login', {
    email: testUserEmail,
    password: testPassword
  });
  console.log('Status:', loginRes.status);
  console.log('Response Message:', loginRes.body.message);
  console.log('User Role Returned:', loginRes.body.user?.role);
  console.log('Token Present:', !!loginRes.body.token);

  console.log('\n--- 2. LOGIN WITH UPPERCASE EMAIL ---');
  const upperLoginRes = await postJson('/api/auth/login', {
    email: testUserEmail.toUpperCase(),
    password: testPassword
  });
  console.log('Status:', upperLoginRes.status);
  console.log('Response Message:', upperLoginRes.body.message);
  console.log('User Stored Email:', upperLoginRes.body.user?.email);

  console.log('\n--- 3. LOGIN WITH WRONG PASSWORD ---');
  const wrongPassRes = await postJson('/api/auth/login', {
    email: testUserEmail,
    password: 'WrongPassword999!'
  });
  console.log('Status:', wrongPassRes.status);
  console.log('Response Body:', wrongPassRes.body);

  console.log('\n--- 4. FORGOT PASSWORD CALL ---');
  const forgotRes = await postJson('/api/auth/forgot-password', {
    email: testUserEmail
  });
  console.log('Status:', forgotRes.status);
  console.log('Response Body:', forgotRes.body);

  console.log('\n--- 5. RESET PASSWORD & TOKEN REVOCATION FLOW ---');
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  await User.updateOne(
    { _id: createdUser._id },
    { $set: { resetPasswordToken: hashedToken, resetPasswordExpire: new Date(Date.now() + 15 * 60 * 1000) } }
  );

  const newPassword = 'NewSecretPassword456!';
  const resetRes = await postJson('/api/auth/reset-password/' + resetToken, {
    password: newPassword
  });
  console.log('Reset Password Status:', resetRes.status);
  console.log('Reset Password Body:', resetRes.body);

  // Try reusing old token (should be rejected)
  const reuseRes = await postJson('/api/auth/reset-password/' + resetToken, {
    password: 'AnotherPassword789!'
  });
  console.log('Reused Token Status (Expected 400):', reuseRes.status);
  console.log('Reused Token Body:', reuseRes.body);

  // Try login with new password
  const newLoginRes = await postJson('/api/auth/login', {
    email: testUserEmail,
    password: newPassword
  });
  console.log('Login With New Password Status:', newLoginRes.status);
  console.log('Login With New Password Message:', newLoginRes.body.message);

  // Clean up throwaway user immediately
  await User.deleteOne({ _id: createdUser._id });
  console.log('\nThrowaway test user cleanly deleted. Total users in database remains untouched.');

  await mongoose.disconnect();
}

fullSuite().catch(err => {
  console.error('Error running test suite:', err);
  process.exit(1);
});
