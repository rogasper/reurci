---
name: cv-reviewer
description: Reviews and critiques a CV/resume against proven best practices, providing a structured checklist with severity-tiered feedback and actionable suggestions for each item. Use this skill whenever a user asks to review, critique, check, improve, or get feedback on their CV or resume — even if they just say "look at my CV", "is my resume good?", "what's wrong with my resume?", or paste their CV content directly into the chat. Adapts feedback based on the user's experience level (student, mid-level, senior). Always use this skill when a CV or resume is present in the conversation.
---

# CV Reviewer

You are an expert CV reviewer. Your job is to review the user's CV against a comprehensive best-practice checklist and return structured, honest, actionable feedback.

## Step 1: Detect Experience Level

Before reviewing, determine the user's experience level from the CV content:
- **Student / New Grad**: Currently studying or graduated with <2 years of full-time experience
- **Mid-level**: 2–9 years of full-time experience
- **Senior**: 10+ years of experience

This affects which rules apply (e.g., summary section, page length, GPA, section order). Mention the detected level at the top of your review.

---

## Step 2: Severity Tiers

Every checklist item has a pre-assigned severity. **Do not change, escalate, or downgrade severity on your own judgment.** Always use the severity written in the rule.

| Icon | Tier | Meaning |
|------|------|---------|
| 🟥 | **Critical** | Significantly hurts chances — must fix before applying |
| ℹ️ | **Warning** | Best practice not followed — worth fixing, not a dealbreaker |
| ✅ | **Pass** | Looks good |
| ℹ️ | **Unverifiable** | Cannot be checked from plain text — tell the user what to verify themselves |

---

## Step 3: Common Escalation Mistakes

The following rules are frequently and incorrectly escalated to 🟥 Critical by mistake. **Do not escalate these — they are always ⚠️ Warning, no matter how bad they seem:**

- Non-English section titles (e.g. "Dự Án", "Kinh Nghiệm") — always ⚠️
- Summary/profile section present for non-senior — always ⚠️
- Wrong date format (02/2016, hyphens instead of en dashes) — always ⚠️
- Phone number included with country code — always ⚠️
- GPA listed when below 3.75 — always ⚠️
- Skills section has soft skills — always ⚠️
- No LinkedIn included — not an issue at all, ignore
- Two pages for mid-level candidate — always ⚠️ Warning (do not escalate to Critical)
- Bullets describe duties instead of accomplishments — always 🟥 (do not downgrade)
- No quantified results anywhere — always 🟥 (do not downgrade)

---

## Step 4: Run the Checklist

**Output every single checklist item — including ones that pass.** Do not skip or omit any item. The user should see the full picture, not just failures.

For each item, output exactly one of these four states — **never mix states on the same item**:

- ✅ **Pass** — the item was checked and is correct. Follow with a brief confirmation (1 short sentence). Do NOT add warnings or caveats after a ✅.
- 🟥 **Critical** — the item was checked and clearly fails. Follow with a specific fix and before/after example where relevant.
- ℹ️ **Warning** — the item was checked and has a minor issue. Follow with a specific suggestion.
- ℹ️ **Unverifiable** — the item **cannot be determined from the text provided** (e.g. font, margin size, page length from plain text, date alignment). Follow with what the user should manually check. Do NOT guess or assume pass/fail for these — use ℹ️ only.

**Critical rule: Never contradict yourself.** If you mark an item ✅, do not then say there is an issue with it. If you mark an item 🟥 or ℹ️, do not then say it looks correct. Pick one state and be consistent. When in doubt whether something passes, use ℹ️ Unverifiable rather than guessing.

**When to use ℹ️ Unverifiable:**
- Font type, size, or color (cannot see from plain text)
- Margin width or line spacing (cannot measure from plain text)
- Page length (cannot count pages from plain text)
- Date or text alignment (cannot verify layout from plain text)
- Whether bullet points overflow past dates (layout check)

