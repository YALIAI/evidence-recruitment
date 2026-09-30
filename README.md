# Evidence — Job and Resume Matching

An English recruitment workspace for comparing a job description with up to six resumes. Reports show quoted evidence, points to verify and interview questions. Evidence status is not a hiring recommendation or candidate ranking.

## Browser-only matching (v1.2)

Select **Analyze resume evidence** after pasting an English job description and resume text. No model, API, backend, network request or persistent storage is used for analysis.

- Named technical skills are extracted using an editable alias dictionary in `src/matcher.mjs`.
- Required/preferred headings determine priority; review the extracted job context.
- Exact resume passages show direct mentions, limited/negative mentions or lexical hints retrieved with TF-IDF cosine similarity.
- Direct mention does not verify skill proficiency, years, recency or compound requirements. Alternatives may appear as separate criteria; they are not rejection conditions.
- Generic requirements use lexical retrieval only. English negation/context checks are heuristic, not comprehensive. Non-English text, PDFs, inferred skill years and semantic embeddings are not supported in this version.
- The lexical threshold is an uncalibrated retrieval heuristic, not a probability. There is no candidate ranking or hiring score.
- Reports are invalidated when inputs change. Markdown exports include job context and matching reasons. Manual reviews remain separate.
- Run `node --test tests/matcher.test.mjs` for regression checks.

## Manual screening workspace (v1.1)

- Edit up to 12 job-related required/preferred criteria.
- Compare candidate evidence side by side.
- Record exact resume quotes, evidence status, skill years, last-used month, and interview questions.
- A Supported/Partial assessment requires a quote that exists verbatim in the resume.
- Candidate stages (New, Reviewing, Interview, On hold), search and stage filtering.
- Export all candidate reviews to CSV, with spreadsheet formula protection.
- Changing job/resume inputs clears manual reviews; changing criterion wording or priority clears evidence assessments.
- All manual review data is session-only. Export before closing.
- Local matching is available; manual reviews remain separate from algorithm suggestions.

### Product references

The workflow borrows concepts, not proprietary code or branding:

- [CVViZ](https://cvviz.com/product/resume-screening/): configurable job criteria and explainable resume evidence.
- [Zoho Recruit](https://help.zoho.com/portal/en/kb/recruit/zia/overview/articles/zia-matching-overview): skill experience and last-use information; recorded manually here.
- [Manatal](https://www.manatal.com/features/manatal-ai): candidate management and review workflow.
- [Workable](https://www.workable.com/features): consistent recruitment review workflow.

## Current capabilities

- English interface, ADAS example resumes, example reports and Markdown export.
- Editable job description and candidate resumes.
- Responsive layout and keyboard-accessible controls.
- Inputs remain in memory only; they are cleared on reload or closing the page.
- **Live local matching is available without AI.** The ADAS example is explicitly labelled as a preset report.

## Publish on GitHub Pages

The `docs/` folder contains the complete prebuilt website. No build or package installation is required to publish it.

1. Create a repository named `evidence-recruitment` in your GitHub account. A public repository works with GitHub Free. A public repository contains application code and preset examples only; never commit real resumes or secrets.
2. Upload this project's files, preserving the `docs/`, `src/` and `.github/workflows/` folders.
3. In **Settings → Pages**, choose **GitHub Actions** as the source.
4. The included workflow publishes `docs/` after a push to `main`, or can be run manually from **Actions**.
5. Open the URL reported by the successful Pages deployment. A project site uses `https://<account>.github.io/evidence-recruitment/`.

Alternatively, select **Deploy from a branch → main → /docs** in Settings → Pages. The prebuilt assets work with this option too.

## Preview locally

From this project directory:

```bash
python3 -m http.server 8000 --directory docs
```

Open `http://localhost:8000/`. Select **View ADAS example**, switch candidates and export a report.

## Rebuild after editing

Requires Node.js 22 or later:

```bash
npm install
npm run build
```

The build updates `docs/app.js`. Styles are in `docs/styles.css`. Commit the updated prebuilt assets with source changes.

## Connect an analysis backend later

GitHub Pages hosts static files and cannot run the AI backend. Set `analysisEndpoint` in `docs/config.js` only after a separate backend is deployed. The endpoint must accept POST JSON:

```json
{
  "job": "Full job description",
  "candidates": [{"id":"candidate-1","name":"Candidate 1","resume":"Resume text"}]
}
```

Return JSON in this shape:

```json
{
  "candidates": [{
    "id":"candidate-1",
    "summary":"Summary of documented job-related experience",
    "rows":[{
      "requirement":"A job requirement",
      "status":"supported",
      "evidence":"An exact quote from the supplied resume",
      "question":"An interview question to verify this requirement"
    }]
  }]
}
```

Allowed statuses: `supported`, `partial`, `unknown`. Unknown evidence should be an empty string. A backend error should return a non-2xx status and `{"error":"A useful message"}`. The backend must validate inputs, quote accuracy and candidate IDs, and return reports in English. Use the same requirements for each candidate.

Keep model credentials on the backend, never in this repository or browser code. The backend needs HTTPS and a CORS policy permitting the exact Pages origin, plus appropriate access controls for real resumes. The app does not implement backend authentication yet.

For a local llama.cpp model, host both the app and backend on Ubuntu. A hosted Pages website cannot directly access your machine's localhost or Tailscale address. `llama-server` alone does not implement this application's report endpoint; an adapter is required. This project does not yet include that adapter.
