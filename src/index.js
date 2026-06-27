import { AwsClient } from "aws4fetch";
import { PAGE } from "./page.js";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const sesRegion = (env, override) => override || env.SES_REGION || "us-east-1";

function sesClient(env, region) {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      "SES credentials missing. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY as Worker secrets."
    );
  }
  return new AwsClient({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: sesRegion(env, region),
    service: "ses",
  });
}

const sesBase = (env, region) =>
  `https://email.${sesRegion(env, region)}.amazonaws.com`;

// Call SES v2 and normalize errors into a thrown Error with the SES message.
async function ses(env, path, init, region) {
  const aws = sesClient(env, region);
  const res = await aws.fetch(`${sesBase(env, region)}${path}`, init);
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  if (!res.ok) {
    const msg = body?.message || body?.Message || body?.raw || res.statusText;
    const err = new Error(msg);
    err.status = res.status;
    err.sesType = body?.__type || body?.type || null;
    err.requestId = res.headers.get("x-amzn-requestid");
    throw err;
  }
  return { body, requestId: res.headers.get("x-amzn-requestid") };
}

// SES v1 query API — used for SendRawEmail (ses:SendRawEmail), the action that
// SMTP relays use. Form-encoded request, XML response.
async function sesV1(env, paramPairs, region) {
  const aws = sesClient(env, region);
  const body = paramPairs
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  const res = await aws.fetch(`${sesBase(env, region)}/`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  const requestId = res.headers.get("x-amzn-requestid");
  if (!res.ok) {
    const m = text.match(/<Message>([\s\S]*?)<\/Message>/);
    const err = new Error(m ? m[1] : text || res.statusText);
    err.status = res.status;
    err.requestId = requestId;
    throw err;
  }
  return { text, requestId };
}

const b64 = (s) => btoa(unescape(encodeURIComponent(s)));

function buildMime(p, to, cc, headers) {
  const h = [
    `From: ${p.from}`,
    `To: ${to.join(", ")}`,
  ];
  if (cc.length) h.push(`Cc: ${cc.join(", ")}`);
  const replyTo = splitAddrs(p.replyTo);
  if (replyTo.length) h.push(`Reply-To: ${replyTo.join(", ")}`);
  h.push(`Subject: ${p.subject || "(no subject)"}`);
  h.push("MIME-Version: 1.0");
  for (const hd of headers) h.push(`${hd.name}: ${hd.value}`);

  const hasHtml = !!p.html, hasText = !!p.text;
  if (hasHtml && hasText) {
    const b = "==mailsend-" + to.length + "-bnd==";
    h.push(`Content-Type: multipart/alternative; boundary="${b}"`);
    return (
      h.join("\r\n") + "\r\n\r\n" +
      `--${b}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${p.text}\r\n` +
      `--${b}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${p.html}\r\n` +
      `--${b}--\r\n`
    );
  }
  h.push(`Content-Type: text/${hasHtml ? "html" : "plain"}; charset=UTF-8`);
  return h.join("\r\n") + "\r\n\r\n" + (hasHtml ? p.html : p.text) + "\r\n";
}

async function handleConfig(env) {
  return json({
    region: env.SES_REGION || "us-east-1",
    configSet: env.CONFIG_SET || "",
    defaultFrom: env.DEFAULT_FROM || "",
    precanned: (env.PRECANNED_RECIPIENTS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });
}

async function handleAccount(env) {
  const { body } = await ses(env, "/v2/email/account", { method: "GET" });
  const q = body.SendQuota || {};
  return json({
    productionAccess: !!body.ProductionAccessEnabled,
    sandbox: !body.ProductionAccessEnabled,
    sendingEnabled: !!body.SendingEnabled,
    enforcementStatus: body.EnforcementStatus || null,
    max24HourSend: q.Max24HourSend ?? null,
    maxSendRate: q.MaxSendRate ?? null,
    sentLast24Hours: q.SentLast24Hours ?? null,
    region: env.SES_REGION || "us-east-1",
  });
}

async function handleIdentities(env) {
  // Paginate ListEmailIdentities.
  const all = [];
  let token = null;
  do {
    const qs = new URLSearchParams({ PageSize: "100" });
    if (token) qs.set("NextToken", token);
    const { body } = await ses(env, `/v2/email/identities?${qs}`, {
      method: "GET",
    });
    for (const i of body.EmailIdentities || []) all.push(i);
    token = body.NextToken || null;
  } while (token);
  return json({
    identities: all.map((i) => ({
      name: i.IdentityName,
      type: i.IdentityType,
      verificationStatus: i.VerificationStatus,
      sendingEnabled: !!i.SendingEnabled,
    })),
  });
}

async function handleIdentity(env, name) {
  const { body } = await ses(
    env,
    `/v2/email/identities/${encodeURIComponent(name)}`,
    { method: "GET" }
  );
  const dkim = body.DkimAttributes || {};
  const mf = body.MailFromAttributes || {};
  return json({
    name,
    type: body.IdentityType,
    verifiedForSending: !!body.VerifiedForSendingStatus,
    feedbackForwarding: !!body.FeedbackForwardingStatus,
    dkim: {
      status: dkim.Status || null,
      signingEnabled: !!dkim.SigningEnabled,
      signingAttributesOrigin: dkim.SigningAttributesOrigin || null,
    },
    mailFrom: {
      domain: mf.MailFromDomain || null,
      status: mf.MailFromDomainStatus || null,
      behaviorOnError: mf.BehaviorOnMxFailure || null,
    },
  });
}

async function handleSuppression(env, email) {
  try {
    const { body } = await ses(
      env,
      `/v2/email/suppression/addresses/${encodeURIComponent(email)}`,
      { method: "GET" }
    );
    const d = body.SuppressedDestination || {};
    return json({
      email,
      suppressed: true,
      reason: d.Reason || null,
      lastUpdate: d.LastUpdateTime || null,
    });
  } catch (e) {
    if (e.status === 404) return json({ email, suppressed: false });
    throw e;
  }
}

async function handleSuppressionsList(env) {
  const all = [];
  let token = null;
  do {
    const qs = new URLSearchParams({ PageSize: "100" });
    if (token) qs.set("NextToken", token);
    const { body } = await ses(env, `/v2/email/suppression/addresses?${qs}`, {
      method: "GET",
    });
    for (const s of body.SuppressedDestinationSummaries || []) all.push(s);
    token = body.NextToken || null;
  } while (token);
  return json({
    suppressions: all.map((s) => ({
      email: s.EmailAddress,
      reason: s.Reason,
      lastUpdate: s.LastUpdateTime,
    })),
  });
}

async function handleSuppressionAdd(env, email, reason) {
  if (!email) throw new Error("email is required.");
  const r = (reason || "BOUNCE").toUpperCase();
  if (r !== "BOUNCE" && r !== "COMPLAINT")
    throw new Error("reason must be BOUNCE or COMPLAINT.");
  await ses(env, `/v2/email/suppression/addresses`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ EmailAddress: email, Reason: r }),
  });
  return json({ ok: true, email, reason: r });
}

