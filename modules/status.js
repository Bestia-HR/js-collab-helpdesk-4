 import { odswiezWidok } from "./odsiezWidok.js";
 export function zmienStatus(index, nowyStatus) {
        zgloszenia[index].status = nowyStatus;
        odswiezWidok();
      }