use std::collections::{BTreeSet, HashMap, HashSet};
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

const DEFAULT_SKIP_FILES: &[&str] = &[
    // فایل‌های قفل و پیکربندی
    "package-lock.json",
    "LICENSE",
    "yarn.lock",
    ".prettierrc",
    ".eslintrc",
    ".eslintrc.js",
    ".eslintrc.json",
    ".babelrc",
    ".babelrc.js",
    ".babelrc.json",
    "tsconfig.json",
    "webpack.config.js",
    "jest.config.js",
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.test",
    "composer.lock",
    // لاگ‌ها
    "npm-debug.log",
    "yarn-error.log",
    "*.log",
    "*.pid",
    "*.seed",
    "*.pid.lock",
];

const DEFAULT_SKIP_FOLDERS: &[&str] = &[
    "node_modules",
    "vendor",
    ".git",
    ".idea",
    ".vscode",
    ".vs",
    "dist",
    "build",
    "coverage",
    "logs",
    // Symfony
    "var/cache",
    "var/log",
    "var/sessions",
    "var/tmp",
    "public/bundles",
    // Laravel
    "storage/app",
    "storage/framework/cache",
    "storage/framework/sessions",
    "storage/framework/testing",
    "storage/framework/views",
    "storage/logs",
    "bootstrap/cache",
    "public/storage",
    // JS frameworks
    ".next",
    ".nuxt",
    "out",
    ".svelte-kit",
    ".angular",
    // cache / build
    ".cache",
    ".parcel-cache",
    ".webpack",
    ".turbo",
    ".vite",
    "temp",
    "tmp",
    "cache",
    ".phpunit.cache",
    ".php-cs-fixer.cache",
    // tests
    ".nyc_output",
    "cypress/videos",
    "cypress/screenshots",
    ".cypress-cache",
    // public builds
    "public/build",
    "public/hot",
    "public/css",
    "public/js",
    "public/mix-manifest.json",
];

const DEFAULT_SKIP_EXTENSIONS: &[&str] = &[
    "jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp", "svg", "ico", "psd", "ai", "eps", "raw",
    "xcf", "exe", "dll", "so", "dylib", "bin", "obj", "db", "sqlite", "sqlite3", "mdb", "zip",
    "tar", "gz", "7z", "rar", "pdf", "doc", "docx", "xls", "xlsx", "ttf", "otf", "woff", "woff2",
    "mp3", "mp4", "avi", "mov", "wmv", "flv", "mkv",
];

const COMMON_TYPES: &[&str] = &[
    "txt", "js", "py", "json", "md", "html", "htm", "css", "yaml", "yml", "xml", "sql", "gradle",
    "kt",
];

