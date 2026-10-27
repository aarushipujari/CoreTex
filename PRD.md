# Product Requirements Document (PRD)

# CoreTex: Production-Grade Word to LaTeX Compiler

**Document Version:** 2.0  
**Status:** Approved / Production  
**Target Audience:** Academic Writers, Researchers, Graduate Students, Conference Chairs  
**System Class:** Compiler Pipeline / SaaS Web Platform  

---

## 1. Executive Summary

### 1.1 Problem Statement
In scientific, technological, and mathematical research, authors frequently draft initial manuscripts in **Microsoft Word (`.docx`)** for collaborative ease, spellchecking, and real-time review. However, premier academic conferences and journals—including the **IEEE, ACM, and Springer LNCS**—mandate camera-ready submissions in **LaTeX (`.tex`)**.

Manually retyping a 20-page manuscript—reconstructing complex mathematical equations, formatting tables with explicit alignments, re-exporting image figures, and re-linking citations—consumes **3 to 5 hours per paper**. Existing command-line tools like raw Pandoc often fail on nested XML fragmentation, mangle column alignments, drop equation formatting, lack security sandboxing, and provide zero verification of whether the resulting document actually compiles.

### 1.2 Product Vision
**CoreTex** is a production-grade, compiler-style conversion pipeline and web application that transforms Microsoft Word documents into compilable, academic-grade LaTeX in **under 3 seconds**. CoreTex bridges the Word-to-LaTeX gap with structural fidelity, automated verification via `pdflatex`, robust security sandboxing, and direct integration with Overleaf.

---

## 2. Product Objectives & Success Metrics (KPIs)

| Objective | Target Metric | Metric Description |
|---|:---:|---|
| **Conversion Speed** | **< 3.0 seconds** | Average conversion time for a standard 20-page academic manuscript. |
| **Compilation Fidelity** | **> 98%** | Percentage of valid `.docx` files that produce compilable LaTeX without syntax errors. |
| **Equation Accuracy** | **100% batched** | Complete translation of Word OMML equations and ~140 Unicode math symbols. |
| **Deduplication Latency** | **< 100 ms** | Response time for re-uploaded identical documents via SHA-256 caching. |
| **Zero Server Crash Rate** | **0 OOM Incidents** | Complete immunity against memory exhaustion, zip bombs, and infinite macro loops. |

---

## 3. User Personas & User Journeys

### 3.1 Personas
1. **The Lead Researcher (Dr. Elena):** Drafts multi-author papers in Word with colleagues. Needs quick conversion to the strict **IEEEtran** format with formatted equations and figures before midnight submission deadlines.
2. **The Graduate Student (Alex):** Has a 40-page master's thesis chapter written in Word with 50+ formulas. Needs a clean conversion into **Springer LNCS** or standard **article** class with a generated `references.bib` file.
3. **The Conference Speaker (Marcus):** Needs to turn an executive paper into a 16:9 presentation slide deck using LaTeX **Beamer** without manual copy-pasting.

### 3.2 User Journey
1. **Upload:** User drops a `.docx` file onto the web interface.
2. **Select Template:** User picks their target academic publisher format (Default, IEEE, ACM, Springer, or Beamer).
3. **Convert:** User clicks **Convert to LaTeX**. An animated progress tracker displays live status (Upload $\to$ Parse $\to$ Validate $\to$ Package).
4. **Inspect & Download:** In under 3 seconds, the user sees syntax-highlighted LaTeX in an in-browser editor with compile verification status.
5. **Export:** User downloads a `.zip` archive containing the `.tex` and `/figures`, copies raw code, or opens the project in **Overleaf** with a single click.

---

## 4. System Architecture & The 7-Layer Compiler Pipeline

CoreTex rejects brittle string/regex replacements in favor of a **Compiler Architecture** utilizing a strict **Intermediate Representation (IR)**. Downstream renderers never inspect Word XML; upstream parsers never generate LaTeX strings.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React 18 + TS)                         │
│   UploadZone  ·  TemplateSelector  ·  CodeMirror 6 Editor  ·  ActionsBar   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ POST /convert (HTTP)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API LAYER (FastAPI Service)                        │
│   MIME Validation (PK\x03\x04) · Streaming 20MB Cap · SHA-256 Deduplication  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Enqueue Job
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             MESSAGE BROKER (Redis)                          │
│   Asynchronous Task Queue (RQ) · Result Manifests · Overleaf Temporary TTL  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Dequeue Job
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COMPILER PIPELINE (Background Worker)                 │
│  Layer 1: Surgical OOXML Parser (python-docx + lxml)                        │
│  Layer 2: Run Merger (Collapses Word RSID text fragmentation)               │
│  Layer 3: Typed Intermediate Representation (Pydantic v2 Schema)            │
│  Layer 4: Specialist Handlers:                                              │
│           ├── Equation Handler: Batched Pandoc + Pure-Python OMML fallback  │
│           ├── Image Handler: Pillow 40MP Bomb Guard + EXIF Preservation     │
│           └── Table Handler: Column alignments + \multicolumn Spans          │
│  Layer 5: LaTeX Renderer: Jinja2 Engine + Smart Dynamic Preamble Injection   │
│  Layer 6: Bibliography Handler: word/sources.xml → references.bib + \cite   │
│  Layer 7: Sandboxed Verification: pdflatex (-no-shell-escape, openin_any=p) │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Functional Requirements (FR)

