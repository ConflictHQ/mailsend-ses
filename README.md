# mailsend

A self-hosted Amazon SES deliverability test tool that runs as a single
Cloudflare Worker. List your verified SES identities, send test emails to real
inboxes, and surface the SES-native deliverability signals that matter,
including the account suppression list, a common cause of mail that is accepted
but never delivered.

No data is stored; every SES call is SigV4-signed in the Worker via
[`aws4fetch`](https://github.com/mhart/aws4fetch).

## Features

- Account dashboard: sandbox vs. production detection, sending enabled,
  enforcement status, 24h send quota and rate.
- Identity picker: dropdown of your verified identities (domains and addresses);
  selecting one shows DKIM, custom MAIL FROM, and verified-for-sending health.
  Domain identities let you set any local part.
- Real-inbox sends: To/Cc/Bcc/Reply-To, HTML and plain-text bodies, optional
  precanned recipient chips, custom headers, and SES message tags.
- Two send paths: `SendEmail` (v2) and `SendRawEmail` (v1, SMTP-style), so you
  can test a key regardless of which action its policy grants.
- Bounce / suppression management: view the full account suppression list, add
  or remove entries, and spot-check any recipient before sending.
- Per-send receipt: MessageId, RequestId, and round-trip latency.

## How access is bounded

What the tool can do is limited by two things, and both are yours to set.

The IAM policy on the key. The tool uses the SES actions listed in
[`iam-policy.json`](./iam-policy.json), but you do not have to grant all of them.
Grant the subset you are comfortable with and the UI disables any feature whose
permission is missing rather than erroring. Start least-privilege and add actions
as you need them. (In our own use the key was scoped to troubleshoot a single
production account and nothing more.)

SES itself. You can only send from identities that are verified and configured
(DKIM, SPF, and so on). An account in the SES sandbox can only send to verified
addresses, which stops an unverified setup from mailing arbitrary recipients.
Requesting production access removes the recipient restriction; after that you
are bound by your sending quota, send rate, and bounce and complaint thresholds
rather than by a recipient allowlist.

## Setup

Prerequisites: a Cloudflare account, Node 18 or newer, and an AWS SES account
with at least one verified identity. Wrangler comes in as a dev dependency.

```bash
npm install
```

### Secrets (never committed)

```bash
wrangler secret put AWS_ACCESS_KEY_ID
wrangler secret put AWS_SECRET_ACCESS_KEY
```

### IAM policy

The actions the tool can use are in [`iam-policy.json`](./iam-policy.json): read
(`GetAccount`, `ListEmailIdentities`, `GetEmailIdentity`,
`Get`/`ListSuppressedDestinations`), send (`SendEmail`, `SendRawEmail`), and
suppression management (`Put`/`DeleteSuppressedDestination`). Grant only the
subset you want exercised. A read-only key still gives you the account and
identity views without any send or suppression-write ability.

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

## Security

The Worker has no built-in authentication. Anyone who can reach its URL can send
email from your verified identities and, depending on the key's permissions,
change your account suppression list. Treat deploy access as send access.

Put it behind an authenticating gateway before exposing it. We run
[Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/)
(Zero Trust, Access, Applications) in front of the Worker. Combine that with a
least-privilege SES key (see [How access is bounded](#how-access-is-bounded)) so
that even with access the blast radius stays limited to what you intend.

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## About

mailsend is built and maintained by
[CONFLICT](https://partners.amazonaws.com/partners/001E000000T6qNSIAZ/Conflict),
an AWS Partner. It is the work of Leo Mata, an AWS Certified Solutions Architect
and AWS Certified DevOps Engineer
([credentials](https://www.credly.com/users/spartan)). It runs on
[Cloudflare Workers](https://developers.cloudflare.com/workers/).

## License

MIT. See [LICENSE](./LICENSE).
