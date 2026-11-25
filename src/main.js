//finalna wrzutka by Adam
import { DOZWOLONE_STATUSY, validateTickets, utworzNoweZgloszenie } from "./domain.js";

const STORAGE_KEY = "school_helpdesk_tickets";

let zgloszenia = [];
let isImporting = false;

function showMessage(tekst, typ) {
  const box = document.getElementById("komunikat-box");
  box.innerText = tekst;
  box.classList.remove("hidden", "bg-red-100", "text-red-800", "border-red-300", "bg-emerald-100", "text-emerald-800", "border-emerald-300", "bg-amber-100", "text-amber-800", "border-amber-300");

  if (typ === "blad") {
    box.classList.add("bg-red-100", "text-red-800", "border-red-300");
  } else if (typ === "sukces") {
    box.classList.add("bg-emerald-100", "text-emerald-800", "border-emerald-300");
  } else {
    box.classList.add("bg-amber-100", "text-amber-800", "border-amber-300");
  }
}

function wczytajZgloszeniaNaStart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw === null) {
      return [];
    }

    const parsed = JSON.parse(raw);
    const poprawne = validateTickets(parsed);
    return poprawne;
  } catch (blad) {
    showMessage("Błąd odczytu danych z localStorage: " + blad.message, "blad");
    return [];
  }
}

function saveTickets() {
  try {
    const tekstJson = JSON.stringify(zgloszenia);
    localStorage.setItem(STORAGE_KEY, tekstJson);
    return true;
  } catch (blad) {
    showMessage("Błąd zapisu do localStorage (np. brak miejsca lub blokada): " + blad.message, "blad");
    return false;
  }
}

function ustawBlokadeUI(zablokowane) {
  isImporting = zablokowane;

  const btnFetch = document.getElementById("btn-import-fetch");
  const inputPlik = document.getElementById("input-import-plik");
  const labelPlik = document.getElementById("label-import-plik");
  const btnNowe = document.getElementById("btn-nowe-zgloszenie");
  const btnZapisz = document.getElementById("btn-zapisz-formularz");

  btnFetch.disabled = zablokowane;
  inputPlik.disabled = zablokowane;
  btnNowe.disabled = zablokowane;
  btnZapisz.disabled = zablokowane;

  if (zablokowane) {
    btnFetch.classList.add("opacity-50", "cursor-not-allowed");
    labelPlik.classList.add("opacity-50", "cursor-not-allowed");
    btnNowe.classList.add("opacity-50", "cursor-not-allowed");
    btnZapisz.classList.add("opacity-50", "cursor-not-allowed");
  } else {
    btnFetch.classList.remove("opacity-50", "cursor-not-allowed");
    labelPlik.classList.remove("opacity-50", "cursor-not-allowed");
    btnNowe.classList.remove("opacity-50", "cursor-not-allowed");
    btnZapisz.classList.remove("opacity-50", "cursor-not-allowed");
  }

  const wszystkieSelecty = document.querySelectorAll("#tabela-cialo select");
  for (let i = 0; i < wszystkieSelecty.length; i++) {
    wszystkieSelecty[i].disabled = zablokowane;
    if (zablokowane) {
      wszystkieSelecty[i].classList.add("opacity-50", "cursor-not-allowed");
    } else {
      wszystkieSelecty[i].classList.remove("opacity-50", "cursor-not-allowed");
    }
  }

  const wszystkiePrzyciskiUsun = document.querySelectorAll("#tabela-cialo button");
  for (let i = 0; i < wszystkiePrzyciskiUsun.length; i++) {
    wszystkiePrzyciskiUsun[i].disabled = zablokowane;
    if (zablokowane) {
      wszystkiePrzyciskiUsun[i].classList.add("opacity-50", "cursor-not-allowed");
    } else {
      wszystkiePrzyciskiUsun[i].classList.remove("opacity-50", "cursor-not-allowed");
    }
  }
}