fn default_separator() -> String {
    "--- {filename} ---".to_string()
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessOptions {
    pub folder_path: String,
    #[serde(default)]
    pub selected_types: Vec<String>,
    #[serde(default)]
    pub clean_mode: bool,
    #[serde(default = "default_separator")]
    pub separator: String,
    #[serde(default)]
    pub common_only: bool,
    #[serde(default)]
    pub max_depth: Option<usize>,
    #[serde(default)]
    pub ignore_patterns: Vec<String>,
    #[serde(default)]
    pub use_gitignore: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessResult {
    content: String,
    file_count: usize,
    total_size: u64,
}

#[derive(Debug, Clone)]
struct FileEntry {
    path: String,
    content: Option<String>,
    is_binary: bool,
    size: u64,
    error: Option<String>,
}

fn extension(name: &str) -> String {
    name.rsplit_once('.')
        .map(|(_, ext)| ext.to_lowercase())
        .unwrap_or_default()
}

/// پشتیبانی ساده از الگوهای * (مشابه پیاده‌سازی وب)
fn matches_wildcard(pattern: &str, text: &str) -> bool {
    if !pattern.contains('*') {
        return pattern == text;
    }

    let parts: Vec<&str> = pattern.split('*').collect();
    let first = parts[0];
    if !first.is_empty() {
        if !text.starts_with(first) {
            return false;
        }
    }

    let last = parts[parts.len() - 1];
    let ends_with_star = pattern.ends_with('*');
    let mut pos = first.len();
    let inner_end = if ends_with_star {
        text.len()
    } else {
        text.len().saturating_sub(last.len())
    };

    if pos > inner_end {
        return false;
    }

    for part in &parts[1..parts.len() - 1] {
        if part.is_empty() {
            continue;
        }
        match text[pos..inner_end].find(part) {
            Some(index) => pos += index + part.len(),
            None => return false,
        }
    }

    if ends_with_star {
        true
    } else {
        text[pos..].ends_with(last)
    }
}

fn should_skip_by_user_patterns(relative_path: &str, patterns: &[String]) -> bool {
    for pattern in patterns {
        let pattern = pattern.trim();
        if pattern.is_empty() {
            continue;
        }
        if pattern.contains('*') {
            if matches_wildcard(pattern, relative_path) {
                return true;
            }
        } else if relative_path == pattern || relative_path.starts_with(&format!("{pattern}/")) {
            return true;
        }
    }
    false
}

fn should_skip_default_folder(relative_path: &str) -> bool {
    DEFAULT_SKIP_FOLDERS.iter().any(|folder| {
        relative_path == *folder || relative_path.starts_with(&format!("{folder}/"))
    })
}

fn should_skip_default_file(file_name: &str) -> bool {
    if DEFAULT_SKIP_FILES
        .iter()
        .any(|pattern| matches_wildcard(pattern, file_name))
    {
        return true;
    }
    DEFAULT_SKIP_EXTENSIONS.contains(&extension(file_name).as_str())
}

fn is_binary_file(path: &Path) -> std::io::Result<bool> {
    let mut file = fs::File::open(path)?;
    let mut buffer = [0u8; 1024];
    let bytes_read = file.read(&mut buffer)?;
    Ok(buffer[..bytes_read].contains(&0))
}

fn read_text_file(path: &Path) -> std::io::Result<String> {
    let bytes = fs::read(path)?;
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}

fn env_max_file_size() -> u64 {
    std::env::var("MAX_FILE_SIZE")
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(1024 * 1024)
}

fn walk_dir(
    dir: &Path,
    base: &Path,
    ignore_patterns: &[String],
    current_depth: usize,
    max_depth: Option<usize>,
    max_file_size: u64,
    results: &mut Vec<FileEntry>,
) -> std::io::Result<()> {
    if let Some(max) = max_depth {
        if current_depth > max {
            return Ok(());
        }
    }

    let entries = fs::read_dir(dir)?;

    for entry in entries.flatten() {
        let full_path = entry.path();
        let relative_path = full_path
            .strip_prefix(base)
            .unwrap_or(&full_path)
            .to_string_lossy()
            .replace('\\', "/");

        if should_skip_by_user_patterns(&relative_path, ignore_patterns) {
            continue;
        }

        let file_type = match entry.file_type() {
            Ok(file_type) => file_type,
            Err(_) => continue,
        };

        // جلوگیری از حلقه در symlinkها
        if file_type.is_symlink() {
            continue;
        }

        if file_type.is_dir() {
            if should_skip_default_folder(&relative_path) {
                continue;
            }
            walk_dir(
                &full_path,
                base,
                ignore_patterns,
                current_depth + 1,
                max_depth,
                max_file_size,
                results,
            )?;
        } else if file_type.is_file() {
            let file_name = entry.file_name().to_string_lossy().to_string();
            let size = entry.metadata().map(|metadata| metadata.len()).unwrap_or(0);

            if should_skip_default_file(&file_name) {
                results.push(FileEntry {
                    path: relative_path,
                    content: None,
                    is_binary: true,
                    size,
                    error: None,
                });
                continue;
            }

            if size > max_file_size {
                results.push(FileEntry {
                    path: relative_path,
                    content: None,
                    is_binary: true,
                    size,
                    error: None,
                });
                continue;
            }

            match is_binary_file(&full_path) {
                Ok(true) => results.push(FileEntry {
                    path: relative_path,
                    content: None,
                    is_binary: true,
                    size,
                    error: None,
                }),
                Ok(false) => match read_text_file(&full_path) {
                    Ok(content) => results.push(FileEntry {
                        path: relative_path,
                        content: Some(content),
                        is_binary: false,
                        size,
                        error: None,
                    }),
                    Err(error) => results.push(FileEntry {
                        path: relative_path,
                        content: None,
                        is_binary: false,
                        size,
                        error: Some(error.to_string()),
                    }),
                },
                Err(error) => results.push(FileEntry {
                    path: relative_path,
                    content: None,
                    is_binary: false,
                    size,
                    error: Some(error.to_string()),
                }),
            }
        }
    }

    Ok(())
}

fn is_inside_string(line: &str, index: usize) -> bool {
    let mut in_single = false;
    let mut in_double = false;

    for (i, ch) in line.char_indices() {
        if i >= index {
            break;
        }
        if ch == '\'' && !in_double {
            in_single = !in_single;
        }
        if ch == '"' && !in_single {
            in_double = !in_double;
        }
    }

    in_single || in_double
}

fn strip_block_comments(line: &str, open: &str, close: &str) -> String {
    let mut result = String::new();
    let mut rest = line;

    while let Some(start) = rest.find(open) {
        result.push_str(&rest[..start]);
        let after_open = start + open.len();
        match rest[after_open..].find(close) {
            Some(end) => {
                rest = &rest[after_open + end + close.len()..];
            }
            None => {
                // کامنت بسته نشده؛ متن اصلی حفظ می‌شود
                result.push_str(&rest[start..]);
                rest = "";
                break;
            }
        }
    }

    result.push_str(rest);
    result
}

fn clean_content(content: &str, ext: &str) -> String {
    if ["txt", "md", "json", "csv"].contains(&ext) {
        return content.to_string();
    }

    let lines: Vec<String> = content
        .split('\n')
        .map(|line| {
            let trimmed = line.trim_end();
            match ext {
                "js" | "ts" | "jsx" | "tsx" | "java" | "c" | "cpp" | "cs" | "go" => {
                    if let Some(index) = trimmed.find("//") {
                        if !is_inside_string(trimmed, index) {
                            return trimmed[..index].trim_end().to_string();
                        }
                    }
                    trimmed.to_string()
                }
                "py" | "rb" | "sh" | "bash" => {
                    if let Some(index) = trimmed.find('#') {
                        if !is_inside_string(trimmed, index) {
                            return trimmed[..index].trim_end().to_string();
                        }
                    }
                    trimmed.to_string()
                }
                "html" | "xml" | "xhtml" => strip_block_comments(trimmed, "<!--", "-->"),
                "css" | "scss" | "less" => {
                    let stripped = strip_block_comments(trimmed, "/*", "*/");
                    match stripped.find("//") {
                        Some(index) => stripped[..index].trim_end().to_string(),
                        None => stripped,
                    }
                }
                "sql" => {
                    let stripped = strip_block_comments(trimmed, "/*", "*/");
                    match stripped.find("--") {
                        Some(index) => stripped[..index].trim_end().to_string(),
                        None => stripped,
                    }
                }
                _ => trimmed.to_string(),
            }
        })
        .collect();

    let mut cleaned: Vec<String> = Vec::with_capacity(lines.len());
    let mut last_was_empty = false;

    for line in lines {
        if line.trim().is_empty() {
            if !last_was_empty {
                cleaned.push(String::new());
            }
            last_was_empty = true;
        } else {
            cleaned.push(line);
            last_was_empty = false;
        }
    }

    cleaned.join("\n").trim().to_string()
}

fn detect_technologies(files: &[FileEntry]) -> Vec<&'static str> {
    let names: Vec<String> = files.iter().map(|f| f.path.to_lowercase()).collect();
    let any = |check: &dyn Fn(&str) -> bool| names.iter().any(|name| check(name));
    let mut technologies: Vec<&'static str> = Vec::new();

    let mut add = |condition: bool, name: &'static str| {
        if condition && !technologies.contains(&name) {
            technologies.push(name);
        }
    };

    add(any(&|n| n.ends_with("package.json")), "Node.js");
    add(any(&|n| n.ends_with("tsconfig.json")), "TypeScript");
    add(
        any(&|n| {
            n.ends_with("webpack.config.js") || n.ends_with("webpack.config.ts")
        }),
        "Webpack",
    );
    add(
        any(&|n| n.ends_with("vite.config.js") || n.ends_with("vite.config.ts")),
        "Vite",
    );
    add(any(&|n| n.ends_with(".jsx")), "React");
    add(any(&|n| n.ends_with(".vue")), "Vue");
    add(any(&|n| n.ends_with(".go")), "Go");
    add(any(&|n| n.ends_with(".py")), "Python");
    add(any(&|n| n.ends_with(".java")), "Java");
    add(any(&|n| n.ends_with("requirements.txt")), "Python (pip)");
    add(any(&|n| n.ends_with("pom.xml")), "Maven");
    add(
        any(&|n| n.contains("gradle.build") || n.contains("gradle.settings")),
        "Gradle",
    );
    add(any(&|n| n.ends_with(".csproj")), ".NET");
    add(any(&|n| n.ends_with("dockerfile")), "Docker");
    add(
        any(&|n| n.ends_with("docker-compose.yml") || n.ends_with("docker-compose.yaml")),
        "Docker Compose",
    );
    add(any(&|n| n.ends_with(".tf")), "Terraform");
    add(any(&|n| n.ends_with(".rs")), "Rust");
    add(any(&|n| n.ends_with(".rb")), "Ruby");
    add(any(&|n| n.ends_with("gemfile")), "Ruby (Bundler)");
    add(any(&|n| n.ends_with(".php")), "PHP");
    add(any(&|n| n.ends_with("composer.json")), "PHP (Composer)");

    technologies
}

