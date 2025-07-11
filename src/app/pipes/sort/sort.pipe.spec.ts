import { SortPipe } from './sort.pipe';

describe('SortPipe', () => {
  let pipe: SortPipe;

  beforeEach(() => {
    pipe = new SortPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should sort an array of objects by a string field in ascending order', () => {
    const data = [{ name: 'Bob' }, { name: 'Alice' }, { name: 'Charlie' }];
    const expected = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }];
    expect(pipe.transform(data, 'name', 'asc')).toEqual(expected);
  });

  it('should sort an array of objects by a string field in descending order', () => {
    const data = [{ name: 'Bob' }, { name: 'Alice' }, { name: 'Charlie' }];
    const expected = [{ name: 'Charlie' }, { name: 'Bob' }, { name: 'Alice' }];
    expect(pipe.transform(data, 'name', 'desc')).toEqual(expected);
  });

  it('should sort an array of objects by a number field in ascending order', () => {
    const data = [{ age: 30 }, { age: 20 }, { age: 40 }];
    const expected = [{ age: 20 }, { age: 30 }, { age: 40 }];
    expect(pipe.transform(data, 'age', 'asc')).toEqual(expected);
  });

  it('should sort an array of objects by a number field in descending order', () => {
    const data = [{ age: 30 }, { age: 20 }, { age: 40 }];
    const expected = [{ age: 40 }, { age: 30 }, { age: 20 }];
    expect(pipe.transform(data, 'age', 'desc')).toEqual(expected);
  });

  it('should handle mixed case strings correctly (case-insensitive)', () => {
    const data = [{ name: 'apple' }, { name: 'Banana' }, { name: 'Cherry' }];
    const expectedAsc = [{ name: 'apple' }, { name: 'Banana' }, { name: 'Cherry' }];
    const expectedDesc = [{ name: 'Cherry' }, { name: 'Banana' }, { name: 'apple' }];
    expect(pipe.transform(data, 'name', 'asc')).toEqual(expectedAsc);
    expect(pipe.transform(data, 'name', 'desc')).toEqual(expectedDesc);
  });

  it('should not modify the original array', () => {
    const originalData = [{ id: 1, name: 'B' }, { id: 2, name: 'A' }];
    const dataCopy = [...originalData];
    pipe.transform(originalData, 'name', 'asc');
    expect(originalData).toEqual(dataCopy);
  });

  it('should use "asc" as default order if not provided', () => {
    const data = [{ name: 'Bob' }, { name: 'Alice' }];
    const expected = [{ name: 'Alice' }, { name: 'Bob' }];
    expect(pipe.transform(data, 'name')).toEqual(expected);
  });
});
