import { Injectable } from '@angular/core';
import { format, parseISO } from "date-fns";

@Injectable({
  providedIn: 'root'
})
export class FormatDateService {
  formatDateToDDMMYYYY(date: string): string {
    const parsedDate = parseISO(date);
    return format(parsedDate, "dd/MM/yyyy");
  }
}
