const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadAuthScript(fetch) {
  const elements = {
    googleBtn: { dataset: { clientId: 'test-client-id' } },
    errorMsg: { textContent: '', style: {} },
    successMsg: { textContent: '', style: {} }
  };
  const context = {
    console: { error() {}, warn() {} },
    fetch,
    document: { getElementById: (id) => elements[id] || null },
    window: { location: {}, addEventListener() {} },
    setInterval() {},
    clearInterval() {},
    setTimeout() {}
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'auth.js'), 'utf8'), context);
  return { context, elements };
}

test('sends the Google credential to the website and redirects after success', async () => {
  let request;
  const { context } = loadAuthScript(async (url, options) => {
    request = { url, ...options };
    return { ok: true, json: async () => ({ redirect: '/profile' }) };
  });

  await context.handleGoogleCredentialResponse({ credential: 'google-id-token' });

  assert.equal(request.url, '/api/auth/google');
  assert.equal(request.method, 'POST');
  assert.equal(request.credentials, 'same-origin');
  assert.deepEqual(JSON.parse(request.body), { credential: 'google-id-token' });
  assert.equal(context.window.location.href, '/profile');
});

test('shows the server message when Google verification fails', async () => {
  const { context, elements } = loadAuthScript(async () => ({
    ok: false,
    json: async () => ({ message: 'Không thể xác minh tài khoản Google.' })
  }));

  await context.handleGoogleCredentialResponse({ credential: 'invalid-token' });

  assert.equal(elements.errorMsg.textContent, 'Không thể xác minh tài khoản Google.');
  assert.equal(elements.errorMsg.style.display, 'block');
});

test('shows an error when Google does not provide a credential', async () => {
  const { context, elements } = loadAuthScript(async () => {
    throw new Error('fetch must not be called');
  });

  await context.handleGoogleCredentialResponse({});

  assert.equal(elements.errorMsg.textContent, 'Không nhận được thông tin từ Google. Vui lòng thử lại.');
});
