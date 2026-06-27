# mailsend

A self-hosted **Amazon SES deliverability test tool** that runs as a single
Cloudflare Worker. List your verified SES identities, send test emails to real
inboxes, and surface the SES-native deliverability signals that actually
matter — including the account suppression list, the #1 cause of "sent but
never arrived."

No data is stored; every SES call is SigV4-signed in the Worker via
[`aws4fetch`](https://github.com/mhart/aws4fetch).

## Features

- **Account dashboard** — sandbox vs. production detection, sending enabled,
  enforcement status, 24h send quota + rate.
- **Identity picker** — dropdown of your verified identities (domains and
  addresses); selecting one shows DKIM, custom MAIL FROM, and verified-for-sending
  health. Domain identities let you set any local part.
- **Real-inbox sends** — To/Cc/Bcc/Reply-To, HTML + plain-text bodies, optional
  precanned recipient chips, custom headers, and SES message tags.
- **Two send paths** — `SendEmail` (v2) and `SendRawEmail` (v1, SMTP-style), so
  you can test a key regardless of which action its policy grants.
- **Bounce / suppression management** — view the full account suppression list,
  add or remove entries, and spot-check any recipient before sending.
- **Per-send receipt** — MessageId, RequestId, and round-trip latency.

## Setup

```bash
npm install
```

### Secrets (never committed)

```bash
wrangler secret put AWS_ACCESS_KEY_ID
wrangler secret put AWS_SECRET_ACCESS_KEY
```

The IAM principal needs the SES actions listed in [`iam-policy.json`](./iam-policy.json):
read (`GetAccount`, `ListEmailIdentities`, `GetEmailIdentity`,
`Get`/`ListSuppressedDestinations`), send (`SendEmail`, `SendRawEmail`), and
suppression management (`Put`/`DeleteSuppressedDestination`). Grant only the
subset you need — the UI degrades gracefully when an action isn't permitted.

### Config (`wrangler.toml` `[vars]`)

| var | meaning |
|---|---|
| `SES_REGION` | SES region (e.g. `us-east-1`) |
| `CONFIG_SET` | optional Configuration Set applied to every send |
| `PRECANNED_RECIPIENTS` | comma-separated addresses shown as one-click chips |
| `DEFAULT_FROM` | optional pre-selected From address |

## Local dev

```bash
cp .dev.vars.example .dev.vars   # fill in real credentials
npm run dev
```

## Deploy

```bash
npm run deploy
```

For a custom domain, add the zone to your Cloudflare account, set the
`[[routes]]` block in `wrangler.toml`, and redeploy.

## Access control

The Worker has no built-in auth. Put it behind your own gateway — e.g.
[Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/)
(Zero Trust → Access → Applications) — so only authorized users can send.

## License

See [LICENSE](./LICENSE).
