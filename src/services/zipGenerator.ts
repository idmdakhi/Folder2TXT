// src/services/zipGenerator.ts
import path from 'path';
import fs from 'fs';
import { FileEntry } from '../shared/core';
import archiver from 'archiver';

export interface ZipOptions {
  filename?: string;
  includeStructure?: boolean;
  structureFilename?: string;
}

export interface ZipResult {
  zipPath: string;
  fileSize: number;
  fileCount: number;
}

export async function generateZip(
  files: FileEntry[],
  outputDir: string,
  options: ZipOptions = {}
): Promise<ZipResult> {
  const filename = options.filename || `project-export-${Date.now()}.zip`;
  const zipPath = path.join(outputDir, filename);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    let fileCount = 0;
    
    output.on('close', () => {
      resolve({ zipPath, fileSize: archive.pointer(), fileCount });
    });
    
    archive.on('error', (err: Error) => reject(err));
    archive.pipe(output);
    
    if (options.includeStructure !== false) {
      const structureFilename = options.structureFilename || 'STRUCTURE.txt';
      const structure = generateStructureFile(files);
      archive.append(structure, { name: structureFilename });
      fileCount++;
    }
    
    for (const file of files) {
      if (file.error || file.isBinary) continue;
      archive.append(file.content || '', { name: file.path });
      fileCount++;
    }
    
    archive.finalize();
  });
}

export async function generateInteractiveHTML(
  files: FileEntry[],
  outputDir: string,
  filename: string = 'project-viewer.html'
): Promise<string> {
  const htmlPath = path.join(outputDir, filename);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const filesJson = JSON.stringify(files.map(f => ({ path: f.path, size: f.size, isBinary: f.isBinary, error: f.error, content: f.content })));
  
  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Project Viewer</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;background:#f5f5f5}.container{display:flex;height:100vh}.sidebar{width:300px;background:#2c3e50;color:#fff;overflow-y:auto;padding:20px}.file-tree{list-style:none}.file-tree li{margin:5px 0}.file-tree a{color:#ecf0f1;text-decoration:none;display:block;padding:5px 10px;border-radius:4px;cursor:pointer}.file-tree a:hover,.file-tree a.active{background:#34495e}.main-content{flex:1;padding:30px;overflow-y:auto}.file-header{background:#fff;padding:20px;border-radius:8px;margin-bottom:20px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}.file-content{background:#fff;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)}pre{background:#f8f9fa;padding:15px;border-radius:4px;overflow-x:auto;font-size:13px;line-height:1.6}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:15px;margin-bottom:20px}.stat-card{background:#fff;padding:15px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);text-align:center}.stat-value{font-size:24px;font-weight:bold;color:#3498db}.stat-label{font-size:12px;color:#7f8c8d;margin-top:5px}</style></head><body><div class="container"><div class="sidebar"><h2>📁 Project Files</h2><ul class="file-tree" id="fileTree"></ul></div><div class="main-content"><div class="stats" id="stats"></div><div id="fileView"></div></div></div><script>const files=' + filesJson + ';function renderStats(){const t=files.length,s=files.reduce((a,f)=>a+(f.size||0),0),e={};files.forEach(f=>{const x=f.path.split(".").pop()||"";e[x]=(e[x]||0)+1});document.getElementById("stats").innerHTML="<div class=\\"stat-card\\"><div class=\\"stat-value\\">"+t+"</div><div class=\\"stat-label\\">Files</div></div><div class=\\"stat-card\\"><div class=\\"stat-value\\">"+(s/1024).toFixed(2)+" KB</div><div class=\\"stat-label\\">Size</div></div><div class=\\"stat-card\\"><div class=\\"stat-value\\">"+Object.keys(e).length+"</div><div class=\\"stat-label\\">Types</div></div>"}function renderFileTree(){document.getElementById("fileTree").innerHTML=files.map((f,i)=>"<li><a onclick=\\"showFile("+i+")\\" data-index=\\""+i+"\\">"+f.path+"</a></li>").join("")}function showFile(i){const f=files[i],v=document.getElementById("fileView");document.querySelectorAll(".file-tree a").forEach(a=>a.classList.remove("active"));document.querySelector("[data-index=\\""+i+"\\"]")?.classList.add("active");if(f.error)v.innerHTML="<div class=\\"file-header\\"><h1>"+f.path+"</h1></div><div class=\\"file-content\\"><p style=\\"color:red\\">Error: "+f.error+"</p></div>";else if(f.isBinary)v.innerHTML="<div class=\\"file-header\\"><h1>"+f.path+"</h1></div><div class=\\"file-content\\"><p>Binary file</p></div>";else v.innerHTML="<div class=\\"file-header\\"><h1>"+f.path+"</h1><div>"+(f.size||0)+" bytes</div></div><div class=\\"file-content\\"><pre><code>"+escapeHtml(f.content||"")+"</code></pre></div>"}function escapeHtml(t){const d=document.createElement("div");d.textContent=t;return d.innerHTML}renderStats();renderFileTree();if(files.length>0)showFile(0);</script></body></html>';
  
  fs.writeFileSync(htmlPath, html, 'utf-8');
  return htmlPath;
}

function generateStructureFile(files: FileEntry[]): string {
  const lines = ['PROJECT STRUCTURE', '='.repeat(50), 'Generated: ' + new Date().toISOString(), 'Total Files: ' + files.length, ''];
  const paths = new Set<string>();
  for (const f of files) {
    const parts = f.path.split('/');
    let current = '';
    for (let i = 0; i < parts.length; i++) {
      if (i === parts.length - 1) paths.add(current + parts[i]);
      else { current += parts[i] + '/'; paths.add(current.slice(0, -1)); }
    }
  }
  const sorted = Array.from(paths).sort();
  lines.push('project/');
  for (const p of sorted) {
    const depth = p.split('/').length;
    lines.push('  '.repeat(depth) + (files.some(f => f.path.startsWith(p + '/')) ? p.split('/').pop() + '/' : p.split('/').pop()));
  }
  return lines.join('\n');
}
