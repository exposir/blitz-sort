/**
 * blitz-sort - Ultra-fast sorting library for JavaScript
 */

export interface SortOptions<T> {
  /**
   * Key extraction function for object sorting
   */
  by?: (item: T) => string | number;

  /**
   * Sort in descending order
   * @default false
   */
  descending?: boolean;
}

/**
 * Main sorting function - auto-detects array type and applies optimal algorithm
 * @param arr Array to sort (mutates in place)
 * @param options Sorting options
 * @returns The sorted array
 */
export function ultraSort<T>(arr: T[], options?: SortOptions<T>): T[];
export function ultraSort(arr: Uint32Array, options?: { descending?: boolean }): Uint32Array;
export function ultraSort(arr: Int32Array, options?: { descending?: boolean }): Int32Array;
export function ultraSort(arr: Float64Array, options?: { descending?: boolean }): Float64Array;
export function ultraSort(arr: Float32Array, options?: { descending?: boolean }): Float32Array;

/**
 * Optimized sorting for Uint32Array
 * Uses insertion sort, counting sort, or radix sort based on data characteristics
 * @param arr Uint32Array to sort (mutates in place)
 * @returns The sorted array
 */
export function sortUint32(arr: Uint32Array): Uint32Array;

/**
 * Optimized sorting for Float64Array
 * Includes pattern detection for sorted/reversed arrays
 * @param arr Float64Array to sort (mutates in place)
 * @returns The sorted array
 */
export function sortFloat64(arr: Float64Array): Float64Array;

/**
 * Optimized string sorting
 * Uses insertion sort for small arrays, MSD radix sort for large arrays
 * @param arr String array to sort (mutates in place)
 * @returns The sorted array
 */
export function sortStrings(arr: string[]): string[];

/**
 * Object sorting using Schwartzian transform
 * @param arr Object array to sort (mutates in place)
 * @param keyFn Key extraction function
 * @returns The sorted array
 */
export function sortObjects<T>(arr: T[], keyFn: (item: T) => string | number): T[];
