import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "truncate",
  standalone: true 
})
export class TruncatePipe implements PipeTransform {

  transform(value: string | null | undefined, limit: number = 24, ellipsis: string = "..."): string {
    if (value === null || value === undefined) {
      return "";
    }
    const strValue = String(value); 

    if (strValue.length > limit) {
      return strValue.slice(0, limit) + ellipsis;
    }

    return strValue;
  }
}
