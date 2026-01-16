/**
 * blitz-sort benchmark
 * Run: npx tsx benchmark/run.ts
 */

import { ultraSort, sortUint32, sortFloat64, sortStrings } from '../src/index';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           blitz-sort Benchmark                                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// ============================================================
//  测试数据生成
// ============================================================

type TestType =
  | 'uint32_dense'
  | 'uint32_sparse'
  | 'uint32_sorted'
  | 'uint32_reversed'
  | 'uint32_duplicates'
  | 'float64_random'
  | 'float64_sorted'
  | 'float64_mixed'
  | 'string_random'
  | 'string_sorted'
  | 'string_common_prefix'
  | 'object_by_number'
  | 'object_by_string';

interface TestObject {
  id: number;
  name: string;
}

function generateTestData(type: TestType, size: number): Uint32Array | Float64Array | string[] | TestObject[] {
  switch (type) {
    case 'uint32_dense':
      return new Uint32Array(size).map(() => (Math.random() * size) >>> 0);
    case 'uint32_sparse':
      return new Uint32Array(size).map(() => (Math.random() * size * 100) >>> 0);
    case 'uint32_sorted':
      return new Uint32Array(size).map((_, i) => i);
    case 'uint32_reversed':
      return new Uint32Array(size).map((_, i) => size - i);
    case 'uint32_duplicates': {
      const unique = Math.max(10, Math.floor(Math.sqrt(size)));
      return new Uint32Array(size).map(() => (Math.random() * unique) >>> 0);
    }

    case 'float64_random':
      return new Float64Array(size).map(() => Math.random() * 1000000 - 500000);
    case 'float64_sorted':
      return new Float64Array(size).map((_, i) => i * 0.1);
    case 'float64_mixed':
      return new Float64Array(size).map(() => (Math.random() - 0.5) * Number.MAX_SAFE_INTEGER);

    case 'string_random': {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      return Array.from({ length: size }, () => {
        const len = 5 + Math.floor(Math.random() * 15);
        let s = '';
        for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * 26)];
        return s;
      });
    }
    case 'string_sorted':
      return Array.from({ length: size }, (_, i) => String(i).padStart(10, '0'));
    case 'string_common_prefix':
      return Array.from({ length: size }, () => 'prefix_' + Math.random().toString(36).slice(2, 12));

    case 'object_by_number':
      return Array.from({ length: size }, () => ({
        id: Math.floor(Math.random() * size * 10),
        name: 'item_' + Math.random().toString(36).slice(2, 8),
      }));
    case 'object_by_string':
      return Array.from({ length: size }, () => ({
        id: Math.floor(Math.random() * size),
        name: Math.random().toString(36).slice(2, 12),
      }));

    default:
      return [];
  }
}

// ============================================================
//  Benchmark 工具
// ============================================================

function benchmark<T extends Uint32Array | Float64Array | string[] | TestObject[]>(
  fn: (a: T) => void,
  arr: T,
  runs = 5
): number {
  // Warmup
  const warmup = (arr instanceof Uint32Array || arr instanceof Float64Array)
    ? arr.slice() as T
    : [...arr] as T;
  fn(warmup);

  let total = 0;
  for (let i = 0; i < runs; i++) {
    const copy = (arr instanceof Uint32Array || arr instanceof Float64Array)
      ? arr.slice() as T
      : [...arr] as T;
    const start = performance.now();
    fn(copy);
    total += performance.now() - start;
  }
  return total / runs;
}

function verify<T>(arr: T[], compareFn?: (a: T, b: T) => number): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (compareFn) {
      if (compareFn(arr[i - 1], arr[i]) > 0) return false;
    } else {
      if (arr[i] < arr[i - 1]) return false;
    }
  }
  return true;
}

function verifyTyped(arr: Uint32Array | Float64Array): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] < arr[i - 1]) return false;
  }
  return true;
}

function formatTime(ms: number): string {
  return ms < 1 ? `${(ms * 1000).toFixed(0)}μs` : `${ms.toFixed(1)}ms`;
}

function formatSize(size: number): string {
  return size >= 1000000 ? `${size / 1000000}M` : `${size / 1000}K`;
}

// ============================================================
//  运行测试
// ============================================================

const SIZES = [10000, 100000, 1000000];
const STRING_SIZES = [10000, 50000, 100000];
const OBJ_SIZES = [10000, 50000, 100000];

let totalSpeedup = 0;
let testCount = 0;

// Section 1: Uint32
console.log('═'.repeat(72));
console.log('  Section 1: Uint32 整数排序');
console.log('═'.repeat(72));

const UINT_TESTS: Array<{ name: TestType; label: string }> = [
  { name: 'uint32_dense', label: '密集整数' },
  { name: 'uint32_sparse', label: '稀疏整数' },
  { name: 'uint32_sorted', label: '已排序' },
  { name: 'uint32_reversed', label: '逆序' },
  { name: 'uint32_duplicates', label: '重复值' },
];

console.log(
  '\n类型'.padEnd(14) +
    '规模'.padStart(10) +
    'blitz'.padStart(12) +
    'V8'.padStart(12) +
    '提升'.padStart(10) +
    '验证'.padStart(6)
);
console.log('-'.repeat(64));

