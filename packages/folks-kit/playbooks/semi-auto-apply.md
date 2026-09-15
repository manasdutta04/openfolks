## Semi-automated job application (human approves Submit)

Use this when the user wants to apply after Tailor has prepared materials, or when ranked jobs are ready.

**Prerequisites:** Tailored PDFs in `documents/applications/<company>_<role>/` or `cv/` + `cover_letters/`.

**Steps:**

1. Confirm company, role, and application URL with the user.
2. Enable computer-use or browser mode to open the employer's careers portal.
3. Fill application fields from profile and tailored materials. Upload CV/cover letter PDFs when prompted.
4. **Stop before Submit/Send.** Do not click the final submit button without user approval.
5. Present an approval summary: company, role, what was filled, attachments used.
6. If the user approves (via permission card Allow), click Submit once.
7. Ask Tracker to log `status: applied` in `job_search_tracker.csv` with submission date.

**Never:**
- Submit without explicit user approval on the final action
- Auto-send email or LinkedIn messages
- Use LinkedIn Easy Apply automation in v1 — employer portals only

**LinkedIn job search:** use `portals/linkedin-search` for discovery only; user submits manually unless on an employer site via computer-use.

**403 / bot-blocked pages:** escalate to browser/computer-use with browser headers; prefer employer careers site over aggregators.
