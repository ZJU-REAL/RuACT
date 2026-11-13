const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Reveal on scroll */
const revealer = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in");
      revealer.unobserve(entry.target);
    }),
  { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
);
document.querySelectorAll(".reveal").forEach((el) => revealer.observe(el));

/* Active section in navigation */
const navLinks = [...document.querySelectorAll('.ru-nav nav a[href^="#"]')];
const spy = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
    }),
  { rootMargin: "-45% 0px -50% 0px" },
);
["problem", "method", "teacher", "critic", "results", "cite"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) spy.observe(el);
});

/* Segmented control helper */
function segmented(group, onChange) {
  const buttons = [...group.querySelectorAll("button")];
  buttons.forEach((button) =>
    button.addEventListener("click", () => {
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      onChange(button);
    }),
  );
}

/* ---------------------------- Gradebook (Table 1) ---------------------------- */
(() => {
  const book = document.querySelector("[data-ru-book]");
  if (!book) return;
  const body = book.querySelector("[data-ru-book-body]");
  const note = book.querySelector("[data-ru-book-note]");
  // Paper Table 1 (README), matched methods only; OPSD* is excluded from matched comparison.
  const data = {
    "1.7B": [
      ["Base", "", [38.57, 23.18, 52.56, 50.51, 41.21]],
      ["GRPO", "group", [43.26, 26.45, 55.67, 54.79, 45.04]],
      ["Reweight", "", [42.6, 25.61, 56.77, 56.11, 45.27]],
      ["RuscaRL", "", [43.39, 23.95, 56.41, 59.37, 45.78]],
      ["RuACT-Teacher", "group ours", [43.82, 25.16, 58.42, 57.76, 46.29]],
      ["RuACT-Critic", "ours", [43.24, 27.97, 58.16, 58.55, 46.98]],
      ["RuACT", "ours main", [43.35, 27.83, 58.83, 58.65, 47.17]],
    ],
    "4B": [
      ["Base", "", [50.38, 35.45, 66.16, 59.16, 52.79]],
      ["GRPO", "group", [53.55, 37.62, 70.08, 64.82, 56.52]],
      ["Reweight", "", [55.34, 38.46, 70.28, 65.02, 57.28]],
      ["RuscaRL", "", [55.36, 37.1, 69.38, 65.33, 56.79]],
      ["RuACT-Teacher", "group ours", [55.15, 38.57, 70.53, 66.12, 57.59]],
      ["RuACT-Critic", "ours", [55.5, 38.77, 70.47, 64.62, 57.34]],
      ["RuACT", "ours main", [56.34, 40.12, 70.59, 69.44, 59.12]],
    ],
  };
  function render(model) {
    const rows = data[model];
    const ranks = [0, 1, 2, 3, 4].map((col) => {
      const sorted = [...new Set(rows.map((r) => r[2][col]))].sort((a, b) => b - a);
      return { best: sorted[0], second: sorted[1] };
    });
    body.innerHTML = rows
      .map(([name, cls, vals]) => {
        const cells = vals
          .map((v, col) => {
            const mark = v === ranks[col].best ? "best" : v === ranks[col].second ? "second" : "";
            const avg = col === 4 ? " avg" : "";
            return `<td class="${mark}${avg}" style="--w: ${v}"><b>${v.toFixed(2)}</b></td>`;
          })
          .join("");
        return `<tr class="${cls}"><th scope="row">${name}</th>${cells}</tr>`;
      })
      .join("");
    const ru = rows.find((r) => r[0] === "RuACT")[2][4];
    const grpo = rows.find((r) => r[0] === "GRPO")[2][4];
    note.innerHTML =
      `Qwen3-${model}: RuACT averages <b>${ru.toFixed(2)}</b> vs. <b>${grpo.toFixed(2)}</b> for GRPO ` +
      `(+${(ru - grpo).toFixed(2)} points)` +
      (model === "4B" ? ", and is best on all four benchmarks." : ", the best average at this scale.");
  }
  segmented(book.querySelector(".ru-seg"), (b) => render(b.dataset.model));
  render("4B");
})();

