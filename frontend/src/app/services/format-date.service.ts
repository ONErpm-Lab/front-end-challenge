import { Injectable } from '@angular/core';
import { format, parseISO } from "date-fns";

@Injectable({
  providedIn: 'root'
})
export class FormatDateService {
  formatDateToDDMMYY(date: string): string {
    const parsedDate = parseISO(date);
    return format(parsedDate, "dd/MM/yy");
  }
}