### FR-1: Document Ingestion & Validation
* **FR-1.1 File Format:** System must accept only valid OpenXML Word files (`.docx`).
* **FR-1.2 Magic-Byte Verification:** Input must start with the PK Zip magic header (`b'PK\x03\x04'`); non-matching streams are rejected immediately with HTTP 400.
* **FR-1.3 Streaming Size Enforcement:** Uploads must be streamed in 1 MB chunks and hard-capped at 20 MB. Any stream exceeding 20 MB must terminate with HTTP 413 (Payload Too Large) without exhausting server memory.
* **FR-1.4 SHA-256 Deduplication:** If an authenticated user re-uploads an identical byte sequence with the same template, the system must immediately return the cached conversion result in <100 ms.

### FR-2: Document Parsing & Run Merging
* **FR-2.1 OOXML Tree Traversal:** Extract document blocks in sequential order (`<w:p>` paragraphs, `<w:tbl>` tables, `<w:drawing>` figures).
* **FR-2.2 Heading Hierarchy:** Map Word heading styles (`Heading 1` through `Heading 4`) to semantic heading levels with title extraction.
* **FR-2.3 List Handling:** Detect ordered and unordered lists, supporting nesting up to 3+ levels and localization across 6 languages (EN, FR, DE, ES, IT, PT).
* **FR-2.4 Run Merger:** Eliminate Word’s internal XML fragmentation (caused by spellcheck or revision IDs) by merging consecutive `RunNode` items sharing identical formatting flags (bold, italic, underline, monospace).

### FR-3: Mathematical Formula Processing
* **FR-3.1 OMML Translation:** Convert both inline (`m:oMath`) and display (`m:oMathPara`) Office Math equations into standard LaTeX math mode.
* **FR-3.2 Batched Conversion:** Bundle all equations into a single synthetic document separated by ASCII sentinel tokens (`CORETEXEQOPEN{idx}`), invoking Pandoc exactly **once** per document instead of per-equation subprocess loops.
* **FR-3.3 Fallback Parser (`omml_direct.py`):** If Pandoc is unavailable on the host system, a pure-Python XML parser must directly convert fractions, matrices, n-ary operators ($\sum, \int$), and sub/superscripts without crashing.
* **FR-3.4 Unicode Math Glyphs:** Automatically detect and escape ~140 Unicode math glyphs ($\alpha, \beta, \nabla, \mathbb{R}, \in, \sum$) into LaTeX math syntax without requiring manual user tagging.

### FR-4: Table Processing
* **FR-4.1 Publication Formatting:** Tables must render using professional LaTeX `booktabs` syntax (`\toprule`, `\midrule`, `\bottomrule`).
* **FR-4.2 Column Alignment:** Extract explicit cell and column horizontal alignments (`<w:jc>`) and emit correct `l`, `c`, or `r` column specifications.
* **FR-4.3 Merged Cells:** Compute horizontal spans from `<w:gridSpan>` and emit valid `\multicolumn{n}{align}{content}` commands.

### FR-5: Figure & Image Extraction
* **FR-5.1 Extraction:** Extract all embedded raster graphics from `word/media/`.
* **FR-5.2 Compression:** Compress images exceeding 2 MB using Pillow to keep output packages lightweight.
* **FR-5.3 Metadata Preservation:** Preserve ICC color profiles and EXIF orientation tags through re-encoding.
* **FR-5.4 LaTeX Referencing:** Emit `\begin{figure}[htbp]`, `\includegraphics[width=\linewidth]{figures/...}`, and automated figure captions.

### FR-6: Bibliography & Citation Management
* **FR-6.1 Managed Sources:** Parse Word’s internal `word/sources.xml` bibliography database, construct an external `references.bib` BibTeX file, and replace inline citations with `\cite{key}`.
* **FR-6.2 Unmanaged Citations:** If citations are plain text bracketed numbers (e.g., `[1]`), retain the text and emit an informational warning to the user.

### FR-7: Academic Publisher Templates
The system must provide 5 pre-configured Jinja2 templates:
1. **Default (`article`):** Standard single-column LaTeX article.
2. **IEEE Transactions (`ieee`):** Uses official `IEEEtran` two-column layout.
3. **ACM SIGCONF (`acm`):** Uses official `acmart` conference proceedings format.
4. **Springer LNCS (`springer`):** Uses official `llncs` single-column book style.
5. **Beamer Slides (`beamer`):** Converts top-level sections into presentation slide frames with automated `allowframebreaks`.