/* ------------------------- Critic case study (Table 10) ------------------------- */
(() => {
  const box = document.querySelector("[data-ru-case]");
  if (!box) return;
  const rows = [...box.querySelectorAll(".ru-crow[data-v]")];
  const verdicts = rows.map((row) => row.dataset.v.split(",").map(Number));
  rows.forEach((row, k) =>
    verdicts[k].forEach((v) => {
      const cell = document.createElement("span");
      cell.className = `v${v ? " ok" : ""}`;
      cell.setAttribute("role", "cell");
      cell.textContent = v ? "✓" : "✗";
      row.append(cell);
    }),
  );
  const total = box.querySelector(".ru-crow.total");
  const totals = [...Array(8)].map(() => {
    const cell = document.createElement("span");
    cell.className = "r";
    cell.setAttribute("role", "cell");
    total.append(cell);
    return cell;
  });
  const note = box.querySelector("[data-ru-case-note]");
  const lambda = 0.5; // docs/training.md: parent keeps (1-λ)w, retained children share λw equally
  function render(mode) {
    box.dataset.mode = mode;
    const children = verdicts.slice(1);
    totals.forEach((cell, i) => {
      const passed = children.reduce((s, c) => s + c[i], 0);
      const r = mode === "parent" ? verdicts[0][i] : (1 - lambda) * verdicts[0][i] + (lambda * passed) / children.length;
      cell.style.setProperty("--r", r);
      cell.textContent = r.toFixed(2);
    });
    note.innerHTML =
      mode === "parent"
        ? "All eight responses pass the parent, so every family reward is <b>1.00ω</b>: the rubric cancels out of the advantage."
        : "With three retained children (λ = 0.5), family rewards spread from <b>0.50ω</b> to <b>1.00ω</b>: R3 and R6 satisfy all three children; R2, R5, R7 and R8 satisfy none.";
  }
  segmented(box.querySelector(".ru-seg"), (b) => render(b.dataset.mode));
  render("children");
})();

/* --------------------------------- Copy BibTeX --------------------------------- */
function copyFallback(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 800)),
      ]);
      return true;
    } catch {
      /* fall through */
    }
  }
  return copyFallback(text);
}
document.querySelectorAll("[data-copy]").forEach((button) =>
  button.addEventListener("click", async () => {
    const text = document.getElementById(button.dataset.copy).textContent;
    button.textContent = (await copyText(text)) ? "Copied ✓" : "Select and copy";
    button.classList.add("done");
    setTimeout(() => {
      button.textContent = "Copy BibTeX";
      button.classList.remove("done");
    }, 1800);
  }),
);