async function handleSuppressionDelete(env, email) {
  if (!email) throw new Error("email is required.");
  await ses(env, `/v2/email/suppression/addresses/${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
  return json({ ok: true, email, removed: true });
}

const splitAddrs = (s) =>
  (s || "")
    .split(/[,\n;]+/)
    .map((x) => x.trim())
    .filter(Boolean);

async function handleSend(env, req) {
  const p = await req.json();

  const to = splitAddrs(p.to);
  const cc = splitAddrs(p.cc);
  const bcc = splitAddrs(p.bcc);
  if (!p.from) throw new Error("From address is required.");
  if (to.length === 0) throw new Error("At least one To recipient is required.");
  if (!p.html && !p.text) throw new Error("Provide an HTML or plain-text body.");

  const headers = (p.headers || []).filter((h) => h?.name && h?.value);
  const tags = (p.tags || []).filter((t) => t?.name && t?.value);
  const configSet = p.configSet || env.CONFIG_SET;

  // SendRawEmail (v1) — the action SMTP relays use: ses:SendRawEmail.
  if (p.mode === "raw") {
    const mime = buildMime(p, to, cc, headers);
    const params = [
      ["Action", "SendRawEmail"],
      ["Source", p.from],
      ["RawMessage.Data", b64(mime)],
    ];
    [...to, ...cc, ...bcc].forEach((d, i) =>
      params.push([`Destinations.member.${i + 1}`, d])
    );
    if (configSet) params.push(["ConfigurationSetName", configSet]);
    tags.forEach((t, i) => {
      params.push([`Tags.member.${i + 1}.Name`, t.name]);
      params.push([`Tags.member.${i + 1}.Value`, t.value]);
    });

    const start = Date.now();
    const { text, requestId } = await sesV1(env, params, p.region);
    const latencyMs = Date.now() - start;
    const mid = text.match(/<MessageId>([\s\S]*?)<\/MessageId>/);
    return json({
      ok: true,
      api: "SendRawEmail (v1)",
      messageId: mid ? mid[1] : null,
      requestId,
      latencyMs,
      sent: { from: p.from, to, cc, bcc, configSet: configSet || null, headers, tags },
    });
  }

  // SendEmail (v2) — default. Requires ses:SendEmail.
  const Body = {};
  if (p.html) Body.Html = { Data: p.html, Charset: "UTF-8" };
  if (p.text) Body.Text = { Data: p.text, Charset: "UTF-8" };

  const simple = {
    Subject: { Data: p.subject || "(no subject)", Charset: "UTF-8" },
    Body,
  };
  if (headers.length)
    simple.Headers = headers.map((h) => ({ Name: h.name, Value: h.value }));

  const payload = {
    FromEmailAddress: p.from,
    Destination: { ToAddresses: to, CcAddresses: cc, BccAddresses: bcc },
    Content: { Simple: simple },
  };

  const replyTo = splitAddrs(p.replyTo);
  if (replyTo.length) payload.ReplyToAddresses = replyTo;
  if (tags.length)
    payload.EmailTags = tags.map((t) => ({ Name: t.name, Value: t.value }));
  if (configSet) payload.ConfigurationSetName = configSet;

  const start = Date.now();
  const { body: res, requestId } = await ses(env, "/v2/email/outbound-emails", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }, p.region);
  const latencyMs = Date.now() - start;

  return json({
    ok: true,
    api: "SendEmail (v2)",
    messageId: res.MessageId,
    requestId,
    latencyMs,
    sent: {
      from: p.from,
      to,
      cc,
      bcc,
      configSet: configSet || null,
      headers,
      tags,
    },
  });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const { pathname } = url;

    try {
      if (pathname === "/" || pathname === "/index.html")
        return new Response(PAGE, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });

      if (pathname === "/api/config") return await handleConfig(env);
      if (pathname === "/api/account") return await handleAccount(env);
      if (pathname === "/api/identities") return await handleIdentities(env);
      if (pathname === "/api/identity") {
        const name = url.searchParams.get("name");
        if (!name) return json({ error: "name required" }, 400);
        return await handleIdentity(env, name);
      }
      if (pathname === "/api/suppressions")
        return await handleSuppressionsList(env);
      if (pathname === "/api/suppression") {
        if (req.method === "DELETE")
          return await handleSuppressionDelete(env, url.searchParams.get("email"));
        if (req.method === "PUT") {
          const b = await req.json().catch(() => ({}));
          return await handleSuppressionAdd(env, b.email, b.reason);
        }
        const email = url.searchParams.get("email");
        if (!email) return json({ error: "email required" }, 400);
        return await handleSuppression(env, email);
      }
      if (pathname === "/api/send" && req.method === "POST")
        return await handleSend(env, req);

      return json({ error: "not found" }, 404);
    } catch (e) {
      return json(
        { error: e.message, sesType: e.sesType || null, requestId: e.requestId || null },
        e.status && e.status >= 400 && e.status < 600 ? e.status : 500
      );
    }
  },
};
