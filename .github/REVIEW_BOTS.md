# Review bots

GitOne uses two free review layers.

## reviewdog / ESLint

`.github/workflows/reviewdog.yml` runs ESLint on changed lines and posts inline
comments on pull requests from branches inside this repository. It is non-blocking:
the required `test` check remains the merge gate.

Fork pull requests get a read-only GitHub token on `pull_request`, so the reviewdog
job skips them instead of using `pull_request_target` with a write token. That keeps
untrusted fork code away from a privileged token.

## CodeRabbit

`.coderabbit.yaml` configures CodeRabbit's free reviews for public repositories.
The GitHub App still needs a one-time install on this repository:

https://github.com/apps/coderabbitai/installations/new

After installation, CodeRabbit reviews PRs into `main` with the repository config.
