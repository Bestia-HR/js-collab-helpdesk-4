import { odswiezWidok } from "../modules/odsiezWidok.js";


let zgloszenia = [
        { id: "#TK-1092", temat: "Nie działa resetowanie hasła", klient: "Jan Kowalski", status: "W toku", priorytet: "Wysoki" },
        { id: "#TK-1091", temat: "Błąd płatności kartą", klient: "Anna Nowak", status: "Rozwiązane", priorytet: "Średni" },
        { id: "#TK-1090", temat: "Problem z logowaniem", klient: "Piotr Zieliński", status: "Otwarte", priorytet: "Krytyczny" }
      ];

      
      window.onload = function() {
        odswiezWidok();
        lucide.createIcons();
      };
export default zgloszenia;