### FR-8: Compiler Verification & Sandboxing
* **FR-8.1 Automated Test Compile:** In environments with TeX Live installed, run `pdflatex` against the generated `.tex` file in an isolated temporary directory.
* **FR-8.2 Error Pinpointing:** If compilation fails, parse the LaTeX log using regex (`^l\.(\d+)`) to extract the exact error line number and message.
* **FR-8.3 Sandboxing Flags:** Execute `pdflatex` with `-no-shell-escape` (blocks command execution) and `openin_any=p` / `openout_any=p` (restricts file access to the temp directory).
* **FR-8.4 Timeout:** Terminate compilation runs exceeding 30 seconds.

### FR-9: Delivery & Packaging
* **FR-9.1 Single File Delivery (`.tex`):** When a document has no images, deliver raw `output.tex` directly to eliminate unzipping friction.
* **FR-9.2 Package Delivery (`.zip`):** When images or bibliography exist, bundle `output.tex`, `/figures/`, and `references.bib` into a structured `.zip` archive.
* **FR-9.3 Overleaf One-Click:** Provide a temporary 5-minute signed URL (`/temp/{id}`) enabling Overleaf's `snip_uri` API to ingest the project in one click.

### FR-10: User Interface & Web Experience
* **FR-10.1 Theme & Layout:** Responsive, modern dark-slate glassmorphic theme with clear 3-step numbered workflow.
* **FR-10.2 In-Browser LaTeX Editor:** CodeMirror 6 editor with syntax highlighting, line numbers, and automated error-line scrolling.
* **FR-10.3 Real-Time Stepper:** Shimmering animated progress bar displaying current conversion phase and elapsed millisecond counter during active jobs.
* **FR-10.4 Metrics Dashboard:** Real-time cards displaying template name, compiler status (`OK`/`FAIL`), bundled images, citations, and warnings.

---

## 6. Non-Functional Requirements (NFR)

### NFR-1: Performance & Scalability
* **Asynchronous Execution:** HTTP request thread terminates within 50 ms after pushing to Redis. Background conversion worker scales horizontally across multiple worker nodes (`numReplicas`).
* **Memory Footprint:** Ephemeral memory usage per job capped under 150 MB. Redis caches store raw byte arrays without heavy object graphs.

### NFR-2: Security Hardening
* **Decompression-Bomb Guard:** Pillow `MAX_IMAGE_PIXELS` set to 40,000,000 with `DecompressionBombWarning` promoted to a fatal error.
* **No `pickle` on Wire:** Redis and RQ communicate exclusively using JSON and raw byte streams, preventing remote code execution (RCE) vulnerabilities.
* **Rate Limiting:** Enforce a strict 10 requests per minute per IP address via SlowAPI.
* **CORS Policy:** Strict explicit origin whitelist; wildcards (`*`) with credentials disallowed.

### NFR-3: Reliability & Graceful Degradation
* **Dependency Independence:** If Pandoc is missing, fall back to `omml_direct.py`. If TeX Live is missing, skip compile check gracefully with an informational warning without failing the conversion.
* **Stateless Default:** System operates 100% functionality without a database (anonymous conversions). Database is strictly additive for history tracking.

---

## 7. API Specification (REST Endpoints)

| Method | Endpoint | Request Payload | Response Payload | Description |
|---|---|---|---|---|
| `POST` | `/convert` | Multipart Form: `file` (.docx), Query: `template` | `{ job_id, status: "queued" }` | Validates file, enqueues conversion job. |
| `GET` | `/status/{job_id}` | Path Parameter: `job_id` | `{ status, result_summary: { compile_ok, ... } }` | Polls job state, citations, and error lines. |
| `GET` | `/download/{job_id}`| Path Parameter: `job_id` | Binary Stream (`.tex` or `.zip`) | Delivers completed file package. |
| `GET` | `/temp/{job_id}.[tex\|zip]` | Path Parameter: `job_id` | Binary / Text Stream | Public 5-minute URL for Overleaf import. |
| `POST` | `/auth/signup` | JSON: `{ email, password, display_name }` | `{ access_token, token_type: "bearer" }` | Registers user account. |
| `POST` | `/auth/login` | JSON: `{ email, password }` | `{ access_token, token_type: "bearer" }` | Authenticates user and returns JWT. |
| `GET` | `/history` | Header: `Bearer <token>` | `[ { id, filename, template, created_at }, ... ]` | Returns paginated user conversions. |

---

## 8. Out of Scope & Future Roadmap

* **Out of Scope (v2.0):**
  * Support for legacy binary Word 97–2003 files (`.doc`).
  * Two-way roundtrip conversion (LaTeX $\to$ Word).
  * Direct rendering of interactive Word SmartArt vector graphics.
* **Roadmap (v2.1+):**
  * Built-in WebAssembly PDF compiler for instant in-browser PDF preview without Overleaf.
  * Direct Zotero and Mendeley cloud library synchronization.
  * Real-time side-by-side Word vs LaTeX visual difference view.
