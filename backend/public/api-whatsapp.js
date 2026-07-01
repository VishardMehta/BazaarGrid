// Minimal fetch wrapper for the WhatsApp test page. Mirrors api.js's
// pattern exactly (same error-shape handling) rather than introducing
// a different convention for one extra page.

async function apiRequestWhatsapp(method, path, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body / not JSON, ignore
  }
  if (!res.ok) {
    const message = (data && data.error && data.error.message) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.details = data && data.error && data.error.details;
    throw err;
  }
  return data;
}