fn generate_overview(files: &[FileEntry]) -> String {
    let total_files = files.len();
    let total_size: u64 = files.iter().map(|f| f.size).sum();
    let total_size_mb = total_size as f64 / (1024.0 * 1024.0);

    let mut type_count: HashMap<String, usize> = HashMap::new();
    let mut type_order: Vec<String> = Vec::new();

    for file in files {
        let ext = extension(&file.path);
        if !ext.is_empty() {
            if !type_count.contains_key(&ext) {
                type_order.push(ext.clone());
            }
            *type_count.entry(ext).or_insert(0) += 1;
        }
    }

    type_order.sort_by(|a, b| type_count[b].cmp(&type_count[a]));

    let mut overview = "=".repeat(50);
    overview.push('\n');
    overview.push_str("PROJECT OVERVIEW\n");
    overview.push_str(&"=".repeat(50));
    overview.push_str("\n\nProject Statistics:\n");
    overview.push_str(&format!("Total Files: {total_files}\n"));
    overview.push_str(&format!("Total Size: {total_size_mb:.2} MB\n\n"));
    overview.push_str("File Types:\n");

    for ext in &type_order {
        let count = type_count[ext];
        let plural = if count == 1 { "file" } else { "files" };
        overview.push_str(&format!("  .{ext}: {count} {plural}\n"));
    }

    let technologies = detect_technologies(files);
    if !technologies.is_empty() {
        overview.push_str("\nDetected Technologies:\n");
        for technology in technologies {
            overview.push_str(&format!("  - {technology}\n"));
        }
    }

    overview.push('\n');
    overview
}