/* ------------------------------ Animated method figure ------------------------------ */
(() => {
  const fig = document.querySelector("[data-ru-fig]");
  if (!fig) return;
  const stage = fig.querySelector("[data-ru-stage]");
  const svg = fig.querySelector("[data-ru-wires]");
  const phases = ["diagnose", "teacher", "critic", "update"];
  const panels = Object.fromEntries(phases.map((p) => [p, fig.querySelector(`[data-ru-panel="${p}"]`)]));
  const tabs = [...fig.querySelectorAll("[data-ru-phase]")];
  const playButton = fig.querySelector("[data-ru-play]");
  const anchor = (key) => fig.querySelector(`[data-ru-a="${key}"]`);
  const rowTag = (k) => anchor(k).querySelector(".tag");
  const gate = fig.querySelector(".ru-gate");
  const children = fig.querySelector(".ru-children");
  const NS = "http://www.w3.org/2000/svg";
  const colour = { teacher: "var(--teacher)", critic: "var(--critic)", ink: "var(--muted)" };

  [fig.querySelectorAll(".ru-row"), [children], [fig.querySelector(".ru-wbar.split")]].forEach((list) =>
    list.forEach((parent) => [...parent.children].forEach((child, i) => child.style.setProperty("--i", i))),
  );
  fig.querySelectorAll(".ru-row").forEach((row) =>
    [...row.querySelectorAll("i")].forEach((cell, i) => cell.style.setProperty("--i", i)),
  );

  /* ---- wires ---- */
  let wires = {};
  const shown = (el) => el && el.getClientRects().length > 0;
  function box(el) {
    const r = el.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const l = r.left - s.left;
    const t = r.top - s.top;
    return { l, t, r: l + r.width, b: t + r.height, cx: l + r.width / 2, cy: t + r.height / 2 };
  }
  function routes() {
    const out = {};
    const st = panels.diagnose;
    const both = (...els) => els.every(shown);
    const gut = parseFloat(getComputedStyle(fig).getPropertyValue("--gut")) || 28;
    if (both(st, panels.teacher)) {
      const r1 = box(rowTag("r1"));
      const tr = box(anchor("t-rubric"));
      const x = (box(st).r + box(panels.teacher).l) / 2 - 8;
      out.teach = ["teacher", "teacher", [[r1.r, r1.cy], [x, r1.cy], [x, tr.cy], [tr.l, tr.cy]]];
    }
    if (both(st, panels.critic)) {
      const r4 = box(rowTag("r4"));
      const cp = box(anchor("c-parent"));
      const x = (box(st).r + box(panels.critic).l) / 2 + 8;
      out.crit = ["critic", "critic", [[r4.r, r4.cy], [x, r4.cy], [x, cp.cy], [cp.l, cp.cy]]];
    }
    if (both(panels.teacher, panels.update)) {
      const td = box(anchor("t-distill"));
      const ud = box(anchor("u-distill"));
      const x = (box(panels.teacher).r + box(panels.update).l) / 2 - 8;
      out.distill = ["teacher", "teacher", [[td.r, td.cy], [x, td.cy], [x, ud.cy], [ud.l, ud.cy]]];
    }
    if (both(panels.critic, panels.update)) {
      const cw = box(anchor("c-weights"));
      const ur = box(anchor("u-reward"));
      const x = (box(panels.critic).r + box(panels.update).l) / 2 + 8;
      out.weights = ["critic", "critic", [[cw.r, cw.cy], [x, cw.cy], [x, ur.cy + 8], [ur.l, ur.cy + 8]]];
    }
    if (both(st, panels.teacher, panels.critic, panels.update)) {
      const r2 = box(rowTag("r2"));
      const r3 = box(rowTag("r3"));
      const ur = box(anchor("u-reward"));
      const y0 = (r2.cy + r3.cy) / 2;
      const yGap = (box(panels.teacher).b + box(panels.critic).t) / 2;
      const x1 = (box(st).r + box(panels.teacher).l) / 2;
      const x2 = (box(panels.teacher).r + box(panels.update).l) / 2;
      out.info = ["update", "ink", [[r3.r, y0], [x1, y0], [x1, yGap], [x2, yGap], [x2, ur.cy - 8], [ur.l, ur.cy - 8]],
        { text: "informative · original rewards", x: (x1 + x2) / 2, y: yGap - 6 }];
      const pi = box(anchor("u-pi"));
      const q = box(anchor("query"));
      const yLow = Math.max(pi.b, box(st).b, box(panels.critic).b) + 22;
      const xl = box(st).l - gut * 0.5;
      out.loop = ["update", "ink", [[pi.cx, pi.b], [pi.cx, yLow], [xl, yLow], [xl, q.cy], [q.l, q.cy]],
        { text: "next iteration: the updated policy rolls out again", x: (pi.cx + xl) / 2, y: yLow - 7 }];
    }
    return out;
  }
  function pathData(pts, radius = 10) {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      const l1 = Math.hypot(x1 - x0, y1 - y0) || 1;
      const l2 = Math.hypot(x2 - x1, y2 - y1) || 1;
      const k = Math.min(radius, l1 / 2, l2 / 2);
      d += ` L${x1 + ((x0 - x1) / l1) * k},${y1 + ((y0 - y1) / l1) * k}`;
      d += ` Q${x1},${y1} ${x1 + ((x2 - x1) / l2) * k},${y1 + ((y2 - y1) / l2) * k}`;
    }
    const [lx, ly] = pts[pts.length - 1];
    return `${d} L${lx},${ly}`;
  }
  const make = (tag, attrs) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };
  function drawWires() {
    const keep = Object.fromEntries(Object.entries(wires).map(([id, w]) => [id, w.g.getAttribute("class") || ""]));
    svg.replaceChildren();
    const defs = make("defs", {});
    Object.entries(colour).forEach(([name, c]) => {
      const marker = make("marker", {
        id: `ru-arrow-${name}`,
        markerWidth: 9,
        markerHeight: 9,
        refX: 8,
        refY: 4.5,
        orient: "auto",
        markerUnits: "userSpaceOnUse",
      });
      marker.append(make("path", { d: "M0,0.5 L9,4.5 L0,8.5 z", style: `fill: ${c}` }));
      defs.append(marker);
    });
    svg.append(defs);
    wires = {};
    Object.entries(routes()).forEach(([id, [phase, tone, pts, label]]) => {
      const d = pathData(pts);
      const g = make("g", { style: `--wc: ${colour[tone]}` });
      const base = make("path", { class: "base", d, "marker-end": `url(#ru-arrow-${tone})` });
      const flow = make("path", { class: "flow", d });
      const dot = make("circle", { class: "dot", r: 4.5, cx: pts[0][0], cy: pts[0][1] });
      g.append(base, flow, dot);
      if (label) {
        const t = make("text", { class: "lbl", x: label.x, y: label.y, "text-anchor": "middle" });
        t.textContent = label.text;
        g.append(t);
      }
      svg.append(g);
      const len = flow.getTotalLength();
      flow.style.strokeDasharray = `${len} ${len}`;
      flow.style.strokeDashoffset = (keep[id] || "").includes("done") ? 0 : len;
      if (keep[id]) g.setAttribute("class", keep[id]);
      wires[id] = { g, flow, dot, len, phase };
    });
    markWires();
  }
  function markWires() {
    Object.values(wires).forEach((w) => w.g.classList.toggle("on", w.phase === phases[index]));
  }
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function flow(id, ms) {
    const run = token;
    const start = performance.now();
    return new Promise((resolve) => {
      function frame(now) {
        const w = wires[id];
        if (run !== token || !w) return resolve();
        const t = Math.min(1, (now - start) / ms);
        const at = w.len * ease(t);
        const p = w.flow.getPointAtLength(at);
        w.flow.style.strokeDashoffset = w.len - at;
        w.dot.setAttribute("cx", p.x);
        w.dot.setAttribute("cy", p.y);
        w.g.classList.add("live");
        if (t < 1) return requestAnimationFrame(frame);
        w.g.classList.remove("live");
        w.g.classList.add("done");
        resolve();
      }
      requestAnimationFrame(frame);
    });
  }
  function clearWires(phase) {
    Object.values(wires).forEach((w) => {
      if (phase && w.phase !== phase) return;
      w.g.classList.remove("live", "done");
      w.flow.style.strokeDashoffset = w.len;
    });
  }

  /* ---- step helpers ---- */
  const lit = (phase, n) => panels[phase].querySelectorAll(`[data-step="${n}"]`).forEach((el) => el.classList.add("lit"));
  function bump(el) {
    if (!el) return;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }
  const sequences = {
    diagnose: [
      [600, () => lit("diagnose", 1)],
      [1500, () => lit("diagnose", 2)],
      [1000, () => lit("diagnose", 3)],
      [1000, () => lit("diagnose", 4)],
      [1800, () => {}],
    ],
    teacher: [
      [900, (ms) => flow("teach", ms)],
      [700, () => lit("teacher", 1)],
      [800, () => lit("teacher", 2)],
      [700, () => lit("teacher", 3)],
      [800, () => gate.classList.add("open")],
      [1100, () => lit("teacher", 4)],
      [900, (ms) => flow("distill", ms)],
      [1600, () => bump(anchor("u-distill"))],
    ],
    critic: [
      [900, (ms) => flow("crit", ms)],
      [700, () => lit("critic", 1)],
      [1300, () => lit("critic", 2)],
      [1000, () => children.classList.add("filtered")],
      [1100, () => lit("critic", 3)],
      [900, (ms) => flow("weights", ms)],
      [1600, () => bump(anchor("u-reward"))],
    ],
    update: [
      [700, () => lit("update", 1)],
      [1000, (ms) => flow("info", ms)],
      [700, () => lit("update", 2)],
      [800, () => lit("update", 3)],
      [800, () => lit("update", 4)],
      [1400, (ms) => flow("loop", ms)],
      [1600, () => bump(anchor("policy"))],
    ],
  };

  /* ---- player ---- */
  let token = 0;
  let index = 0;
  let playing = !reduceMotion;
  let inView = false;
  let running = false;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function setActive(i, dim) {
    index = i;
    fig.dataset.active = phases[i];
    fig.toggleAttribute("data-dim", dim);
    phases.forEach((p, k) => panels[p].classList.toggle("on", k === i));
    tabs.forEach((tab, k) => tab.setAttribute("aria-pressed", String(k === i)));
    markWires();
  }
  function reset(phase) {
    const panel = panels[phase];
    panel.classList.add("ru-run");
    panel.querySelectorAll(".lit").forEach((el) => el.classList.remove("lit"));
    if (phase === "teacher") gate.classList.remove("open");
    if (phase === "critic") children.classList.remove("filtered");
    clearWires(phase);
  }
  function settle(phase) {
    panels[phase].classList.remove("ru-run");
    if (phase === "teacher") gate.classList.add("open");
    if (phase === "critic") children.classList.add("filtered");
    clearWires();
    tabs.forEach((tab) => tab.style.setProperty("--t", 0));
  }
  function stop() {
    token++;
    running = false;
    settle(phases[index]);
  }
  async function run(i) {
    const my = ++token;
    running = true;
    settle(phases[index]);
    setActive(i, true);
    drawWires();
    const phase = phases[i];
    reset(phase);
    const steps = sequences[phase];
    const total = steps.reduce((s, [ms]) => s + ms, 0);
    const start = performance.now();
    (function progress(now) {
      if (my !== token) return;
      tabs[i].style.setProperty("--t", Math.min(1, (now - start) / total));
      requestAnimationFrame(progress);
    })(start);
    for (const [ms, action] of steps) {
      action(ms);
      await wait(ms);
      if (my !== token) return;
    }
    running = false;
    settle(phase);
    if (playing && inView) run((i + 1) % phases.length);
  }
  function select(i) {
    stop();
    if (playing && inView) run(i);
    else {
      setActive(i, true);
      drawWires();
    }
  }
  function setPlaying(next) {
    playing = next;
    fig.toggleAttribute("data-paused", !next);
    playButton.setAttribute("aria-label", next ? "Pause animation" : "Play animation");
    if (next) run(index);
    else stop();
  }

  tabs.forEach((tab, i) => tab.addEventListener("click", () => select(i)));
  phases.forEach((p, i) =>
    panels[p].addEventListener("click", () => {
      if (index !== i || !running) select(i);
    }),
  );
  playButton.addEventListener("click", () => setPlaying(!playing));

  new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      if (inView && playing && !running) run(index);
      if (!inView && running) stop();
    },
    { threshold: 0.3 },
  ).observe(stage);

  let queued = false;
  new ResizeObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      drawWires();
    });
  }).observe(stage);
  document.fonts?.ready.then(drawWires);

  gate.classList.add("open");
  children.classList.add("filtered");
  fig.toggleAttribute("data-paused", !playing);
  setActive(0, false);
  drawWires();
})();