for (const test of UINT_TESTS) {
  for (const size of SIZES) {
    const arr = generateTestData(test.name, size) as Uint32Array;
    const blitzTime = benchmark((a: Uint32Array) => sortUint32(a), arr);
    const v8Time = benchmark((a: Uint32Array) => a.sort((x, y) => x - y), arr);

    const testArr = arr.slice();
    sortUint32(testArr);
    const valid = verifyTyped(testArr);

    const speedup = v8Time / blitzTime;
    totalSpeedup += speedup;
    testCount++;

    console.log(
      test.label.padEnd(14) +
        formatSize(size).padStart(10) +
        formatTime(blitzTime).padStart(12) +
        formatTime(v8Time).padStart(12) +
        `${speedup.toFixed(1)}x`.padStart(10) +
        (valid ? '✅' : '❌').padStart(6)
    );
  }
}

// Section 2: Float64
console.log('\n' + '═'.repeat(72));
console.log('  Section 2: Float64 浮点数排序');
console.log('═'.repeat(72));

const FLOAT_TESTS: Array<{ name: TestType; label: string }> = [
  { name: 'float64_random', label: '随机浮点' },
  { name: 'float64_sorted', label: '已排序' },
  { name: 'float64_mixed', label: '正负混合' },
];

console.log(
  '\n类型'.padEnd(14) +
    '规模'.padStart(10) +
    'blitz'.padStart(12) +
    'V8'.padStart(12) +
    '提升'.padStart(10) +
    '验证'.padStart(6)
);
console.log('-'.repeat(64));

for (const test of FLOAT_TESTS) {
  for (const size of SIZES) {
    const arr = generateTestData(test.name, size) as Float64Array;
    const blitzTime = benchmark((a: Float64Array) => sortFloat64(a), arr);
    const v8Time = benchmark((a: Float64Array) => a.sort((x, y) => x - y), arr);

    const testArr = arr.slice();
    sortFloat64(testArr);
    const valid = verifyTyped(testArr);

    const speedup = v8Time / blitzTime;
    totalSpeedup += speedup;
    testCount++;

    console.log(
      test.label.padEnd(14) +
        formatSize(size).padStart(10) +
        formatTime(blitzTime).padStart(12) +
        formatTime(v8Time).padStart(12) +
        `${speedup.toFixed(1)}x`.padStart(10) +
        (valid ? '✅' : '❌').padStart(6)
    );
  }
}

// Section 3: String
console.log('\n' + '═'.repeat(72));
console.log('  Section 3: 字符串排序');
console.log('═'.repeat(72));

const STRING_TESTS: Array<{ name: TestType; label: string }> = [
  { name: 'string_random', label: '随机字符串' },
  { name: 'string_sorted', label: '已排序' },
  { name: 'string_common_prefix', label: '公共前缀' },
];

console.log(
  '\n类型'.padEnd(14) +
    '规模'.padStart(10) +
    'blitz'.padStart(12) +
    'V8'.padStart(12) +
    '提升'.padStart(10) +
    '验证'.padStart(6)
);
console.log('-'.repeat(64));

for (const test of STRING_TESTS) {
  for (const size of STRING_SIZES) {
    const arr = generateTestData(test.name, size) as string[];
    const blitzTime = benchmark((a: string[]) => sortStrings(a), arr);
    const v8Time = benchmark((a: string[]) => a.sort(), arr);

    const testArr = [...arr];
    sortStrings(testArr);
    const valid = verify(testArr, (a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const speedup = v8Time / blitzTime;
    totalSpeedup += speedup;
    testCount++;

    console.log(
      test.label.padEnd(14) +
        formatSize(size).padStart(10) +
        formatTime(blitzTime).padStart(12) +
        formatTime(v8Time).padStart(12) +
        `${speedup.toFixed(1)}x`.padStart(10) +
        (valid ? '✅' : '❌').padStart(6)
    );
  }
}

// Section 4: Object
console.log('\n' + '═'.repeat(72));
console.log('  Section 4: 对象排序');
console.log('═'.repeat(72));

const OBJ_TESTS: Array<{ name: TestType; label: string; by: (x: TestObject) => string | number }> = [
  { name: 'object_by_number', label: '按数字字段', by: (x) => x.id },
  { name: 'object_by_string', label: '按字符串字段', by: (x) => x.name },
];

console.log(
  '\n类型'.padEnd(14) +
    '规模'.padStart(10) +
    'blitz'.padStart(12) +
    'V8'.padStart(12) +
    '提升'.padStart(10) +
    '验证'.padStart(6)
);
console.log('-'.repeat(64));

for (const test of OBJ_TESTS) {
  for (const size of OBJ_SIZES) {
    const arr = generateTestData(test.name, size) as TestObject[];
    const blitzTime = benchmark((a: TestObject[]) => ultraSort(a, { by: test.by }), arr);
    const v8Time = benchmark(
      (a: TestObject[]) =>
        a.sort((x, y) => {
          const kx = test.by(x),
            ky = test.by(y);
          return kx < ky ? -1 : kx > ky ? 1 : 0;
        }),
      arr
    );

    const testArr = [...arr];
    ultraSort(testArr, { by: test.by });
    const valid = verify(testArr, (a, b) => {
      const ka = test.by(a),
        kb = test.by(b);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });

    const speedup = v8Time / blitzTime;
    totalSpeedup += speedup;
    testCount++;

    console.log(
      test.label.padEnd(14) +
        formatSize(size).padStart(10) +
        formatTime(blitzTime).padStart(12) +
        formatTime(v8Time).padStart(12) +
        `${speedup.toFixed(1)}x`.padStart(10) +
        (valid ? '✅' : '❌').padStart(6)
    );
  }
}

// Summary
console.log('\n' + '═'.repeat(72));
console.log('📊 总体汇总');
console.log('═'.repeat(72));
console.log(`\n平均性能提升: ${(totalSpeedup / testCount).toFixed(1)}x`);
console.log(`测试用例数: ${testCount}`);
console.log('\n✅ Benchmark 完成！');