fn generate_tree(files: &[FileEntry], root: &str) -> String {
    let mut path_set: BTreeSet<String> = BTreeSet::new();

    for file in files {
        let parts: Vec<&str> = file.path.split('/').collect();
        let mut current = String::new();

        for (index, part) in parts.iter().enumerate() {
            if index == parts.len() - 1 {
                path_set.insert(format!("{current}{part}"));
            } else {
                current.push_str(part);
                current.push('/');
                path_set.insert(current.clone());
            }
        }
    }

    let normalized_root = root.replace('\\', "/");
    let prefix = normalized_root
        .split('/')
        .filter(|part| !part.is_empty())
        .last()
        .unwrap_or(root);

    let mut lines = vec![format!("{prefix}/")];

    for path in path_set {
        let depth = path.split('/').count();
        let indent = "  ".repeat(depth);
        let name = if path.ends_with('/') {
            format!(
                "{}/",
                path.trim_end_matches('/')
                    .rsplit('/')
                    .next()
                    .unwrap_or_default()
            )
        } else {
            path.rsplit('/').next().unwrap_or_default().to_string()
        };
        lines.push(format!("{indent}{name}"));
    }

    lines.join("\n")
}

fn format_output(files: &[FileEntry], root: &str, separator: &str) -> String {
    let overview = generate_overview(files);
    let tree = generate_tree(files, root);
    let mut parts: Vec<String> = Vec::new();

    parts.push(overview);
    parts.push("=".repeat(50));
    parts.push("STRUCTURE".to_string());
    parts.push("=".repeat(50));
    parts.push(tree);
    parts.push(format!("\n{}", "=".repeat(50)));
    parts.push("FILES".to_string());
    parts.push(format!("{}\n", "=".repeat(50)));

    let mut sorted_files: Vec<&FileEntry> = files.iter().collect();
    sorted_files.sort_by(|a, b| a.path.cmp(&b.path));

    for file in sorted_files {
        let header = separator.replace("{filename}", &file.path);
        parts.push(header);

        if let Some(error) = &file.error {
            parts.push(format!("[ERROR: {error}]"));
        } else if file.is_binary {
            parts.push(format!(
                "[BINARY FILE - CONTENT SKIPPED] ({} bytes)",
                file.size
            ));
        } else if let Some(content) = &file.content {
            parts.push(content.clone());
        } else {
            parts.push("[EMPTY OR UNREADABLE]".to_string());
        }

        parts.push(String::new());
    }

    parts.join("\n")
}

fn parse_gitignore(content: &str) -> Vec<String> {
    let content = content.trim_start_matches('\u{feff}');
    content
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') || line.starts_with('!') {
                return None;
            }
            let cleaned = line.trim_start_matches('/').trim_end_matches('/');
            if cleaned.is_empty() {
                None
            } else {
                Some(cleaned.to_string())
            }
        })
        .collect()
}