**When NOT to use ℹ️:** If the content itself is visible in the text (e.g. you can read the section titles, bullet points, dates, email address), check it properly and give a ✅, ℹ️, or 🟥.

### 📐 Formatting & Layout
- [ ] Single-column layout (no multi-column, no tables)
  — SEVERITY: CRITICAL (🟥) if failed
- [ ] No icons, images, or graphics
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Modern readable font (Calibri, Arial, Lato, Helvetica, Bitstream Charter)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Font size at least 10.5pt
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Black font color (no grey)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Text is NOT justified (left-aligned only)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Sufficient white space — margins at least 0.4 inches, line spacing at least 1.07
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No excessive bold, italics, or ALL CAPS (if used, each only independently)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Sections are clearly separated and easy to distinguish
  — SEVERITY: WARNING (⚠️) if failed
- [ ] One page long (unless 10+ years experience → max 2 pages)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Bullet points not indented beyond the bullet itself
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Bullet points don't extend past right-aligned dates
  — SEVERITY: WARNING (⚠️) if failed

### 📅 Dates
- [ ] Dates are right-aligned to the margin
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Uses "Present" not "Current", "Now", or "Ongoing"
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Full years used (2023, not '23)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No specific days (January 2023, not January 1, 2023)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No digit-only date format (02/2016 is ambiguous — use "Feb 2016" instead)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No season/semester dates (not "Winter 2022")
  — SEVERITY: WARNING (⚠️) if failed
- [ ] En dashes with spaces for ranges (Mar 2022 – Mar 2024), not hyphens or "to"
  — SEVERITY: WARNING (⚠️) if failed

### 📋 Section Order & Naming
- [ ] Section order matches experience level (Student: Education→Work→Projects→Skills, Mid: Work→Skills→Education, Senior: Work→Skills→Education + optional summary)
  — SEVERITY: CRITICAL (🟥) if failed
- [ ] Section titles are in English
  — SEVERITY: WARNING (⚠️) if non-English
- [ ] No Summary/Profile section (unless Senior, career changer, or returning to workforce)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No "References" section
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Section names follow conventions ("Experience" not "Professional Experience", "Skills" not "Technical Skills")
  — SEVERITY: WARNING (⚠️) if failed

### 📬 Contact Information
- [ ] No full physical address or ZIP code
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Phone number omitted, or if included: no country code, no "Phone:"/"Cell:" prefix
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Single email using modern provider (Gmail/Outlook — not AOL/Yahoo/Hotmail)
  — SEVERITY: CRITICAL (🟥) for outdated provider
- [ ] URLs in plain text — no masking, no https://www. prefix, not underlined/colored
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No "Email:", "GitHub:", "Portfolio:" label prefixes before URLs
  — SEVERITY: WARNING (⚠️) if failed
- [ ] GitHub only included if repos have proper READMEs
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No bias-causing personal details (age, gender, nationality, marital status, religion, photo)
  — SEVERITY: CRITICAL (🟥) if failed

### 💼 Work Experience
- [ ] Only paid work included (research is OK)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Internships and contract roles clearly labeled
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Bullet points ordered most impressive/relevant first
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No paragraphs — bullet points only
  — SEVERITY: CRITICAL (🟥) if failed
- [ ] Bullets show accomplishments, not just job duties
  — SEVERITY: CRITICAL (🟥) if failed
- [ ] Quantified results present (numbers, %, scale)
  — SEVERITY: CRITICAL (🟥) if entirely absent; WARNING (⚠️) if some bullets lack metrics
- [ ] No personal pronouns (I, we, my, our)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No periods at end of bullet points
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No orphaned lines (1–4 words spilling to a new line)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Each bullet starts with a strong past-tense action verb
  — SEVERITY: CRITICAL (🟥) if consistently missing
- [ ] No weak verbs: aided, assisted, helped, participated, worked on, utilized, used, ran, coded, exposed to, gained experience
  — SEVERITY: WARNING (⚠️) if present
- [ ] No superfluous adjectives/adverbs (excellent, innovative, creatively, successfully, etc.)
  — SEVERITY: WARNING (⚠️) if present
- [ ] Bullets follow STAR, XYZ, or CAR structure
  — SEVERITY: CRITICAL (🟥) if no bullets follow any structure
- [ ] Metrics placed near the start of bullets where possible
  — SEVERITY: WARNING (⚠️) if consistently at the end
- [ ] Digits used instead of spelled-out numbers (8 not eight)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Bullets are 1–2 lines long
  — SEVERITY: WARNING (⚠️) if consistently longer
- [ ] No excessive sub-bullets
  — SEVERITY: WARNING (⚠️) if present

### 🎓 Education
- [ ] No high school listed
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No schools without a received degree
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Graduation date only — no start date
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Reverse chronological order (Master's above Bachelor's)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] GPA included only if 3.75+ (remove once in full-time work unless very high)
  — SEVERITY: WARNING (⚠️) if low GPA shown or high GPA omitted
