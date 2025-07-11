import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort'
})
export class SortPipe implements PipeTransform {

  transform(value: any[], field: string, order: 'asc' | 'desc' = 'asc'): any[] {
    if (!value || value.length === 0 || !field) {
      return value;
    }

    const sortedValue = [...value];

    sortedValue.sort((a, b) => {
      const fieldA = typeof a[field] === 'string' ? a[field].toLowerCase() : a[field];
      const fieldB = typeof b[field] === 'string' ? b[field].toLowerCase() : b[field];

      if (fieldA < fieldB) {
        return order === 'asc' ? -1 : 1;
      }

      if (fieldA > fieldB) {
        return order === 'asc' ? 1 : -1;
      }

      return 0;
    });

    return sortedValue;
  }
}