pub fn run_process(options: ProcessOptions) -> Result<ProcessResult, String> {
    let folder_path = PathBuf::from(&options.folder_path);

    let metadata = fs::metadata(&folder_path)
        .map_err(|error| format!("مسیر قابل دسترسی نیست: {error}"))?;
    if !metadata.is_dir() {
        return Err("مسیر انتخاب‌شده یک پوشه نیست".to_string());
    }

    let mut ignore_patterns = options.ignore_patterns.clone();

    if options.use_gitignore {
        if let Ok(content) = fs::read_to_string(folder_path.join(".gitignore")) {
            ignore_patterns.extend(parse_gitignore(&content));
        }
    }

    let mut files = Vec::new();
    walk_dir(
        &folder_path,
        &folder_path,
        &ignore_patterns,
        0,
        options.max_depth,
        env_max_file_size(),
        &mut files,
    )
    .map_err(|error| format!("خطا در خواندن پوشه: {error}"))?;

    let selected_types: HashSet<String> = options
        .selected_types
        .iter()
        .map(|value| value.trim().trim_start_matches('.').to_lowercase())
        .filter(|value| !value.is_empty())
        .collect();

    if !selected_types.is_empty() {
        files.retain(|file| selected_types.contains(&extension(&file.path)));
    }

    if options.common_only {
        files.retain(|file| COMMON_TYPES.contains(&extension(&file.path).as_str()));
    }

    if options.clean_mode {
        for file in &mut files {
            if let Some(content) = &file.content {
                file.content = Some(clean_content(content, &extension(&file.path)));
            }
        }
    }

    let content = format_output(&files, &options.folder_path, &options.separator);
    let total_size = files.iter().map(|file| file.size).sum();

    Ok(ProcessResult {
        content,
        file_count: files.len(),
        total_size,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wildcard_matching_works() {
        assert!(matches_wildcard("*.log", "app.log"));
        assert!(matches_wildcard("*.log", "logs/app.log"));
        assert!(!matches_wildcard("*.log", "app.txt"));
        assert!(matches_wildcard("*.pid.lock", "server.pid.lock"));
        assert!(matches_wildcard("a*b*c", "axxbyyc"));
    }

    #[test]
    fn tree_and_output_are_generated() {
        let files = vec![FileEntry {
            path: "src/main.js".to_string(),
            content: Some("const a = 1;".to_string()),
            is_binary: false,
            size: 12,
            error: None,
        }];

        let output = format_output(&files, "C:\\projects\\demo", "--- {filename} ---");
        assert!(output.contains("PROJECT OVERVIEW"));
        assert!(output.contains("demo/"));
        assert!(output.contains("--- src/main.js ---"));
    }

    #[test]
    fn processes_a_real_folder() {
        use std::time::{SystemTime, UNIX_EPOCH};

        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let dir = std::env::temp_dir().join(format!("folder2txt-test-{unique}"));

        fs::create_dir_all(dir.join("src")).unwrap();
        fs::write(dir.join("src").join("main.js"), "const a = 1; // hi").unwrap();
        fs::write(dir.join("README.md"), "# hello").unwrap();
        fs::write(dir.join("image.png"), [0u8, 1, 2]).unwrap();
        fs::create_dir_all(dir.join("node_modules")).unwrap();
        fs::write(dir.join("node_modules").join("x.js"), "ignored").unwrap();

        let result = run_process(ProcessOptions {
            folder_path: dir.to_string_lossy().to_string(),
            selected_types: vec![],
            clean_mode: true,
            separator: "--- {filename} ---".to_string(),
            common_only: false,
            max_depth: None,
            ignore_patterns: vec![],
            use_gitignore: false,
        })
        .unwrap();

        assert!(result.content.contains("src/main.js"));
        assert!(result.content.contains("README.md"));
        assert!(!result.content.contains("node_modules/x.js"));
        assert!(result.content.contains("BINARY FILE"));
        assert!(result.content.contains("const a = 1;"));
        assert!(!result.content.contains("// hi"));

        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn parses_gitignore_patterns() {
        let patterns = parse_gitignore("\u{feff}# comment\n\nsrc/generated\n!keep.txt\ndist/\n");
        assert_eq!(
            patterns,
            vec!["src/generated".to_string(), "dist".to_string()]
        );
    }

    #[test]
    fn cleans_javascript_comments() {
        let cleaned = clean_content(
            "const url = 'http://x';\nlet a = 1; // comment\n\n\nlet b = 2;",
            "js",
        );
        assert!(cleaned.contains("http://x"));
        assert!(!cleaned.contains("// comment"));
    }
}
