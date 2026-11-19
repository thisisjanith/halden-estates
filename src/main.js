import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import Lenis from "lenis";
import { initVillaScene } from "./villa-scene.js";

gsap.registerPlugin(ScrollTrigger, Flip);
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const img = (id, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=72&auto=format&fit=crop`;
const money = (m) => (m >= 1 ? `$${m.toFixed(2).replace(/0$/, "").replace(/\.0$/, "")}M` : `$${Math.round(m * 1000)}K`);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const lenis = new Lenis({ lerp: 0.1, smoothWheel: !reduced });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

let tt;
const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.add("is-on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("is-on"), 3400); };

/* ---------- Nav ---------- */
const nav = $("#nav"), burger = $("#burger"), drawer = $("#drawer");
const setDrawer = (o) => { burger.setAttribute("aria-expanded", o); drawer.classList.toggle("is-open", o); };
burger.addEventListener("click", () => setDrawer(!drawer.classList.contains("is-open")));
$$("[data-scroll]").forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault(); setDrawer(false);
  lenis.scrollTo(a.dataset.scroll === "#top" ? 0 : a.dataset.scroll, { offset: -70, duration: 1.4 });
}));
lenis.on("scroll", ({ scroll }) => nav.classList.toggle("is-solid", scroll > innerHeight * 2.4));

/* ---------- Hero ---------- */
const villa = initVillaScene($("#villa"));
gsap.timeline({
  scrollTrigger: {
    trigger: "#hero", start: "top top", end: "+=150%", pin: true, scrub: 0.7,
    onUpdate: (s) => {
      villa.setProgress(s.progress);
      const h = Math.max(0, Math.round(6 - s.progress * 7));
      $("#hero-time").textContent = h > 0 ? "Golden hour in" : "Evening at";
      $("#hero-hour").textContent = h > 0 ? `${h} h` : "Westcliff";
    },
  },
})
  .fromTo("#hero-copy", { y: 0, autoAlpha: 1 }, { y: -60, autoAlpha: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, 0.1)
  .to(".hero__fade", { autoAlpha: 0, duration: 0.3 }, 0.15)
  .fromTo("#finder", { y: 0, autoAlpha: 1 }, { y: 40, autoAlpha: 0, duration: 0.25, ease: "power2.in", immediateRender: false }, 0.15)
  .to({}, { duration: 0.6 });

/* ---------- Stats ---------- */
$$(".stats b").forEach((el) => {
  const o = { v: 0 }, dec = +(el.dataset.dec || 0);
  gsap.to(o, { v: +el.dataset.to, duration: 2, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%" },
    onUpdate: () => (el.textContent = o.v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (el.dataset.suf || "")) });
});

/* ---------- Listings ---------- */
const homes = [
  { n: "The Glass House", a: "Westcliff", t: "Villa", b: 5, ba: 4, m2: 410, p: 4.25, id: "1613490493576-7fde63acd811", x: 70, y: 250 },
  { n: "Olive Court", a: "Westcliff", t: "Villa", b: 4, ba: 3, m2: 320, p: 3.1, id: "1600596542815-ffad4c1539a9", x: 95, y: 340 },
  { n: "Cedar Lane", a: "Northbrook", t: "House", b: 4, ba: 3, m2: 260, p: 1.85, id: "1600585154340-be6161a56a0c", x: 250, y: 80 },
  { n: "Harbour Loft", a: "Old Town", t: "Apartment", b: 2, ba: 2, m2: 120, p: 1.15, id: "1600607687939-ce8a6c25118c", x: 210, y: 300 },
  { n: "Linden House", a: "Northbrook", t: "House", b: 5, ba: 4, m2: 300, p: 2.4, id: "1570129477492-45c003edd2be", x: 320, y: 130 },
  { n: "The Terraces", a: "Riverside", t: "Apartment", b: 3, ba: 2, m2: 145, p: 1.45, id: "1600210492486-724fe5c67fb0", x: 300, y: 380 },
  { n: "Salt House", a: "Westcliff", t: "Villa", b: 6, ba: 5, m2: 520, p: 4.9, id: "1580587771525-78b9dba3b914", x: 60, y: 150 },
  { n: "Atelier 9", a: "Riverside", t: "Apartment", b: 2, ba: 1, m2: 85, p: 0.89, id: "1522708323590-d24dbb6b0267", x: 350, y: 450 },
  { n: "Ash & Oak", a: "Old Town", t: "House", b: 3, ba: 2, m2: 180, p: 1.6, id: "1600047509807-ba8f99d2cdde", x: 180, y: 210 },
];
const grid = $("#grid");
grid.innerHTML = homes.map((h, i) => `
  <article class="home" data-i="${i}">
    <div class="home__img"><img src="${img(h.id, 800)}" alt="${h.n}" loading="lazy" /></div>
    <div class="home__body">
      <div class="home__top"><h3>${h.n}</h3><span class="home__price">${money(h.p)}</span></div>
      <p class="home__loc">${h.a} · ${h.t}</p>
      <div class="home__meta"><span>${h.b} beds</span><span>${h.ba} baths</span><span>${h.m2} m²</span></div>
    </div>
  </article>`).join("");
$("#viewing-home").innerHTML = homes.map((h) => `<option>${h.n} — ${h.a}</option>`).join("");

// map
const svg = $("#map-svg");
svg.innerHTML = `
  <path class="water" d="M0 0 H40 C70 90 20 160 45 230 C70 300 10 380 40 520 H0 Z"/>
  <path class="water" d="M400 250 C330 270 290 320 260 360 C230 400 240 470 220 520 H250 C265 470 262 410 290 375 C320 335 360 295 400 285 Z"/>
  <rect class="park" x="130" y="110" width="70" height="60" rx="6"/><rect class="park" x="320" y="200" width="55" height="40" rx="6"/>
  ${Array.from({ length: 22 }, (_, i) => { const x = 80 + (i % 6) * 52, y = 30 + Math.floor(i / 6) * 120; return `<rect class="block" x="${x}" y="${y}" width="38" height="30" rx="3"/>`; }).join("")}
  <path class="road" d="M60 0 C90 120 70 300 110 520"/><path class="road" d="M0 270 C140 250 260 280 400 230"/>
  <path class="road road--s" d="M150 0 V520"/><path class="road road--s" d="M260 0 C250 150 280 260 270 330"/><path class="road road--s" d="M40 120 H400"/><path class="road road--s" d="M40 420 H240"/>
  <text x="14" y="505" font-size="11" fill="#6f8a93" font-family="DM Sans" letter-spacing="2">BAY</text>
  ${homes.map((h, i) => `<g class="pin" data-i="${i}" transform="translate(${h.x} ${h.y})"><rect x="-24" y="-12" width="48" height="22" rx="4"/><path d="M-5 10 L0 16 L5 10Z" fill="var(--ink)"/><text text-anchor="middle" y="3">${money(h.p)}</text></g>`).join("")}`;
const pins = $$(".pin", svg);
const cards = $$(".home", grid);
const hot = (i, on) => { cards[i]?.classList.toggle("is-hot", on); pins[i]?.classList.toggle("is-hot", on); if (on) pins[i]?.parentNode.appendChild(pins[i]); };
cards.forEach((c, i) => { c.addEventListener("mouseenter", () => hot(i, true)); c.addEventListener("mouseleave", () => hot(i, false)); });
svg.addEventListener("click", (e) => { const p = e.target.closest(".pin"); if (p) { const c = cards[+p.dataset.i]; lenis.scrollTo(c, { offset: -120 }); hot(+p.dataset.i, true); setTimeout(() => hot(+p.dataset.i, false), 1600); } });

const f = { type: "all", max: 5, beds: 0 };
function applyFilters() {
  const state = Flip.getState(cards);
  let n = 0;
  homes.forEach((h, i) => {
    const show = (f.type === "all" || h.t === f.type) && h.p <= f.max && h.b >= f.beds;
    cards[i].style.display = show ? "" : "none";
    pins.find((p) => +p.dataset.i === i).classList.toggle("is-off", !show);
    n += show;
  });
  $("#count").textContent = n;
  $("#empty").hidden = n > 0;
  Flip.from(state, {
    duration: 0.6, ease: "power3.inOut", scale: true, absolute: true,
    onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5 }),
    onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.4 }),
    onComplete: () => ScrollTrigger.refresh(),
  });
}
const typeBtns = $$("#f-type button");
const setType = (v) => { f.type = v; typeBtns.forEach((b) => b.classList.toggle("is-on", b.dataset.v === v)); };
typeBtns.forEach((b) => b.addEventListener("click", () => { setType(b.dataset.v); applyFilters(); }));
const maxIn = $("#f-max");
const setMax = (v) => { f.max = v; maxIn.value = v; $("#f-max-out").textContent = v >= 5 ? "No limit" : money(v); };
maxIn.addEventListener("input", () => { setMax(+maxIn.value); applyFilters(); });
$("#f-beds").addEventListener("change", (e) => { f.beds = +e.target.value; applyFilters(); });
setMax(5);
$("#finder").addEventListener("submit", (e) => {
  e.preventDefault();
  const d = new FormData(e.target);
  setType(d.get("type"));
  setMax(Math.min(5, +d.get("max")));
  f.beds = +d.get("beds");
  $("#f-beds").value = d.get("beds");
  lenis.scrollTo("#listings", { offset: -70, duration: 1.6, onComplete: applyFilters });
});
gsap.from(".home", { y: 60, opacity: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: grid, start: "top 85%" } });

/* ---------- Spotlight (pinned image sequence) ---------- */
const rooms = [["Exterior", "1613490493576-7fde63acd811"], ["Living", "1600566753086-00f18fb6b3ea"], ["Kitchen", "1507089947368-19c1da9775ae"], ["Main suite", "1600607687644-c7171b42498f"], ["Atrium", "1600573472550-8090b5e0745e"]];
$("#spot-media").innerHTML = rooms.map(([r, id]) => `<img src="${img(id, 1400)}" alt="${r}" loading="lazy" />`).join("");
$("#spot-rooms").innerHTML = rooms.map(([r], i) => `<span class="${i ? "" : "is-on"}">${r}</span>`).join("");
const spotImgs = $$("#spot-media img"), roomEls = $$("#spot-rooms span");
if (innerWidth > 900) {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#spotlight", start: "top top", end: "+=" + rooms.length * 70 + "%", pin: ".spot__pin", scrub: 0.6,
      onUpdate: (s) => { const i = Math.min(rooms.length - 1, Math.floor(s.progress * rooms.length * 0.999)); roomEls.forEach((r, j) => r.classList.toggle("is-on", j === i)); },
    },
  });
  spotImgs.forEach((im, i) => {
    if (!i) return;
    tl.fromTo(im, { clipPath: "inset(100% 0 0 0)", scale: 1.15 }, { clipPath: "inset(0% 0 0 0)", scale: 1, ease: "none", duration: 1 }, i - 1);
  });
} else {
  let k = 0;
  setInterval(() => { spotImgs.forEach((im, i) => (im.style.clipPath = i === k ? "inset(0 0 0 0)" : "inset(100% 0 0 0)")); roomEls.forEach((r, j) => r.classList.toggle("is-on", j === k)); k = (k + 1) % rooms.length; }, 2600);
}

/* ---------- Areas ---------- */
const areas = [
  ["Westcliff", "Coastal villas & sea views", "1512917774080-9991f1c4c750", "$3.4M", "62", "A+"],
  ["Old Town", "Cobbled streets, cafés", "1449824913935-59a10b8d2000", "$1.3M", "96", "A"],
  ["Riverside", "Converted warehouses", "1519501025264-65ba15a82390", "$1.1M", "91", "B+"],
  ["Northbrook", "Leafy family homes", "1605276374104-dee2a0ed3cd6", "$2.1M", "74", "A+"],
  ["Harbour City", "High-rise living", "1477959858617-67f85cf4f1df", "$0.9M", "98", "B"],
];
$("#area-list").innerHTML = areas.map(([n, d], i) => `<li class="${i ? "" : "is-on"}" data-i="${i}"><h3>${n}</h3><span>${d}</span></li>`).join("");
$("#area-view").innerHTML = areas.map(([n, , id, price, walk, school], i) => `
  <figure class="${i ? "" : "is-on"}"><img src="${img(id, 1000)}" alt="${n}" loading="lazy" />
  <figcaption><div><b>${price}</b><small>Avg. price</small></div><div><b>${walk}</b><small>Walk score</small></div><div><b>${school}</b><small>Schools</small></div></figcaption></figure>`).join("");
const areaLis = $$("#area-list li"), areaFigs = $$("#area-view figure");
const pickArea = (i) => { areaLis.forEach((l, j) => l.classList.toggle("is-on", j === i)); areaFigs.forEach((fg, j) => fg.classList.toggle("is-on", j === i)); };
areaLis.forEach((li, i) => { li.addEventListener("mouseenter", () => pickArea(i)); li.addEventListener("click", () => pickArea(i)); });

/* ---------- Mortgage ---------- */
const C = 2 * Math.PI * 80;
const dPrin = $("#d-prin"), dInt = $("#d-int");
gsap.set([dPrin, dInt], { attr: { "stroke-dasharray": `0 ${C}` } });
let term = 30;
const shown = { m: 0 };
function calc() {
  const price = +$("#i-price").value, dep = +$("#i-dep").value / 100, rate = +$("#i-rate").value / 100 / 12, n = term * 12;
  const loan = price * (1 - dep);
  const m = (loan * rate * (1 + rate) ** n) / ((1 + rate) ** n - 1);
  const interest = m * n - loan;
  const fmt = (v) => "$" + Math.round(v).toLocaleString();
  $("#o-price").textContent = fmt(price);
  $("#o-dep").textContent = `${Math.round(dep * 100)}% · ${fmt(price * dep)}`;
  $("#o-rate").textContent = `${(rate * 1200).toFixed(2)}%`;
  $("#o-prin").textContent = fmt(loan);
  $("#o-int").textContent = fmt(interest);
  $("#o-loan").textContent = fmt(loan + interest);
  gsap.to(shown, { m, duration: 0.6, ease: "power2.out", onUpdate: () => ($("#o-month").textContent = fmt(shown.m)) });
  const pf = loan / (loan + interest);
  gsap.to(dPrin, { attr: { "stroke-dasharray": `${pf * C} ${C}` }, duration: 0.8, ease: "power3.out" });
  gsap.to(dInt, { attr: { "stroke-dasharray": `${C} 0` }, duration: 0.8 });
}
["#i-price", "#i-dep", "#i-rate"].forEach((s) => $(s).addEventListener("input", calc));
$$("#i-term button").forEach((b) => b.addEventListener("click", () => { term = +b.dataset.y; $$("#i-term button").forEach((x) => x.classList.toggle("is-on", x === b)); calc(); }));
ScrollTrigger.create({ trigger: "#calc", start: "top 70%", once: true, onEnter: calc });

/* ---------- Team ---------- */
const agents = [["Elena Marsh", "Founder · Westcliff", "1573496359142-b8d87734a5a2"], ["James Okafor", "Senior agent · Northbrook", "1560250097-0b93528c311a"], ["Sofia Lind", "Lettings · Old Town", "1580489944761-15a19d654956"], ["Daniel Reyes", "New homes · Riverside", "1500648767791-00dcc994a43e"]];
$("#team-grid").innerHTML = agents.map(([n, r, id]) => `<article class="agent"><div class="agent__img"><img src="${img(id, 600)}" alt="${n}" loading="lazy" /></div><h3>${n}</h3><p>${r}</p><a href="#contact" data-agent="${n}">Contact ${n.split(" ")[0]} →</a></article>`).join("");
$("#team-grid").addEventListener("click", (e) => { const a = e.target.closest("[data-agent]"); if (a) { e.preventDefault(); lenis.scrollTo("#contact", { duration: 1.4 }); toast(`${a.dataset.agent} will be your point of contact.`); } });
gsap.from(".agent", { y: 60, opacity: 0, duration: 1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: "#team-grid", start: "top 85%" } });

/* ---------- Misc ---------- */
$$(".title").forEach((t) => gsap.from(t, { y: 40, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: t, start: "top 88%" } }));
gsap.fromTo(".contact__bg", { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: true } });
$("#viewing").addEventListener("submit", (e) => { e.preventDefault(); const d = new FormData(e.target); toast(`Thanks ${d.get("name").split(" ")[0]} — we'll confirm your viewing of ${d.get("home").split(" — ")[0]} shortly.`); e.target.reset(); });
$("#year").textContent = new Date().getFullYear();

/* ---------- Loader ---------- */
gsap.timeline({ onComplete: () => { $("#loader").remove(); lenis.start(); ScrollTrigger.refresh(); } })
  .from(".loader__logo", { y: 30, opacity: 0, duration: 0.9, ease: "power3.out" })
  .to("#loader-bar", { scaleX: 1, duration: 1.2, ease: "power2.inOut" }, 0.2)
  .to("#loader", { yPercent: -100, duration: 1, ease: "expo.inOut" }, "+=0.1")
  .from(".hero__title .ln > span", { yPercent: 110, duration: 1.1, stagger: 0.12, ease: "power4.out" }, "-=0.45")
  .from(".hero__lede, #finder > *, .nav, .hero__time", { y: 24, opacity: 0, duration: 0.8, stagger: 0.06, ease: "power3.out" }, "-=0.7");
