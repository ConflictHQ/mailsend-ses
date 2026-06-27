export const PAGE = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>mailsend · SES deliverability tester</title>
<style>
  :root {
    --bg:#0d1117; --panel:#161b22; --panel2:#1c2230; --border:#30363d;
    --text:#e6edf3; --muted:#8b949e; --accent:#2f81f7; --ok:#3fb950;
    --warn:#d29922; --err:#f85149; --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--text);
    font:14px/1.5 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; }
  header { padding:16px 24px; border-bottom:1px solid var(--border);
    display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  header h1 { font-size:16px; margin:0; font-weight:600; letter-spacing:.3px; }
  header h1 span { color:var(--accent); }
  .pill { font-size:11px; padding:3px 9px; border-radius:999px; border:1px solid var(--border);
    color:var(--muted); white-space:nowrap; }
  .pill.ok { color:var(--ok); border-color:var(--ok); }
  .pill.warn { color:var(--warn); border-color:var(--warn); }
  .pill.err { color:var(--err); border-color:var(--err); }
  .wrap { max-width:1180px; margin:0 auto; padding:20px 24px; display:grid;
    grid-template-columns:1fr 420px; gap:20px; align-items:start; }
  @media(max-width:900px){ .wrap{ grid-template-columns:1fr; } }
  .card { background:var(--panel); border:1px solid var(--border); border-radius:10px; padding:18px; }
  .card h2 { font-size:12px; text-transform:uppercase; letter-spacing:.6px;
    color:var(--muted); margin:0 0 14px; }
  label { display:block; font-size:12px; color:var(--muted); margin:0 0 5px; }
  input,textarea,select { width:100%; background:var(--bg); color:var(--text);
    border:1px solid var(--border); border-radius:7px; padding:9px 11px; font-size:13px;
    font-family:inherit; }
  textarea { resize:vertical; font-family:var(--mono); font-size:12.5px; }
  input:focus,textarea:focus,select:focus { outline:none; border-color:var(--accent); }
  .row { display:flex; gap:12px; } .row > * { flex:1; }
  .field { margin-bottom:14px; }
  .chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:7px; }
  .chip { font-size:11px; padding:4px 9px; border-radius:999px; background:var(--panel2);
    border:1px solid var(--border); cursor:pointer; color:var(--muted); }
  .chip:hover { border-color:var(--accent); color:var(--text); }
  .kv { display:flex; gap:8px; margin-bottom:7px; }
  .kv input { flex:1; } .kv button { flex:0 0 auto; }
  button { background:var(--panel2); color:var(--text); border:1px solid var(--border);
    border-radius:7px; padding:8px 14px; cursor:pointer; font-size:13px; }
  button:hover { border-color:var(--accent); }
  button.primary { background:var(--accent); border-color:var(--accent); color:#fff; font-weight:600;
    width:100%; padding:12px; font-size:14px; }
  button.primary:disabled { opacity:.5; cursor:not-allowed; }
  button.mini { padding:5px 9px; font-size:12px; }
  .muted { color:var(--muted); font-size:12px; }
  .stat { display:flex; justify-content:space-between; padding:7px 0;
    border-bottom:1px solid var(--border); font-size:13px; }
  .stat:last-child { border:0; }
  .stat .v { font-family:var(--mono); }
  .gauge { height:7px; background:var(--bg); border-radius:4px; overflow:hidden; margin-top:6px; }
  .gauge > i { display:block; height:100%; background:var(--accent); }
  details { margin-top:6px; border:1px solid var(--border); border-radius:7px; }
  summary { cursor:pointer; padding:9px 11px; font-size:12px; color:var(--muted); }
  details[open] summary { border-bottom:1px solid var(--border); }
  .det-body { padding:11px; }
  .log { font-family:var(--mono); font-size:12px; white-space:pre-wrap; word-break:break-word; }
  .result { border-radius:7px; padding:12px; margin-bottom:10px; border:1px solid var(--border);
    background:var(--bg); }
  .result.ok { border-left:3px solid var(--ok); }
  .result.err { border-left:3px solid var(--err); }
  .result .mid { font-family:var(--mono); font-size:12px; color:var(--ok); word-break:break-all; }
  .result .em { color:var(--err); }
  a { color:var(--accent); }
  .health { font-size:12px; margin-top:7px; line-height:1.7; }
  .health b { color:var(--text); font-weight:600; }
  .dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:5px; }
  .dot.ok{background:var(--ok);} .dot.warn{background:var(--warn);} .dot.err{background:var(--err);}
  .supp-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:7px 0; border-bottom:1px solid var(--border); }
  .supp-row:last-child { border:0; }
  .supp-meta { flex:1; min-width:0; display:flex; flex-direction:column; }
  .supp-email { font-family:var(--mono); font-size:12.5px; word-break:break-all; }
