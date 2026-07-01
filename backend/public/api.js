// Minimal fetch wrapper shared by all test-UI pages.
// No build step, no framework — plain functions used directly by each page's inline script.

async function apiRequest(method, path, body) {
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

function showMessage(elementId, text, isError) {
  const el = document.getElementById(elementId);
  el.textContent = text;
  el.className = isError ? 'error' : 'success';
}

function formatMoney(amount) {
  return '\u20b9' + Number(amount).toFixed(2);
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
