# Security

## Threat model

mailsend is an operator tool that talks to Amazon SES with credentials you
supply. It has no authentication of its own. Anyone who can reach a deployed
instance can:

- send email from your verified SES identities, and
- if the key allows it, read and modify your account suppression list.

Deploying it is equivalent to handing out send access. Two controls keep that
safe, and both are the operator's responsibility:

1. Put an authenticating gateway in front of it (for example Cloudflare Access).
   Do not expose it on the open internet.
2. Scope the SES IAM key to least privilege. Grant only the actions you want the
   tool to perform; it disables features whose permissions are absent. SES adds
   its own limits on top: unverified identities cannot send, and a sandboxed
   account can only send to verified recipients.

The Worker stores nothing. Credentials live as Worker secrets and are never
written to logs or returned to the browser.

## Reporting a vulnerability

Please report security issues privately through GitHub's "Report a vulnerability"
feature on this repository (the Security tab), not as a public issue.