</style>
</head>
<body>
<header>
  <h1>mail<span>send</span></h1>
  <span class="pill" id="p-region">region —</span>
  <span class="pill" id="p-mode">checking…</span>
  <span class="pill" id="p-sending">—</span>
  <span class="pill" id="p-quota">quota —</span>
</header>

<div class="wrap">
  <!-- Compose -->
  <div class="card">
    <h2>Compose test message</h2>

    <div class="field">
      <label>From identity</label>
      <select id="identity"><option value="">Loading identities…</option></select>
    </div>
    <div class="field">
      <label>From address <span class="muted">(domain identities: set any local part)</span></label>
      <input id="from" placeholder="no-reply@yourdomain.com" autocomplete="off" />
      <div class="health" id="identity-health"></div>
    </div>

    <div class="field">
      <label>To <span class="muted">(comma / newline separated)</span></label>
      <textarea id="to" rows="2" placeholder="recipient@example.com"></textarea>
      <div class="chips" id="precanned"></div>
      <div class="chips"><span class="chip" id="check-supp">⌕ check suppression</span></div>
      <div class="muted" id="supp-result"></div>
    </div>

    <div class="row field">
      <div><label>Cc</label><input id="cc" placeholder="optional" /></div>
      <div><label>Bcc</label><input id="bcc" placeholder="optional" /></div>
    </div>
    <div class="field"><label>Reply-To</label><input id="replyTo" placeholder="optional" /></div>

    <div class="field"><label>Subject</label><input id="subject" value="SES deliverability test" /></div>

    <div class="field">
      <label>HTML body</label>
      <textarea id="html" rows="5">&lt;p&gt;Hello — this is a deliverability test from &lt;b&gt;mailsend&lt;/b&gt;.&lt;/p&gt;
&lt;p&gt;Tracking ID: __TRACK__&lt;/p&gt;</textarea>
    </div>
    <div class="field">
      <label>Plain-text body</label>
      <textarea id="text" rows="2">Hello — deliverability test from mailsend. Tracking ID: __TRACK__</textarea>
    </div>

    <details>
      <summary>Custom headers &amp; SES message tags</summary>
      <div class="det-body">
        <label>Headers (X-* tracking headers, etc.)</label>
        <div id="headers"></div>
        <button class="mini" onclick="addKV('headers')">+ header</button>
        <label style="margin-top:12px">Message tags (CloudWatch / event dimensions)</label>
        <div id="tags"></div>
        <button class="mini" onclick="addKV('tags')">+ tag</button>
        <label style="margin-top:12px">Configuration set</label>
        <input id="configSet" placeholder="(from env default)" />
      </div>
    </details>

    <div class="row" style="margin-top:6px">
      <div>
        <label>Send API</label>
        <select id="mode">
          <option value="raw">SendRawEmail (v1 · SMTP-style)</option>
          <option value="v2">SendEmail (v2)</option>
        </select>
      </div>
      <div>
        <label>Region override</label>
        <input id="region" placeholder="(env default)" autocomplete="off" />
      </div>
    </div>

    <div style="margin-top:16px">
      <button class="primary" id="send">Send test email</button>
    </div>
  </div>

  <!-- Right column -->
  <div>
    <div class="card" style="margin-bottom:20px">
      <h2>Account · deliverability</h2>
      <div id="account"><span class="muted">Loading…</span></div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <h2>Bounce / suppression list <span id="supp-count" class="muted"></span></h2>
      <div class="kv" style="margin-bottom:10px">
        <input id="supp-add-email" placeholder="address to suppress" autocomplete="off" />
        <select id="supp-add-reason" style="flex:0 0 120px">
          <option value="BOUNCE">BOUNCE</option>
          <option value="COMPLAINT">COMPLAINT</option>
        </select>
        <button class="mini" id="supp-add-btn">+ add</button>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <input id="supp-filter" placeholder="filter…" style="flex:1" autocomplete="off" />
        <button class="mini" id="supp-refresh">↻</button>
      </div>
      <div id="supp-list" style="max-height:340px;overflow:auto"><span class="muted">Loading…</span></div>
    </div>
    <div class="card">
      <h2>Send results</h2>
      <div id="results"><span class="muted">No sends yet this session.</span></div>
    </div>
  </div>
</div>

