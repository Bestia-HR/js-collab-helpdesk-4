import { odswiezWidok } from "./odsiezWidok.js";
import {zamknijFormularz} from "../modules/formularz.js";

function usunZgloszenie(index) {
        zgloszenia.splice(index, 1);
        odswiezWidok();
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

        odswiezWidok();

        document.getElementById("input-temat").value = "";
        document.getElementById("input-klient").value = "";
        zamknijFormularz();
      }