function renderTickets() {
  const tbody = document.getElementById("tabela-cialo");
  tbody.innerHTML = "";

  let ileOtwarte = 0;
  let ileWToku = 0;
  let ileRozwiazane = 0;

  const filtr = document.getElementById("filtr-statusu").value;

  for (let i = 0; i < zgloszenia.length; i++) {
    const z = zgloszenia[i];

    if (z.status === "Otwarte") ileOtwarte++;
    if (z.status === "W toku") ileWToku++;
    if (z.status === "Rozwiązane") ileRozwiazane++;

    if (filtr !== "Wszystkie" && z.status !== filtr) {
      continue;
    }

    let kolorStatusu = "bg-slate-100 text-slate-800";
    if (z.status === "W toku") kolorStatusu = "bg-amber-100 text-amber-800";
    if (z.status === "Rozwiązane") kolorStatusu = "bg-emerald-100 text-emerald-800";

    let kolorPriorytetu = "text-slate-600";
    if (z.priorytet === "Średni") kolorPriorytetu = "text-amber-600 font-medium";
    if (z.priorytet === "Wysoki") kolorPriorytetu = "text-orange-600 font-medium";
    if (z.priorytet === "Krytyczny") kolorPriorytetu = "text-red-600 font-bold";

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50";

    const tdId = document.createElement("td");
    tdId.className = "p-4 font-medium text-indigo-600";
    tdId.textContent = z.id;

    const tdTemat = document.createElement("td");
    tdTemat.className = "p-4";
    tdTemat.textContent = z.temat;

    const tdKlient = document.createElement("td");
    tdKlient.className = "p-4 text-slate-600";
    tdKlient.textContent = z.klient;

    const tdStatus = document.createElement("td");
    tdStatus.className = "p-4";

    const selectStatus = document.createElement("select");
    selectStatus.className = kolorStatusu + " text-xs px-2.5 py-1 rounded-full font-medium";
    selectStatus.disabled = isImporting;
    if (isImporting) {
      selectStatus.classList.add("opacity-50", "cursor-not-allowed");
    }

    for (let s = 0; s < DOZWOLONE_STATUSY.length; s++) {
      const opcja = document.createElement("option");
      opcja.value = DOZWOLONE_STATUSY[s];
      opcja.textContent = DOZWOLONE_STATUSY[s];
      if (DOZWOLONE_STATUSY[s] === z.status) {
        opcja.selected = true;
      }
      selectStatus.appendChild(opcja);
    }

    const idZgloszenia = z.id;
    selectStatus.addEventListener("change", function () {
      zmienStatus(idZgloszenia, selectStatus.value);
    });

    tdStatus.appendChild(selectStatus);

    const tdPriorytet = document.createElement("td");
    tdPriorytet.className = "p-4 " + kolorPriorytetu;
    tdPriorytet.textContent = z.priorytet;

    const tdAkcje = document.createElement("td");
    tdAkcje.className = "p-4";

    const btnUsun = document.createElement("button");
    btnUsun.className = "bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium";
    btnUsun.textContent = "Usuń";
    btnUsun.disabled = isImporting;
    if (isImporting) {
      btnUsun.classList.add("opacity-50", "cursor-not-allowed");
    }

    btnUsun.addEventListener("click", function () {
      deleteTicket(idZgloszenia);
    });

    tdAkcje.appendChild(btnUsun);

    tr.appendChild(tdId);
    tr.appendChild(tdTemat);
    tr.appendChild(tdKlient);
    tr.appendChild(tdStatus);
    tr.appendChild(tdPriorytet);
    tr.appendChild(tdAkcje);

    tbody.appendChild(tr);
  }

  document.getElementById("licznik-otwarte").innerText = ileOtwarte;
  document.getElementById("licznik-w-toku").innerText = ileWToku;
  document.getElementById("licznik-rozwiazane").innerText = ileRozwiazane;
}

