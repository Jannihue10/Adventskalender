import { db } from "./firebase.js";
import { doc, collection, onSnapshot, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { drawWheel, spinTo, pickWeighted } from "./wheel.js";

const $ = (id) => document.getElementById(id);
let config = null;
const opened = {}; // Türnummer -> gezogener Name
let current = null, spinning = false;

function isUnlocked(n) {
  if (!config) return false;
  if (config.testMode) return true;
  return new Date() >= new Date(config.year, 11, n);
}

function render() {
  const grid = $("grid");
  grid.innerHTML = "";
  if (!config || !config.names?.length) {
    $("sub").textContent = "Der Kalender ist noch nicht eingerichtet.";
    return;
  }
  $("sub").textContent = config.testMode ? "Testmodus: alle Türen sind offen" : "Jeden Tag eine neue Tür – und ein Glücksrad!";
  for (let n = 1; n <= 24; n++) {
    const b = document.createElement("button");
    b.className = "door";
    if (opened[n] !== undefined) {
      b.classList.add("open");
      b.innerHTML = `<b>${n}</b><span></span>`;
      b.querySelector("span").textContent = opened[n];
    } else if (!isUnlocked(n)) {
      b.classList.add("locked");
      b.textContent = n;
    } else {
      b.textContent = n;
    }
    b.onclick = () => openDoor(n);
    grid.appendChild(b);
  }
}

function openDoor(n) {
  if (opened[n] === undefined && !isUnlocked(n)) {
    $("sub").textContent = `Tür ${n} lässt sich erst am ${n}. Dezember öffnen.`;
    return;
  }
  current = n;
  $("modalTitle").textContent = `Tür ${n}`;
  const names = config.names.map((e) => e.name);
  drawWheel($("wheel"), names, 0);
  const done = opened[n] !== undefined;
  $("result").textContent = done ? `🎁 ${opened[n]}` : "";
  $("spinBtn").style.display = done ? "none" : "";
  $("spinBtn").disabled = false;
  $("overlay").classList.add("show");
}

async function spin() {
  if (spinning) return;
  spinning = true;
  $("spinBtn").disabled = true;
  const n = current;
  const entries = config.names.filter((e) => e.weight > 0);
  const names = config.names.map((e) => e.name);
  try {
    // Ergebnis zuerst atomar festhalten: existiert die Tür schon, gilt das bestehende Ergebnis.
    const ref = doc(db, "doors", String(n));
    const winner = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) return snap.data().result;
      const result = n === 24 ? config.day24Name : entries[pickWeighted(entries)].name;
      tx.set(ref, { result, openedAt: serverTimestamp() });
      return result;
    });
    let idx = names.indexOf(winner);
    if (idx < 0) { names.push(winner); idx = names.length - 1; }
    await spinTo($("wheel"), names, idx);
    $("result").textContent = `🎁 ${winner}`;
    $("spinBtn").style.display = "none";
  } catch (e) {
    console.error(e);
    $("result").textContent = "Fehler: Tür konnte nicht geöffnet werden.";
    $("spinBtn").disabled = false;
  } finally {
    spinning = false;
    render();
  }
}

$("spinBtn").onclick = spin;
$("closeBtn").onclick = () => { if (!spinning) $("overlay").classList.remove("show"); };

onSnapshot(doc(db, "config", "wheel"), (s) => { config = s.exists() ? s.data() : null; render(); });
onSnapshot(collection(db, "doors"), (s) => {
  Object.keys(opened).forEach((k) => delete opened[k]);
  s.forEach((d) => (opened[Number(d.id)] = d.data().result));
  if (!spinning) render();
});
