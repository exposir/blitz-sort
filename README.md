# blitz-sort

English | [简体中文](./README_ZH.md)

Ultra-fast sorting library for JavaScript. **Up to 159x faster**, averaging **19.9x** speedup over V8's native `.sort()`.

Achieves superior performance through type-specific algorithms (radix sort, counting sort, pattern detection, etc.).

## Features

- **Multi-type support**: Uint32, Float64, strings, and objects
- **Adaptive algorithms**: Automatically selects the best algorithm based on data size and distribution
- **Pattern detection**: Instant handling of sorted/reversed arrays
- **Zero dependencies**: Pure JavaScript, no external dependencies
- **In-place sorting**: Minimal memory overhead

## Installation

```bash
npm install blitz-sort
```

## Usage

```javascript
const { ultraSort, sortUint32, sortFloat64, sortStrings, sortObjects } = require('blitz-sort');

// Integer arrays
const integers = new Uint32Array([3, 1, 4, 1, 5, 9, 2, 6]);
ultraSort(integers);
// => Uint32Array [1, 1, 2, 3, 4, 5, 6, 9]

// Float arrays
const floats = new Float64Array([3.14, -2.71, 1.41, -0.5]);
ultraSort(floats);
// => Float64Array [-2.71, -0.5, 1.41, 3.14]

// String arrays
const strings = ['banana', 'apple', 'cherry', 'date'];
ultraSort(strings);
// => ['apple', 'banana', 'cherry', 'date']

// Object arrays with key function
const users = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 35 }
];
ultraSort(users, { by: u => u.age });
// => [{ name: 'Bob', age: 25 }, { name: 'Alice', age: 30 }, { name: 'Charlie', age: 35 }]

// Descending order
ultraSort(integers, { descending: true });
// => Uint32Array [9, 6, 5, 4, 3, 2, 1, 1]
```

## API

### `ultraSort(arr, options?)`

Main sorting function that auto-detects array type and applies the optimal algorithm.

**Parameters:**
- `arr` - Array to sort (mutates in place)
- `options.by` - Key extraction function for object sorting
- `options.descending` - Sort in descending order (default: `false`)

**Returns:** The sorted array

### `sortUint32(arr)`

Optimized sorting for `Uint32Array`. Uses:
- Insertion sort for n ≤ 32
- Counting sort for dense integer ranges
- Radix sort for large arrays (n ≥ 5000)

### `sortFloat64(arr)`

Optimized sorting for `Float64Array`. Includes pattern detection for sorted/reversed arrays.

### `sortStrings(arr)`

Optimized string sorting. Uses:
- Insertion sort for n ≤ 32
- MSD Radix sort for large arrays (n ≥ 1000)

### `sortObjects(arr, keyFn)`

Object sorting using Schwartzian transform for string keys to avoid redundant key computation.

## Algorithm Selection

| Data Type | Size | Algorithm |
|-----------|------|-----------|
| Uint32 | n ≤ 32 | Insertion Sort |
| Uint32 | 33-256 | V8 Native |
| Uint32 | Dense range | Counting Sort |
| Uint32 | n ≥ 5000 | LSD Radix Sort |
| Float64 | All | Pattern Detection + V8 Native |
| String | n ≤ 32 | Insertion Sort |
| String | n ≥ 1000 | MSD Radix Sort |
| Object | Numeric key | V8 Native |
| Object | String key | Schwartzian Transform |

## Performance

Benchmarks comparing blitz-sort vs V8 native `.sort()`:

### Integer (Uint32Array)

| Test Case | 10K | 100K | 1M |
|-----------|-----|------|-----|
| Dense integers | 4.9x | 14.2x | 17.0x |
| Sparse integers | 1.8x | 14.7x | 15.7x |
| Already sorted | 4.0x | 63.7x | 73.2x |
| Reversed | 2.2x | 40.1x | 50.4x |
| Many duplicates | 32.3x | 39.8x | 52.3x |

### Float (Float64Array)

| Test Case | 10K | 100K | 1M |
|-----------|-----|------|-----|
| Random floats | 1.0x | 1.0x | 1.0x |
| Already sorted | 6.0x | 149.6x | 159.4x |
| Mixed pos/neg | 1.0x | 1.0x | 1.0x |

### String

| Test Case | 10K | 50K | 100K |
|-----------|-----|-----|------|
| Random strings | 2.4x | 3.0x | 3.6x |
| Already sorted | 0.8x | 2.6x | 2.7x |
| Common prefix | 1.1x | 1.2x | 1.4x |

### Object

| Test Case | 10K | 50K | 100K |
|-----------|-----|-----|------|
| By numeric field | 1.1x | 1.1x | 1.2x |
| By string field | 1.4x | 1.4x | 2.1x |

**Average speedup: 19.9x**

*Run `npm run benchmark` to see results on your machine.*

## How It Works

### Pattern Detection

Before sorting, the library samples the first 32 elements to detect:
- **Sorted arrays**: Return immediately
- **Reversed arrays**: Simple O(n) reverse operation
- **Random arrays**: Apply full sorting algorithm

### Radix Sort for Integers

For large integer arrays, LSD (Least Significant Digit) radix sort processes numbers byte-by-byte, achieving O(n) time complexity for bounded integers.

### MSD Radix Sort for Strings

For large string arrays, MSD (Most Significant Digit) radix sort groups strings by character position, recursively sorting each bucket.

### Schwartzian Transform for Objects

When sorting objects by a string key, pre-computes all keys once to avoid redundant `keyFn` calls during comparisons.

## Requirements

- Node.js >= 14.0.0
- Uses `BigUint64Array` for float-to-int conversion

## License

MIT
