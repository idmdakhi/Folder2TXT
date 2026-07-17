# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Please **do not** create public issues for security vulnerabilities.

Instead, report them privately via email to:

- **security@repo2txt.dev** (or use GitHub Security Advisory)

Include the following information:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

## Security Principles

repo2txt follows these security principles:

1. **Least Privilege**: Only access files and directories that are explicitly requested
2. **No Code Execution**: repo2txt reads and processes files as text, never executes them
3. **Safe Path Handling**: All paths are normalized and validated to prevent path traversal
4. **Input Validation**: All user inputs (CLI arguments, form inputs) are validated
5. **Secure Defaults**: Hidden files are excluded by default, symlinks are not followed

## Known Security Considerations

### Path Traversal

repo2txt validates paths using `normalizePath` and restricts access to the repository root.
In server mode, `BASE_DIR` environment variable can restrict allowed paths.

### File Size Limits

Maximum file size is configurable via `MAX_FILE_SIZE` to prevent memory exhaustion.

### Binary Files

Binary files are detected and skipped by default to prevent processing of non-text content.

## Reporting Security Issues

If you discover a security vulnerability, please report it promptly. We take all security reports seriously and will:

1. Acknowledge receipt within 24 hours
2. Investigate and validate the issue
3. Release a patch as soon as possible
4. Credit the reporter (if desired)

## Security Contact

For security-related matters, contact:

- **Email**: security@repo2txt.dev
- **PGP Key**: [Link to PGP key]

---

**Last Updated**: 2026-07-17
