const crypto = require('crypto');

function validateGoogleProfile(profile) {
  if (
    !profile ||
    !profile.email ||
    profile.email_verified !== true ||
    !['accounts.google.com', 'https://accounts.google.com'].includes(profile.iss)
  ) {
    const error = new Error('Google profile is not verified');
    error.code = 'INVALID_GOOGLE_PROFILE';
    throw error;
  }

  return {
    email: String(profile.email).trim().toLowerCase(),
    fullName: String(profile.name || profile.email.split('@')[0]).trim().slice(0, 100)
  };
}

function usernameBaseFromEmail(email) {
  return (
    email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 40) ||
    'google-user'
  );
}

async function signInWithGoogle({ profile, repository, hashPassword }) {
  const { email, fullName } = validateGoogleProfile(profile);
  let account = await repository.findByEmail(email);

  if (!account) {
    const baseUsername = usernameBaseFromEmail(email);
    let username;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const suffix = attempt === 0 ? '' : `-${crypto.randomBytes(4).toString('hex')}`;
      const candidate = `${baseUsername.slice(0, 40 - suffix.length)}${suffix}`;
      if (!(await repository.findByUsername(candidate))) {
        username = candidate;
        break;
      }
    }

    if (!username) {
      const error = new Error('Could not allocate username');
      error.code = 'USERNAME_ALLOCATION_FAILED';
      throw error;
    }

    try {
      await repository.createUser({
        username,
        email,
        password: await hashPassword(crypto.randomBytes(32).toString('hex')),
        fullName: fullName || username
      });
    } catch (error) {
      // A concurrent Google sign-in may create this email first. Read it below.
      if (error.code !== 'ER_DUP_ENTRY') throw error;
    }
    account = await repository.findByEmail(email);
  }

  if (!account) {
    const error = new Error('Google account could not be created');
    error.code = 'GOOGLE_ACCOUNT_CREATION_FAILED';
    throw error;
  }

  return account;
}

module.exports = { signInWithGoogle, validateGoogleProfile, usernameBaseFromEmail };
