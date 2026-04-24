# Larv

An all-in-one, AI-powered web OS for businesses. Built with Laravel 12 and a React (Inertia) frontend.

## Server deployment for GIT PULL (`deploy.sh`)

The script `deploy.sh` lives in the project root next to `artisan`. It resolves the app directory from its own path, so you do not need to set `DEPLOY_DIR` or edit paths per server.

Run it as the same system user that owns the app and runs queue workers (for example `omini` after `su omini`).

### Basic usage

From the project directory (the folder that contains `artisan` and `deploy.sh`):

```bash
./deploy.sh
```

This runs: `git pull`, `php artisan optimize:clear`, and `php artisan queue:restart`.

Or invoke by full path from any current working directory (the script still finds the app root):

```bash
/path/to/clone/deploy.sh
```

If you see `Permission denied`, make the file executable once:

```bash
chmod +x deploy.sh
```

### Optional flags

| Flag | Effect |
|------|--------|
| `--composer` | `composer install --no-dev --optimize-autoloader` |
| `--dump-autoload` | `composer dump-autoload -o` (e.g. after adding a new module) |
| `--migrate` | `php artisan migrate --force` |

Combine flags as needed, for example:

```bash
./deploy.sh --composer --migrate
```

### Local development

The same script can be run in a local clone. Be careful with `--migrate` on a database you care about, since it applies pending migrations with `--force`.
