import { db, auth } from "./firebase.js";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const $ = (id) => document.getElementById(id);
let names = [];

function say(el, text, bad) { $(el).textContent = text; $(el).style.color = bad ? "#ff8a80" : "#9be7a8"; }

function renderRows() {
  const total = names.reduce((s, e) => s + (Number(e.weight) || 0), 0);
  $("rows").innerHTML = "";
  names.forEach((e, i) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<input class="name" placeholder="Name"><input class="weight" type="number" min="0" step="any"><span class="pct"></span><button class="btn danger" title="Entfernen">✕</button>`;
    const [n, w, , del] = row.children;
    row.querySelector(".pct").textContent = total ? ((e.weight / total) * 100).toFixed(1) + " %" : "–";
    n.value = e.name; w.value = e.weight;
    n.oninput = () => { e.name = n.value; renderDay24(); };
    w.oninput = () => { e.weight = Number(w.value) || 0; updatePct(); };
    del.onclick = () => { names.splice(i, 1); renderRows(); renderDay24(); };
    $("rows").appendChild(row);
  });
}
function updatePct() {
  const total = names.reduce((s, e) => s + (Number(e.weight) || 0), 0);
  document.querySelectorAll("#rows .pct").forEach((el, i) => {
    el.textContent = total ? ((names[i].weight / total) * 100).toFixed(1) + " %" : "–";
  });
}
function renderDay24(selected) {
  const sel = $("day24");
  const keep = selected ?? sel.value;
  sel.innerHTML = "";
  names.filter((e) => e.name.trim()).forEach((e) => {
    const o = document.createElement("option");
    o.value = o.textContent = e.name.trim();
    sel.appendChild(o);
  });
  sel.value = keep;
}

async function load() {
  const s = await getDoc(doc(db, "config", "wheel"));
  const c = s.exists() ? s.data() : {};
  names = (c.names || []).map((e) => ({ name: e.name, weight: e.weight }));
  $("year").value = c.year || new Date().getFullYear();
  $("testMode").checked = !!c.testMode;
  renderRows();
  renderDay24(c.day24Name);
  loadDoors();
}
async function loadDoors() {
  const s = await getDocs(collection(db, "doors"));
  const list = [];
  s.forEach((d) => list.push([Number(d.id), d.data().result]));
  list.sort((a, b) => a[0] - b[0]);
  $("doorState").textContent = list.length ? "Geöffnet: " + list.map(([n, r]) => `${n} → ${r}`).join(", ") : "Noch keine Tür geöffnet.";
}

$("addBtn").onclick = () => { names.push({ name: "", weight: 1 }); renderRows(); };

$("saveBtn").onclick = async () => {
  const clean = names.map((e) => ({ name: e.name.trim(), weight: Number(e.weight) || 0 })).filter((e) => e.name);
  const unique = new Set(clean.map((e) => e.name));
  if (clean.length < 2) return say("status", "Mindestens 2 Namen nötig.", true);
  if (unique.size !== clean.length) return say("status", "Namen müssen eindeutig sein.", true);
  if (!clean.some((e) => e.weight > 0)) return say("status", "Mindestens ein Gewicht muss > 0 sein.", true);
  const day24Name = $("day24").value;
  if (!unique.has(day24Name)) return say("status", "Bitte einen Namen für Tür 24 wählen.", true);
  try {
    await setDoc(doc(db, "config", "wheel"), {
      names: clean, day24Name, year: Number($("year").value), testMode: $("testMode").checked
    });
    names = clean; renderRows(); renderDay24(day24Name);
    say("status", "Gespeichert ✓");
  } catch (e) { say("status", "Fehler: " + e.message, true); }
};

$("resetOne").onclick = async () => {
  const n = Number($("resetNum").value);
  if (!(n >= 1 && n <= 24)) return say("status", "Türnummer 1–24 angeben.", true);
  if (!confirm(`Tür ${n} wirklich zurücksetzen?`)) return;
  await deleteDoc(doc(db, "doors", String(n)));
  say("status", `Tür ${n} zurückgesetzt.`); loadDoors();
};
$("resetAll").onclick = async () => {
  if (!confirm("ALLE Türen wirklich zurücksetzen?")) return;
  const s = await getDocs(collection(db, "doors"));
  await Promise.all(s.docs.map((d) => deleteDoc(d.ref)));
  say("status", "Alle Türen zurückgesetzt."); loadDoors();
};

$("loginBtn").onclick = async () => {
  try { await signInWithEmailAndPassword(auth, $("email").value, $("pw").value); }
  catch (e) { say("loginStatus", "Anmeldung fehlgeschlagen.", true); }
};
$("logoutBtn").onclick = () => signOut(auth);
onAuthStateChanged(auth, (u) => {
  $("login").style.display = u ? "none" : "";
  $("editor").style.display = u ? "" : "none";
  if (u) load();
});
