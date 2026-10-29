const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { signInWithGoogle } = require('../js/google_auth');

function profile(overrides = {}) {
  return {
    iss: 'https://accounts.google.com',
    email: 'new.user@gmail.com',
    email_verified: true,
    name: 'New User',
    ...overrides
  };
}

function repository(initialUsers = []) {
  const users = [...initialUsers];
  return {
    users,
    async findByEmail(email) {
      return users.find((user) => user.email === email) || null;
    },
    async findByUsername(username) {
      return users.find((user) => user.username === username) || null;
    },
    async createUser(user) {
      if (users.some((item) => item.email === user.email || item.username === user.username)) {
        const error = new Error('duplicate');
        error.code = 'ER_DUP_ENTRY';
        throw error;
      }
      users.push({ id: users.length + 1, ...user, full_name: user.fullName, role: 'user', phone: null });
    }
  };
}

const hashPassword = async () => 'hashed-random-password';

test('uses the user table in the active database', () => {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(serverSource, /FROM `user` WHERE email = \?/);
  assert.ok(serverSource.includes('INSERT INTO \\`user\\`'));
  assert.doesNotMatch(serverSource, /FROM `users`|INTO `users`|UPDATE `users`/);
});

test('creates a website account for a verified Google identity', async () => {
  const store = repository();
  const account = await signInWithGoogle({ profile: profile(), repository: store, hashPassword });

  assert.equal(account.email, 'new.user@gmail.com');
  assert.equal(account.username, 'new.user');
  assert.equal(account.full_name, 'New User');
  assert.equal(account.password, 'hashed-random-password');
});

test('uses the existing website account for the same Google email', async () => {
  const existing = { id: 42, username: 'member', email: 'member@gmail.com', full_name: 'Member', role: 'user' };
  const store = repository([existing]);
  const account = await signInWithGoogle({
    profile: profile({ email: 'MEMBER@gmail.com' }), repository: store, hashPassword
  });

  assert.equal(account, existing);
  assert.equal(store.users.length, 1);
});

test('allocates a distinct username when the email prefix is already used', async () => {
  const store = repository([{ id: 1, username: 'new.user', email: 'other@gmail.com' }]);
  const account = await signInWithGoogle({ profile: profile(), repository: store, hashPassword });

  assert.match(account.username, /^new\.user-[a-f0-9]{8}$/);
});

test('rejects an unverified Google email', async () => {
  await assert.rejects(
    signInWithGoogle({ profile: profile({ email_verified: false }), repository: repository(), hashPassword }),
    { code: 'INVALID_GOOGLE_PROFILE' }
  );
});

test('rejects a profile from an untrusted issuer', async () => {
  await assert.rejects(
    signInWithGoogle({ profile: profile({ iss: 'https://example.test' }), repository: repository(), hashPassword }),
    { code: 'INVALID_GOOGLE_PROFILE' }
  );
});
