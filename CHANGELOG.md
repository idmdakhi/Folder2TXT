# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-17

### Added

- Initial release of repo2txt
- Repository scanning with async iteration
- Tree building and rendering (text and Markdown)
- Export to TXT and Markdown formats
- Glob pattern matching (`*`, `**`, `?`)
- Ignore engine with include/exclude rules
- Comment remover (block and line comments)
- Whitespace formatter (trim, collapse, remove blank lines)
- Filesystem abstraction (Node.js, Browser, Memory)
- CLI with support for multiple options
- Web UI for local folder processing in browser
- Server-side processing with Express
- Winston logger with daily rotation
- Docker support with docker-compose

### Fixed

- Cross-platform path handling (Windows/Linux/macOS)
- Proper ESM module resolution

## [0.1.0] - 2026-06-01

### Added

- Initial prototype
- Basic repository scanning
- Simple tree output