<script>
const $ = (id) => document.getElementById(id);
let CFG = {};
const trackId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now()+"-"+Math.random().toString(16).slice(2));
let TRACK = trackId();

async function getJSON(u, opts) {
  const r = await fetch(u, opts);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || r.statusText);
  return d;
}

function addKV(box, name = "", value = "") {
  const div = document.createElement("div");
  div.className = "kv";
  div.innerHTML =
    '<input placeholder="name" value="' + name.replace(/"/g,'&quot;') + '">' +
    '<input placeholder="value" value="' + value.replace(/"/g,'&quot;') + '">' +
    '<button class="mini">✕</button>';
  div.querySelector("button").onclick = () => div.remove();
  $(box).appendChild(div);
}
function readKV(box) {
  return [...$(box).querySelectorAll(".kv")].map((d) => {
    const i = d.querySelectorAll("input");
    return { name: i[0].value.trim(), value: i[1].value.trim() };
  }).filter((x) => x.name && x.value);
}

function applyTrack() {
  ["html","text"].forEach((id) => {
    $(id).value = $(id).value.replace(/__TRACK__/g, TRACK);
  });
}

async function loadConfig() {
  CFG = await getJSON("/api/config");
  $("p-region").textContent = "region " + CFG.region;
  if (CFG.configSet) $("configSet").placeholder = "default: " + CFG.configSet;
  const box = $("precanned");
  (CFG.precanned || []).forEach((addr) => {
    const c = document.createElement("span");
    c.className = "chip"; c.textContent = "+ " + addr;
    c.onclick = () => {
      const cur = $("to").value.trim();
      $("to").value = cur ? cur + ", " + addr : addr;
    };
    box.appendChild(c);
  });
}

async function loadAccount() {
  try {
    const a = await getJSON("/api/account");
    $("p-mode").textContent = a.sandbox ? "SANDBOX" : "production";
    $("p-mode").className = "pill " + (a.sandbox ? "warn" : "ok");
    $("p-sending").textContent = a.sendingEnabled ? "sending on" : "sending OFF";
    $("p-sending").className = "pill " + (a.sendingEnabled ? "ok" : "err");
    const pct = a.max24HourSend ? Math.min(100, (a.sentLast24Hours / a.max24HourSend) * 100) : 0;
    $("p-quota").textContent = "24h " + a.sentLast24Hours + "/" + a.max24HourSend;
    $("account").innerHTML =
      stat("Mode", a.sandbox ? "Sandbox (verified recipients only)" : "Production") +
      stat("Sending", a.sendingEnabled ? "Enabled" : "Disabled") +
      stat("Enforcement", a.enforcementStatus || "—") +
      stat("Max send rate", a.maxSendRate + " /sec") +
      stat("Sent (24h)", a.sentLast24Hours + " / " + a.max24HourSend) +
      '<div class="gauge"><i style="width:' + pct + '%"></i></div>' +
      (a.sandbox ? '<p class="muted" style="margin:10px 0 0">⚠ In sandbox you can only send to verified addresses. Request production access in SES to hit arbitrary inboxes.</p>' : "");
  } catch (e) {
    const denied = /not authorized|AccessDenied|GetAccount/i.test(e.message);
    $("account").innerHTML = denied
      ? '<p class="muted">This key has no <code>ses:GetAccount</code> permission, so quota/sandbox metrics are unavailable. This is expected for a scoped send-only key — <b>sending still works</b> and is the real test.</p>'
      : '<span style="color:var(--err)">'+e.message+'</span>';
    $("p-mode").textContent = denied ? "send-only key" : "error";
    $("p-mode").className = "pill " + (denied ? "warn" : "err");
    $("p-sending").textContent = ""; $("p-quota").textContent = "";
  }
}
function stat(k, v) { return '<div class="stat"><span class="muted">'+k+'</span><span class="v">'+v+'</span></div>'; }

let IDENTITIES = [];

async function loadIdentities() {
  const sel = $("identity");
  try {
    const { identities } = await getJSON("/api/identities");
    IDENTITIES = identities.filter((i) => i.verificationStatus === "SUCCESS");
    IDENTITIES.sort((a,b)=> a.name.localeCompare(b.name));
    sel.innerHTML = '<option value="">— select a verified identity —</option>';
    for (const i of IDENTITIES) {
      const o = document.createElement("option");
      o.value = i.name;
      o.dataset.type = i.type;
      o.textContent = i.name + (i.type === "DOMAIN" ? "  (domain)" : "  (address)");
      sel.appendChild(o);
    }
  } catch (e) {
    // Key lacks ses:ListEmailIdentities — keep From editable as free text.
    sel.innerHTML = '<option value="">identity listing not permitted on this key — type From manually</option>';
  }
  // Preselect from DEFAULT_FROM: match the exact address, else its domain identity.
  if (CFG.defaultFrom) {
    $("from").value = CFG.defaultFrom;
    const dom = CFG.defaultFrom.split("@")[1];
    const match = IDENTITIES.find((i) => i.name === CFG.defaultFrom)
      || IDENTITIES.find((i) => i.name === dom);
    if (match) sel.value = match.name;
  }
  loadIdentityHealth();
}

function onIdentityChange() {
  const sel = $("identity");
  const opt = sel.selectedOptions[0];
  const name = sel.value;
  if (name) {
    if (opt && opt.dataset.type === "DOMAIN") {
      // Domain identity: keep the user's local part if any, else default to no-reply.
      const cur = $("from").value.trim();
      const local = cur.includes("@") ? cur.split("@")[0] : "no-reply";
      $("from").value = (local || "no-reply") + "@" + name;
    } else {
      $("from").value = name; // email-address identity is the full From
    }
  }
  loadIdentityHealth();
}

// Health is looked up by IDENTITY (domain or address), not the full From address.
async function loadIdentityHealth() {
  const name = $("identity").value;
  const box = $("identity-health");
  if (!name) { box.innerHTML = ""; return; }
  box.innerHTML = '<span class="muted">checking identity health…</span>';
  try {
    const h = await getJSON("/api/identity?name=" + encodeURIComponent(name));
    const dot = (s) => '<span class="dot '+s+'"></span>';
    const dkimOk = h.dkim.status === "SUCCESS" && h.dkim.signingEnabled;
    const mfOk = !h.mailFrom.domain || h.mailFrom.status === "SUCCESS";
    box.innerHTML =
      dot(h.verifiedForSending?"ok":"err") + '<b>Verified for sending:</b> ' + (h.verifiedForSending?"yes":"no") + '<br>' +
      dot(dkimOk?"ok":"warn") + '<b>DKIM:</b> ' + (h.dkim.status||"—") + (h.dkim.signingEnabled?" · signing on":" · signing off") + '<br>' +
      dot(mfOk?"ok":"warn") + '<b>Custom MAIL FROM:</b> ' + (h.mailFrom.domain ? h.mailFrom.domain+" ("+h.mailFrom.status+")" : "not configured (uses amazonses.com)");
  } catch (e) {
    const denied = /not authorized|AccessDenied|GetEmailIdentity/i.test(e.message);
    box.innerHTML = '<span class="muted">' + (denied
      ? "DKIM/MAIL-FROM health needs ses:GetEmailIdentity (not on this key)"
      : "health unavailable: " + e.message) + '</span>';
  }
}

async function checkSuppression() {
  const first = ($("to").value.split(/[,\\n;]+/)[0]||"").trim();
  const out = $("supp-result");
  if (!first) { out.textContent = "Enter a To address first."; return; }
  out.textContent = "checking " + first + "…";
  try {
    const s = await getJSON("/api/suppression?email=" + encodeURIComponent(first));
    out.innerHTML = s.suppressed
      ? '<span style="color:var(--err)">⛔ '+first+' is SUPPRESSED ('+s.reason+'). SES will silently drop it.</span>'
      : '<span style="color:var(--ok)">✓ '+first+' is not on the suppression list.</span>';
  } catch (e) { out.innerHTML = '<span style="color:var(--err)">'+e.message+'</span>'; }
}

let SUPPRESSIONS = [];
function fmtDate(t) {
  if (!t) return "—";
  const d = new Date(typeof t === "number" ? t * 1000 : t);
  return isNaN(d) ? String(t) : d.toISOString().slice(0, 10);
}
async function loadSuppressions() {
  const box = $("supp-list");
  box.innerHTML = '<span class="muted">Loading…</span>';
  try {
    const { suppressions } = await getJSON("/api/suppressions");
    SUPPRESSIONS = suppressions || [];
    renderSuppressions();
  } catch (e) {
    const denied = /not authorized|AccessDenied|ListSuppressed/i.test(e.message);
    box.innerHTML = '<span class="muted">' + (denied
      ? "needs ses:ListSuppressedDestinations on this key"
      : e.message) + '</span>';
    $("supp-count").textContent = "";
  }
}
function renderSuppressions() {
  const box = $("supp-list");
  const f = $("supp-filter").value.trim().toLowerCase();
  const rows = SUPPRESSIONS
    .filter((s) => !f || s.email.toLowerCase().includes(f))
    .sort((a, b) => a.email.localeCompare(b.email));
  $("supp-count").textContent = "· " + SUPPRESSIONS.length + " total";
  if (!rows.length) { box.innerHTML = '<span class="muted">No matching entries.</span>'; return; }
  box.innerHTML = "";
  for (const s of rows) {
    const row = document.createElement("div");
    row.className = "supp-row";
    const reasonCls = s.reason === "COMPLAINT" ? "err" : "warn";
    row.innerHTML =
      '<div class="supp-meta"><span class="supp-email">' + s.email + '</span>' +
      '<span class="muted">' + fmtDate(s.lastUpdate) + ' · <span style="color:var(--' + reasonCls + ')">' + s.reason + '</span></span></div>';
    const btn = document.createElement("button");
    btn.className = "mini"; btn.textContent = "remove";
    let armed = false;
    btn.onclick = async () => {
      if (!armed) { armed = true; btn.textContent = "confirm?"; btn.style.borderColor = "var(--err)";
        setTimeout(() => { armed = false; btn.textContent = "remove"; btn.style.borderColor = ""; }, 3000); return; }
      btn.disabled = true; btn.textContent = "…";
      try {
        await getJSON("/api/suppression?email=" + encodeURIComponent(s.email), { method: "DELETE" });
        SUPPRESSIONS = SUPPRESSIONS.filter((x) => x.email !== s.email);
        renderSuppressions();
      } catch (e) { btn.disabled = false; btn.textContent = "err"; alertRow(row, e.message); }
    };
    row.appendChild(btn);
    box.appendChild(row);
  }
}
function alertRow(row, msg) {
  const e = document.createElement("div");
  e.className = "muted"; e.style.color = "var(--err)"; e.style.flexBasis = "100%";
  e.textContent = msg; row.appendChild(e);
}
async function addSuppression() {
  const email = $("supp-add-email").value.trim();
  const reason = $("supp-add-reason").value;
  if (!email) return;
  const btn = $("supp-add-btn");
  btn.disabled = true; btn.textContent = "…";
  try {
    await getJSON("/api/suppression", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, reason }) });
    $("supp-add-email").value = "";
    await loadSuppressions();
  } catch (e) {
    $("supp-add-email").value = "";
    $("supp-add-email").placeholder = e.message;
  } finally { btn.disabled = false; btn.textContent = "+ add"; }
}

