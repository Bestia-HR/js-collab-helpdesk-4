(function () {
  const STATUSY = ["Otwarte", "W toku", "Rozwiązane"];
  const PRIORYTETY = ["Niski", "Średni", "Wysoki", "Krytyczny"];
  const LIMIT = 500;
  const URL_JSON = "./dane.json";

  let busy = false;

  function walidujZgloszenia(raw) {
    if (!Array.isArray(raw)) throw Error("Dane muszą być tablicą zgłoszeń");
    if (raw.length > LIMIT) throw Error(`Za dużo zgłoszeń (max ${LIMIT})`);

    const wynik = raw.map((r, i) => {
      const nr = `Rekord ${i + 1}`;
      if (typeof r !== "object" || r === null || Array.isArray(r)) throw Error(`${nr}: to nie jest obiekt`);
      for (const pole of ["id", "temat", "klient", "status", "priorytet"]) {
        if (typeof r[pole] !== "string" || r[pole].trim() === "") throw Error(`${nr}: brak pola "${pole}"`);
        if (/[<>]/.test(r[pole])) throw Error(`${nr}: niedozwolone znaki < > w polu "${pole}"`);
      }
      if (!STATUSY.includes(r.status)) throw Error(`${nr}: zły status "${r.status}"`);
      if (!PRIORYTETY.includes(r.priorytet)) throw Error(`${nr}: zły priorytet "${r.priorytet}"`);
      return { id: r.id.trim(), temat: r.temat.trim(), klient: r.klient.trim(), status: r.status, priorytet: r.priorytet };
    });

    if (new Set(wynik.map(z => z.id)).size !== wynik.length) throw Error("Duplikaty ID w danych");
    return wynik;
  }

  function parseJson(tekst) {
    try { return JSON.parse(tekst); }
    catch { throw Error("To nie jest poprawny JSON (np. HTML zamiast JSON)"); }
  }

  async function wczytajZSerwera() {
    const response = await fetch(URL_JSON);
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    return parseJson(await response.text());
  }

  async function wczytajZPliku(plik) {
    return parseJson(await plik.text());
  }

  async function importFrom(load, opis) {
    if (busy) return;
    ustawBusy(true);
    komunikat(`Importuję: ${opis}…`, "info");
    try {
      const raw = await load();
      const nowe = walidujZgloszenia(raw);
      if (!confirm(`Zastąpić obecną listę (${zgloszenia.length}) importowaną (${nowe.length})?`)) {
        komunikat("Import anulowany – lista bez zmian.", "info");
        return;
      }
      zgloszenia = nowe;
      odswiezWidok();
      komunikat(`Zaimportowano ${nowe.length} zgłoszeń.`, "ok");
    } catch (e) {
      komunikat(`Błąd importu: ${e.message}. Poprzednia lista zachowana.`, "blad");
    } finally {
      ustawBusy(false);
    }
  }

  function idb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("helpdesk-eksport", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("uchwyty");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function pobierzUchwyt() {
    const db = await idb();
    return new Promise((resolve, reject) => {
      const r = db.transaction("uchwyty").objectStore("uchwyty").get("dane");
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  }
  async function zapamietajUchwyt(uchwyt) {
    const db = await idb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("uchwyty", "readwrite");
      tx.objectStore("uchwyty").put(uchwyt, "dane");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function uchwytDoZapisu() {
    let uchwyt = null;
    try { uchwyt = await pobierzUchwyt(); } catch { }

    if (uchwyt) {
      let zgoda = await uchwyt.queryPermission({ mode: "readwrite" });
      if (zgoda !== "granted") zgoda = await uchwyt.requestPermission({ mode: "readwrite" });
      if (zgoda === "granted") return uchwyt;
    }

    [uchwyt] = await window.showOpenFilePicker({
      types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
      multiple: false
    });
    if (await uchwyt.requestPermission({ mode: "readwrite" }) !== "granted") throw Error("Brak zgody na zapis do pliku");
    try { await zapamietajUchwyt(uchwyt); } catch { }
    return uchwyt;
  }

  function pobierzJakoPlik(tekst) {
    const blob = new Blob([tekst], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dane.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function eksportujJson() {
    const tekst = JSON.stringify(zgloszenia, null, 2);
    try {
      if ("showOpenFilePicker" in window) {
        const uchwyt = await uchwytDoZapisu();
        const strumien = await uchwyt.createWritable();
        try { await strumien.write(tekst); }
        finally { await strumien.close(); }
        komunikat(`Zapisano ${zgloszenia.length} zgłoszeń w pliku ${uchwyt.name}.`, "ok");
      } else {
        pobierzJakoPlik(tekst);
        komunikat(`Pobrano dane.json (${zgloszenia.length} zgłoszeń). Podmień nim plik w folderze projektu.`, "ok");
      }
    } catch (e) {
      if (e.name === "AbortError") { komunikat("Eksport anulowany.", "info"); return; }
      komunikat(`Błąd zapisu pliku: ${e.message}`, "blad");
    }
  }

  const KOLORY = {
    info: "bg-slate-100 text-slate-700", ok: "bg-emerald-100 text-emerald-800",
    blad: "bg-red-100 text-red-800"
  };

  function komunikat(tekst, typ) {
    const el = document.getElementById("import-komunikat");
    el.className = `p-3 rounded-lg text-sm ${KOLORY[typ]}`;
    el.textContent = tekst;
  }

  function zablokujEdycje() {
    document.querySelectorAll("main button, main select, main input").forEach(el => {
      if (el.id === "btn-eksport") return;
      el.disabled = busy;
    });
  }

  function ustawBusy(v) {
    busy = v;
    zablokujEdycje();
  }

  function podepnijPrzyciski() {
    const input = document.getElementById("plik-import");

    document.getElementById("btn-import-serwer").addEventListener("click", () => importFrom(wczytajZSerwera, URL_JSON));
    document.getElementById("btn-import-plik").addEventListener("click", () => input.click());
    document.getElementById("btn-eksport").addEventListener("click", eksportujJson);

    input.addEventListener("change", async () => {
      const plik = input.files[0];
      if (!plik) return;
      await importFrom(() => wczytajZPliku(plik), plik.name);
      input.value = "";
    });
  }

  function owinBlokadą(nazwa) {
    const oryginal = window[nazwa];
    window[nazwa] = function (...args) {
      if (busy) return;
      return oryginal.apply(this, args);
    };
  }
  ["zmienStatus", "usunZgloszenie", "dodajZgloszenie", "otworzFormularz"].forEach(owinBlokadą);

  const oryginalOdswiez = window.odswiezWidok;
  window.odswiezWidok = function (...args) {
    const wynik = oryginalOdswiez.apply(this, args);
    zablokujEdycje();
    return wynik;
  };

  podepnijPrzyciski();
})();
