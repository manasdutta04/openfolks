(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const RELEASE = "https://github.com/manasdutta04/openfolks/releases/latest/download/";

  // --- OS-aware download button + highlighted card --------------------------
  const ua = navigator.userAgent;
  const os = /Windows/i.test(ua) ? "windows" : /Mac/i.test(ua) && !/iPhone|iPad/i.test(ua) ? "mac" : /Linux|X11/i.test(ua) && !/Android/i.test(ua) ? "linux" : null;
  const target = {
    windows: ["Download for Windows", RELEASE + "OpenFolks-setup.exe"],
    mac: ["Download for macOS", RELEASE + "OpenFolks.dmg"],
    linux: ["Download for Linux", RELEASE + "OpenFolks-amd64.deb"],
  }[os];
  if (target) {
    document.querySelectorAll("[data-os-label]").forEach((s) => (s.textContent = target[0]));
    document.querySelector(`.dl-card[data-os="${os}"]`)?.classList.add("me");
  }

  // --- sticky nav border ----------------------------------------------------
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // --- scroll reveal --------------------------------------------------------
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else revealEls.forEach((el) => el.classList.add("in"));

  // --- hero chat script -----------------------------------------------------
  const chat = document.getElementById("typed");
  const script = [
    ["you", "Triage my inbox and draft replies to anything from customers."],
    ["folk", "On it. 14 new threads, 3 from customers. Drafting in your voice and holding them for your ok."],
    ["folk", "Done. 3 drafts ready, 11 archived, 1 meeting moved. Want this as a weekday routine?"],
  ];
  const bubble = (who, text) => {
    const b = document.createElement("div");
    b.className = `bubble ${who}`;
    b.textContent = text;
    chat.append(b);
    return b;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function playChat() {
    if (reduce) { script.forEach(([w, t]) => bubble(w, t)); return; }
    for (;;) {
      chat.replaceChildren();
      for (const [who, text] of script) {
        if (who === "folk") {
          const t = bubble("folk typing", "");
          t.innerHTML = "<span></span><span></span><span></span>";
          await sleep(1100);
          t.remove();
        } else await sleep(500);
        bubble(who, text);
        await sleep(1500);
      }
      await sleep(4500);
    }
  }
  if (chat) playChat();

  // --- handoff + computer rotators -----------------------------------------
  const cycle = (nodes, cls, every) => {
    if (reduce || nodes.length < 2) return;
    let i = 0;
    setInterval(() => {
      nodes[i].classList.remove(cls);
      i = (i + 1) % nodes.length;
      nodes[i].classList.add(cls);
    }, every);
  };
  cycle([...document.querySelectorAll("#handoff .h")], "on", 1600);
  cycle([...document.querySelectorAll(".computers .pc")], "on", 2400);

  // --- crews ----------------------------------------------------------------
  const crews = {
    dev: { name: "Dev Crew", blurb: "Plan, implement and review software changes as a coordinated engineering crew.", folks: [
      ["Planner", "Tech planner", "Breaks work into a short plan, risks and acceptance checks before code changes start.", "#62a8ee"],
      ["Builder", "Implementer", "Makes focused code changes, runs relevant checks and reports what landed.", "#4ec99a"],
      ["Reviewer", "Code reviewer", "Reviews diffs for bugs, regressions and missing tests.", "#e8738a"]] },
    job: { name: "Job Search", blurb: "Five folks plus a shared channel, working through portal CLIs.", folks: [
      ["Scout", "Finds postings", "Finds and ranks postings through portal CLIs.", "#62a8ee"],
      ["Tailor", "Applications", "Evaluates fit and drafts CVs and cover letters.", "#9b8fd9"],
      ["Tracker", "Pipeline", "Logs applications, outcomes and follow-ups.", "#d4b35c"],
      ["Coach", "Interview prep", "Preps interviews and LinkedIn drafts.", "#4ec99a"],
      ["Generalist", "Coordinator", "Handles ad-hoc work and coordinates the crew.", "#f0a14e"]] },
    sales: { name: "Sales Pipeline", blurb: "Research accounts, draft outreach and keep a clean follow-up list, with human approval before send.", folks: [
      ["Scout", "Account scout", "Finds and ranks target accounts or leads from the brief you give.", "#4fd1c5"],
      ["Outreach", "Outreach drafter", "Drafts email or LinkedIn messages in your voice. Never sends without approval.", "#f0836a"],
      ["Closer", "Follow-up owner", "Tracks replies, suggests next steps and keeps the pipeline tidy.", "#d4b35c"]] },
    research: { name: "Research Desk", blurb: "Investigate a question, synthesize findings and leave a decision-ready brief.", folks: [
      ["Analyst", "Research analyst", "Pulls primary sources, notes confidence and separates fact from speculation.", "#62a8ee"],
      ["Synthesizer", "Brief writer", "Turns research notes into a short brief with options, trade-offs and open questions.", "#9b8fd9"]] },
    content: { name: "Content Studio", blurb: "Research, draft and polish publish-ready content with a small editorial crew.", folks: [
      ["Researcher", "Topic researcher", "Gathers sources, outlines angles and flags claims that need citations.", "#4fc3e8"],
      ["Writer", "Draft writer", "Turns briefs into drafts in your voice. Leaves placeholders instead of inventing facts.", "#9b8fd9"],
      ["Editor", "Editor", "Tightens structure, tone and clarity. Returns a clean revision plus a short changelog.", "#f0a14e"]] },
  };
  const tabs = document.querySelectorAll("#crew-tabs button");
  const panel = document.getElementById("crew-panel");
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function showCrew(key) {
    const c = crews[key];
    const cards = c.folks.map(([n, t, d, col], i) =>
      `<div class="member" style="animation-delay:${i * 60}ms"><span class="who" style="--c:${col}">${esc(n)}</span><b>${esc(t)}</b><small>${esc(d)}</small></div>`).join("");
    panel.innerHTML = `<h3>${esc(c.name)}</h3><p>${esc(c.blurb)} Install it from <b>Marketplace → ${esc(c.name)}</b>.</p>` +
      (cards ? `<div class="members">${cards}</div>` : `<p>See the crew's folks and skills inside the app Marketplace.</p>`);
    tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.crew === key)));
  }
  tabs.forEach((t) => t.addEventListener("click", () => showCrew(t.dataset.crew)));
  showCrew("dev");

  // --- copy buttons ---------------------------------------------------------
  document.querySelectorAll("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = "Copied";
    } catch { btn.textContent = "Press Ctrl+C"; }
    setTimeout(() => (btn.textContent = "Copy"), 1600);
  }));
})();