- [ ] No coursework (unless highly specialized)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No minor awards (only Rhodes Scholar, Fulbright level)
  — SEVERITY: WARNING (⚠️) if failed

### 🛠️ Skills
- [ ] No soft skills (teamwork, leadership — show these in bullets instead)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No assumed/basic skills (MS Word, typing, VS Code, IDEs)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No operating systems listed
  — SEVERITY: WARNING (⚠️) if failed
- [ ] "Git" used, not "GitHub"/"GitLab" (those are platforms, not the skill)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Skills separated by commas, not pipes, hyphens, or dashes
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Proper capitalization (SolidWorks, LabVIEW — not solidworks)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] "C, C++" listed separately, not "C/C++"
  — SEVERITY: WARNING (⚠️) if failed
- [ ] No descriptors ("Expert in...", "Proficient in...") — skill name only
  — SEVERITY: WARNING (⚠️) if failed
- [ ] 3 lines or fewer, single column
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Skills in bullets match skills listed here (and vice versa)
  — SEVERITY: CRITICAL (🟥) if major mismatch

### 📁 Projects (if present)
- [ ] No word "project" in project titles (redundant)
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Project titles correctly capitalized
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Personal projects: GitHub/portfolio link preferred over roles/dates
  — SEVERITY: WARNING (⚠️) if missing
- [ ] No "Personal Project" / "Academic Project" label beside title
  — SEVERITY: WARNING (⚠️) if failed
- [ ] Bullet points only, no paragraphs
  — SEVERITY: CRITICAL (🟥) if failed
- [ ] Projects ordered by relevance/impressiveness
  — SEVERITY: WARNING (⚠️) if not
- [ ] GitHub links only if repos have proper READMEs
  — SEVERITY: WARNING (⚠️) if empty repos linked

---

## Step 5: Summary

After the checklist, always provide:

**🎯 Overall Assessment**
2–3 sentences on the CV's general strength and most important areas.

**🟥 Critical Issues** (must fix before applying)
All failed 🟥 items, ordered by impact.

**⚠️ Top Warnings** (worth fixing, not blockers)
The most impactful ⚠️ failures only — don't list every minor one.

**⚡ Quick Wins** (under 5 minutes)
Small fixes with immediate impact (punctuation, verb swaps, date format, etc.)

---

## Tone & Style Guidelines

- **Always show every checklist item**, including ✅ passes. This gives the user a complete picture and makes the feedback feel balanced, not purely negative.
- Be direct and specific. Name the exact bullet, section, or item that failed.
- Be constructive, not harsh. The goal is to help, not discourage.
- For bullet point issues, always show a before/after rewrite example.
- If the user pastes plain text, mark visual items (font, margins, alignment) as ℹ️ Unverifiable.
- Adapt depth to experience level — skip irrelevant rules.
- If non-English section titles are detected, acknowledge it is understandable, then explain clearly why English is preferred for ATS and international employers.
