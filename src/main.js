const STORAGE_KEY = 'school_helpdesk_tickets';

const domyslneZgloszenia = [
  { id: "#TK-1092", temat: "Nie działa resetowanie hasła", klient: "Jan Kowalski", status: "W toku", priorytet: "Wysoki" },
  { id: "#TK-1091", temat: "Błąd płatności kartą", klient: "Anna Nowak", status: "Rozwiązane", priorytet: "Średni" },
  { id: "#TK-1090", temat: "Problem z logowaniem", klient: "Piotr Zieliński", status: "Otwarte", priorytet: "Krytyczny" }
];

function wczytajZgloszenia() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return domyslneZgloszenia;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed;
  } catch (e) {
    alert("Błąd odczytu danych");
    return domyslneZgloszenia;
  }
}

let zgloszenia = wczytajZgloszenia();

function zapiszZgloszenia() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(zgloszenia));
  } catch (e) {
    alert("Błąd zapisu danych");
  }
}

function odswiezWidok() {
  let tbody = document.getElementById("tabela-cialo");
  tbody.innerHTML = ""; 

  let ileOtwarte = 0;
  let ileWToku = 0;
  let ileRozwiazane = 0;

  let filtr = document.getElementById("filtr-statusu").value;

  for(let i=0; i<zgloszenia.length; i++){
    let z = zgloszenia[i];
    if(filtr !== "Wszystkie" && z.status !== filtr) {
      continue;
    }

    if (z.status === "Otwarte") ileOtwarte++;
    if (z.status === "W toku") ileWToku++;
    if (z.status === "Rozwiązane") ileRozwiazane++;

    let kolorStatusu = "bg-slate-100 text-slate-800";
    if (z.status === "W toku") kolorStatusu = "bg-amber-100 text-amber-800";
    if (z.status === "Rozwiązane") kolorStatusu = "bg-emerald-100 text-emerald-800";

    let kolorPriorytetu = "text-slate-600";
    if (z.priorytet === "Średni") kolorPriorytetu = "text-amber-600 font-medium";
    if (z.priorytet === "Wysoki") kolorPriorytetu = "text-orange-600 font-medium";
    if (z.priorytet === "Krytyczny") kolorPriorytetu = "text-red-600 font-bold";

    let wiersz = `
      <tr class="hover:bg-slate-50">
        <td class="p-4 font-medium text-indigo-600">${z.id}</td>
        <td class="p-4">${z.temat}</td>
        <td class="p-4 text-slate-600">${z.klient}</td>
        <td class="p-4">
          <select onchange="window.zmienStatus(${i}, this.value)" class="${kolorStatusu} text-xs px-2.5 py-1 rounded-full font-medium">
            <option value="Otwarte" ${z.status === "Otwarte" ? "selected" : ""}>Otwarte</option>
            <option value="W toku" ${z.status === "W toku" ? "selected" : ""}>W toku</option>
            <option value="Rozwiązane" ${z.status === "Rozwiązane" ? "selected" : ""}>Rozwiązane</option>
          </select>
        </td>
        <td class="p-4 ${kolorPriorytetu}">${z.priorytet}</td>
        <td class="p-4"><button onclick="window.usunZgloszenie(${i})" class="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Usuń</button></td>
      </tr>
    `;
    tbody.innerHTML += wiersz;
  }

  document.getElementById("licznik-otwarte").innerText = ileOtwarte;
  document.getElementById("licznik-w-toku").innerText = ileWToku;
  document.getElementById("licznik-rozwiazane").innerText = ileRozwiazane;
}

function zmienStatus(index, nowyStatus) {
  zgloszenia[index].status = nowyStatus;
  zapiszZgloszenia();
  odswiezWidok();
}

function usunZgloszenie(index) {
  zgloszenia.splice(index, 1);
  zapiszZgloszenia();
  odswiezWidok();
}

function otworzFormularz() {
  document.getElementById("panel-dodawania").classList.remove("hidden");
}

function zamknijFormularz() {
  document.getElementById("panel-dodawania").classList.add("hidden");
}

function dodajZgloszenie() {
  let temat = document.getElementById("input-temat").value;
  let klient = document.getElementById("input-klient").value;
  let status = document.getElementById("input-status").value;
  let priorytet = document.getElementById("input-priorytet").value;

  if (temat === "" || klient === "") {
    alert("Wypełnij temat i klienta!");
    return;
  }

  let nowe = {
    id: "#TK-" + (1090 + zgloszenia.length + 1),
    temat: temat,
    klient: klient,
    status: status,
    priorytet: priorytet
  };

  zgloszenia.unshift(nowe);
  zapiszZgloszenia();
  odswiezWidok();

  document.getElementById("input-temat").value = "";
  document.getElementById("input-klient").value = "";
  zamknijFormularz();
}

window.zmienStatus = zmienStatus;
window.usunZgloszenie = usunZgloszenie;
window.otworzFormularz = otworzFormularz;
window.zamknijFormularz = zamknijFormularz;
window.dodajZgloszenie = dodajZgloszenie;
window.odswiezWidok = odswiezWidok;

window.onload = function() {
  odswiezWidok();
  lucide.createIcons();
};