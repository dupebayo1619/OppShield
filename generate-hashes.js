const bcrypt = require('bcryptjs');

async function generateHashes() {
  const memberHash = await bcrypt.hash('Test123!', 12);
  const adminHash = await bcrypt.hash('Password123!', 12);
  console.log('MEMBER_HASH:' + memberHash);
  console.log('ADMIN_HASH:' + adminHash);
}
generateHashes();