async function send() {
  const btn = $("send");
  btn.disabled = true; btn.textContent = "Sending…";
  const payload = {
    from: $("from").value,
    to: $("to").value, cc: $("cc").value, bcc: $("bcc").value, replyTo: $("replyTo").value,
    subject: $("subject").value, html: $("html").value, text: $("text").value,
    headers: readKV("headers"), tags: readKV("tags"), configSet: $("configSet").value.trim(),
    mode: $("mode").value, region: $("region").value.trim() || undefined,
  };
  try {
    const r = await getJSON("/api/send", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
    });
    addResult(true, r);
  } catch (e) {
    addResult(false, { error: e.message });
  } finally {
    btn.disabled = false; btn.textContent = "Send test email";
    TRACK = trackId();
  }
}

function addResult(ok, r) {
  const box = $("results");
  if (box.querySelector(".muted")) box.innerHTML = "";
  const d = document.createElement("div");
  d.className = "result " + (ok ? "ok" : "err");
  const t = new Date().toLocaleTimeString();
  if (ok) {
    d.innerHTML =
      '<div class="muted">'+t+' · '+(r.api||'')+' · '+r.latencyMs+'ms · to '+r.sent.to.join(", ")+'</div>' +
      '<div class="mid">MessageId: '+r.messageId+'</div>' +
      '<div class="muted">RequestId: '+(r.requestId||"—")+(r.sent.configSet?' · cfgset '+r.sent.configSet:'')+'</div>';
  } else {
    d.innerHTML = '<div class="muted">'+t+'</div><div class="em">✕ '+r.error+'</div>';
  }
  box.prepend(d);
}

// init
$("identity").onchange = onIdentityChange;
$("check-supp").onclick = checkSuppression;
$("send").onclick = send;
$("supp-refresh").onclick = loadSuppressions;
$("supp-filter").oninput = renderSuppressions;
$("supp-add-btn").onclick = addSuppression;
addKV("headers", "X-Mailsend-Tracking-Id", TRACK);
addKV("tags", "campaign", "mailsend-test");
applyTrack();
(async () => {
  await loadConfig();
  loadAccount();
  loadIdentities();
  loadSuppressions();
})();
</script>
</body>
</html>`;