async function importFrom(funkcjaPobierajacaTekst) {
  if (isImporting) {
    return;
  }

  const zgoda = confirm("Czy na pewno chcesz zaimportować nowe zgłoszenia? Zastąpią one obecną listę.");
  if (!zgoda) {
    showMessage("Import został anulowany przez użytkownika.", "info");
    return;
  }

  ustawBlokadeUI(true);
  showMessage("Trwa importowanie danych, proszę czekać...", "info");

  try {
    const tekst = await funkcjaPobierajacaTekst();

    let suroweDane;
    try {
      suroweDane = JSON.parse(tekst);
    } catch (e) {
      throw new Error("Plik nie jest poprawnym formatem JSON!");
    }

    const zwalidowanaLista = validateTickets(suroweDane);

    zgloszenia = zwalidowanaLista;
    saveTickets();
    renderTickets();
    showMessage("Import zakończony sukcesem! Załadowano zgłoszeń: " + zgloszenia.length, "sukces");
  } catch (blad) {
    showMessage("Błąd importu: " + blad.message, "blad");
  } finally {
    ustawBlokadeUI(false);
  }
}

async function fetchServerText() {
  const response = await fetch("./tickets.json");

  if (!response.ok) {
    throw new Error("Błąd serwera HTTP: " + response.status);
  }

  const tekst = await response.text();
  return tekst;
}

async function pobierzTekstZPliku(plik) {
  const tekst = await plik.text();
  return tekst;
}

function znajdzIndeksPoId(id) {
  for (let i = 0; i < zgloszenia.length; i++) {
    if (zgloszenia[i].id === id) {
      return i;
    }
  }
  return -1;
}

function zmienStatus(id, nowyStatus) {
  if (isImporting) return;

  let poprawnyStatus = false;
  for (let s = 0; s < DOZWOLONE_STATUSY.length; s++) {
    if (DOZWOLONE_STATUSY[s] === nowyStatus) {
      poprawnyStatus = true;
    }
  }
  if (!poprawnyStatus) {
    showMessage("Nieznany status: " + nowyStatus, "blad");
    renderTickets();
    return;
  }

  const indeks = znajdzIndeksPoId(id);
  if (indeks === -1) {
    showMessage("Nie znaleziono zgłoszenia o ID: " + id, "blad");
    return;
  }

  zgloszenia[indeks].status = nowyStatus;
  saveTickets();
  renderTickets();
}

function deleteTicket(id) {
  if (isImporting) return;

  const indeks = znajdzIndeksPoId(id);
  if (indeks === -1) {
    showMessage("Nie znaleziono zgłoszenia o ID: " + id, "blad");
    return;
  }

  zgloszenia.splice(indeks, 1);
  saveTickets();
  renderTickets();
}

function otworzFormularz() {
  if (isImporting) return;
  document.getElementById("panel-dodawania").classList.remove("hidden");
}

function closeForm() {
  document.getElementById("panel-dodawania").classList.add("hidden");
}

function dodajZgloszenie() {
  if (isImporting) return;

  const temat = document.getElementById("input-temat").value;
  const klient = document.getElementById("input-klient").value;
  const status = document.getElementById("input-status").value;
  const priorytet = document.getElementById("input-priorytet").value;

  try {
    const nowe = utworzNoweZgloszenie(zgloszenia, temat, klient, status, priorytet);
    zgloszenia.unshift(nowe);
    saveTickets();
    renderTickets();

    document.getElementById("input-temat").value = "";
    document.getElementById("input-klient").value = "";
    closeForm();
    showMessage("Dodano nowe zgłoszenie: " + nowe.id, "sukces");
  } catch (blad) {
    alert(blad.message);
  }
}

window.addEventListener("DOMContentLoaded", function () {
  zgloszenia = wczytajZgloszeniaNaStart();
  renderTickets();
  lucide.createIcons();

  document.getElementById("btn-nowe-zgloszenie").addEventListener("click", otworzFormularz);
  document.getElementById("btn-anuluj-formularz").addEventListener("click", closeForm);
  document.getElementById("btn-zapisz-formularz").addEventListener("click", dodajZgloszenie);
  document.getElementById("filtr-statusu").addEventListener("change", renderTickets);

  document.getElementById("btn-import-fetch").addEventListener("click", function () {
    importFrom(fetchServerText);
  });

  document.getElementById("input-import-plik").addEventListener("change", function (event) {
    const pliki = event.target.files;
    if (!pliki || pliki.length === 0) {
      return;
    }

    const wybranyPlik = pliki[0];
    event.target.value = "";

    importFrom(function () {
      return pobierzTekstZPliku(wybranyPlik);
    });
  });
});