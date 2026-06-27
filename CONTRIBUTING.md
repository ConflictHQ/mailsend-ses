# Contributing

Thanks for your interest. mailsend is intentionally small and single-purpose.

- Open an issue before a large change so we can agree on scope.
- Keep it a single Cloudflare Worker: no build step, no framework, minimal
  dependencies, config via `wrangler.toml` vars and Worker secrets.
- Before opening a PR, run `npx wrangler deploy --dry-run` to confirm the Worker
  still bundles. CI runs the same check.
- Match the existing style: plain JavaScript, straight quotes, small functions.

By contributing you agree that your contributions are licensed under the MIT
License.
