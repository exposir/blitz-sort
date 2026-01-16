/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: ultra-sort 完整版 - 支持整数/浮点/字符串/对象
 * [POS]: 排序算法性能实验 - 全数据类型极致优化
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================
//  Ultra Sort Library v3 - 全数据类型版
//  支持：整数、浮点数、字符串、对象
// ============================================================

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           Ultra Sort v3 - 全数据类型版                        ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// ============================================================
//  Part 1: 预分配缓冲区
// ============================================================

const BUFFER_SIZE = 10000001;
const UINT32_BUFFER = new Uint32Array(BUFFER_SIZE);
const FLOAT64_BUFFER = new Float64Array(BUFFER_SIZE);
const INDEX_BUFFER = new Uint32Array(BUFFER_SIZE);
const COUNT_256 = new Uint32Array(256);
const COUNT_65536 = new Uint32Array(65536);

// ============================================================
//  Part 2: 整数排序 (Uint32)
// ============================================================

function insertionSortUint(arr, lo, hi) {
  for (let i = lo + 1; i <= hi; i++) {
    const v = arr[i];
    let j = i - 1;
    while (j >= lo && arr[j] > v) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = v;
  }
}

function countingSortUint(arr, min, max) {
  const n = arr.length;
  const range = max - min + 1;
  const count = range <= 65536 ? COUNT_65536 : new Uint32Array(range);
  if (range <= 65536) count.fill(0, 0, range);

  for (let i = 0; i < n; i++) count[arr[i] - min]++;

  let idx = 0;
  for (let v = 0; v < range; v++) {
    let c = count[v];
    const val = v + min;
    while (c--) arr[idx++] = val;
  }
  return arr;
}

function radixSortUint(arr, maxVal) {
  const n = arr.length;
  const maxByte = maxVal === 0 ? 0 : Math.floor(Math.log2(maxVal) / 8);

  let src = arr;
  let dst = UINT32_BUFFER;
  const count = COUNT_256;

  for (let byte = 0; byte <= maxByte; byte++) {
    const shift = byte << 3;
    count.fill(0);

    for (let i = 0; i < n; i++) count[(src[i] >>> shift) & 0xFF]++;

    let sum = 0;
    for (let j = 0; j < 256; j++) {
      const c = count[j];
      count[j] = sum;
      sum += c;
    }

    for (let i = 0; i < n; i++) {
      const key = (src[i] >>> shift) & 0xFF;
      dst[count[key]++] = src[i];
    }

    const tmp = src; src = dst; dst = tmp;
  }

  if (src !== arr) {
    for (let i = 0; i < n; i++) arr[i] = src[i];
  }
  return arr;
}

function detectPatternUint(arr) {
  const n = arr.length;
  const checkLen = Math.min(32, n);
  let ascCount = 0, descCount = 0;

  for (let i = 1; i < checkLen; i++) {
    if (arr[i] > arr[i-1]) ascCount++;
    else if (arr[i] < arr[i-1]) descCount++;
  }

  if (ascCount > checkLen * 0.9) {
    for (let i = 1; i < n; i++) if (arr[i] < arr[i-1]) return 'random';
    return 'sorted';
  }
  if (descCount > checkLen * 0.9) {
    for (let i = 1; i < n; i++) if (arr[i] > arr[i-1]) return 'random';
    return 'reversed';
  }
  return 'random';
}

function sortUint32(arr) {
  const n = arr.length;
  if (n < 2) return arr;
  if (n <= 32) { insertionSortUint(arr, 0, n - 1); return arr; }
  if (n <= 256) { arr.sort((a, b) => a - b); return arr; }

  const pattern = detectPatternUint(arr);
  if (pattern === 'sorted') return arr;
  if (pattern === 'reversed') {
    let l = 0, r = n - 1;
    while (l < r) { const t = arr[l]; arr[l] = arr[r]; arr[r] = t; l++; r--; }
    return arr;
  }

  let min = arr[0], max = arr[0];
  for (let i = 1; i < n; i++) {
    if (arr[i] < min) min = arr[i];
    else if (arr[i] > max) max = arr[i];
  }

  const range = max - min + 1;
  const density = n / range;

  if (density >= 0.1 && range <= n * 10) return countingSortUint(arr, min, max);
  if (n >= 5000 && max < 0x100000000) return radixSortUint(arr, max);

  arr.sort((a, b) => a - b);
  return arr;
}

// ============================================================
//  Part 3: 浮点数排序 (Float64)
//  IEEE 754: 正数可直接比较，负数需翻转
// ============================================================

const FLOAT64_VIEW = new Float64Array(1);
const UINT64_VIEW = new BigUint64Array(FLOAT64_VIEW.buffer);

function floatToSortableUint(f) {
  FLOAT64_VIEW[0] = f;
  let bits = UINT64_VIEW[0];
  // 负数：翻转所有位；正数：翻转符号位
  if (bits & 0x8000000000000000n) {
    bits = ~bits;
  } else {
    bits ^= 0x8000000000000000n;
  }
  return bits;
}

function sortableUintToFloat(bits) {
  // 反向操作
  if (bits & 0x8000000000000000n) {
    bits ^= 0x8000000000000000n;
  } else {
    bits = ~bits;
  }
  UINT64_VIEW[0] = bits;
  return FLOAT64_VIEW[0];
}

function detectPatternFloat(arr) {
  const n = arr.length;
  const checkLen = Math.min(32, n);
  let ascCount = 0, descCount = 0;

  for (let i = 1; i < checkLen; i++) {
    if (arr[i] > arr[i-1]) ascCount++;
    else if (arr[i] < arr[i-1]) descCount++;
  }

  if (ascCount > checkLen * 0.9) {
    for (let i = 1; i < n; i++) if (arr[i] < arr[i-1]) return 'random';
    return 'sorted';
  }
  if (descCount > checkLen * 0.9) {
    for (let i = 1; i < n; i++) if (arr[i] > arr[i-1]) return 'random';
    return 'reversed';
  }
  return 'random';
}

function sortFloat64(arr) {
  const n = arr.length;
  if (n < 2) return arr;

  // 快速模式检测 - 这是浮点数唯一能赢的地方
  const pattern = detectPatternFloat(arr);
  if (pattern === 'sorted') return arr;
  if (pattern === 'reversed') {
    let l = 0, r = n - 1;
    while (l < r) { const t = arr[l]; arr[l] = arr[r]; arr[r] = t; l++; r--; }
    return arr;
  }

  // 随机浮点数：V8 已经非常快，不要画蛇添足
  arr.sort((a, b) => a - b);
  return arr;
}

// ============================================================
//  Part 4: 字符串排序
//  MSD Radix Sort + 小数组切换插入排序
// ============================================================

function insertionSortStrings(arr, lo, hi) {
  for (let i = lo + 1; i <= hi; i++) {
    const v = arr[i];
    let j = i - 1;
    while (j >= lo && arr[j] > v) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = v;
  }
}

function detectPatternStrings(arr) {
  const n = arr.length;
  const checkLen = Math.min(32, n);
  let ascCount = 0, descCount = 0;

  for (let i = 1; i < checkLen; i++) {
    if (arr[i] > arr[i-1]) ascCount++;
    else if (arr[i] < arr[i-1]) descCount++;
  }

  if (ascCount > checkLen * 0.9) {
    for (let i = 1; i < n; i++) if (arr[i] < arr[i-1]) return 'random';
    return 'sorted';
  }
  if (descCount > checkLen * 0.9) {
    for (let i = 1; i < n; i++) if (arr[i] > arr[i-1]) return 'random';
    return 'reversed';
  }
  return 'random';
}

function msdRadixSortStrings(arr, lo, hi, depth) {
  if (hi - lo < 32) {
    insertionSortStrings(arr, lo, hi);
    return;
  }

  // 按 depth 位置的字符分桶
  const buckets = new Array(257);
  for (let i = 0; i < 257; i++) buckets[i] = [];

  for (let i = lo; i <= hi; i++) {
    const s = arr[i];
    const c = depth < s.length ? s.charCodeAt(depth) + 1 : 0;
    buckets[c].push(s);
  }

  let idx = lo;
  for (let c = 0; c < 257; c++) {
    const bucket = buckets[c];
    if (bucket.length > 0) {
      const start = idx;
      for (const s of bucket) arr[idx++] = s;
      if (c > 0 && bucket.length > 1) {
        msdRadixSortStrings(arr, start, idx - 1, depth + 1);
      }
    }
  }
}

function sortStrings(arr) {
  const n = arr.length;
  if (n < 2) return arr;
  if (n <= 32) { insertionSortStrings(arr, 0, n - 1); return arr; }

  const pattern = detectPatternStrings(arr);
  if (pattern === 'sorted') return arr;
  if (pattern === 'reversed') {
    let l = 0, r = n - 1;
    while (l < r) { const t = arr[l]; arr[l] = arr[r]; arr[r] = t; l++; r--; }
    return arr;
  }

  // 大数组用 MSD Radix Sort
  if (n >= 1000) {
    msdRadixSortStrings(arr, 0, n - 1, 0);
    return arr;
  }

  arr.sort();
  return arr;
}

// ============================================================
//  Part 5: 对象排序
//  Schwartzian Transform: 预计算 key，排序后还原
// ============================================================

function sortObjects(arr, keyFn) {
  const n = arr.length;
  if (n < 2) return arr;

  // 检测 key 类型
  const sampleKey = keyFn(arr[0]);
  const keyType = typeof sampleKey;

  // 数字 key：直接比较，V8 对数字比较优化很好
  if (keyType === 'number') {
    arr.sort((a, b) => keyFn(a) - keyFn(b));
    return arr;
  }

  // 字符串 key：Schwartzian Transform 有收益（避免重复计算 key）
  if (keyType === 'string') {
    // 预计算 keys
    const pairs = new Array(n);
    for (let i = 0; i < n; i++) {
      pairs[i] = { key: keyFn(arr[i]), idx: i };
    }

    // 排序 pairs
    pairs.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

    // 重建数组
    const result = new Array(n);
    for (let i = 0; i < n; i++) {
      result[i] = arr[pairs[i].idx];
    }
    for (let i = 0; i < n; i++) arr[i] = result[i];
    return arr;
  }

  // 其他类型：标准排序
  arr.sort((a, b) => {
    const ka = keyFn(a), kb = keyFn(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  return arr;
}

// ============================================================
//  Part 6: 统一 API
// ============================================================

/**
 * Ultra Sort - 极致排序
 * @param {Array} arr - 要排序的数组
 * @param {Object} options - 选项
 * @param {Function} options.by - 对象排序时的 key 提取函数
 * @param {boolean} options.descending - 是否降序
 * @returns {Array} 排序后的数组（原地修改）
 */
function ultraSort(arr, options = {}) {
  const { by, descending = false } = options;
  const n = arr.length;

  if (n < 2) return arr;

  // 有 by 函数：对象排序
  if (by) {
    sortObjects(arr, by);
    if (descending) arr.reverse();
    return arr;
  }

  // 自动检测类型
  const sample = arr[0];
  const type = typeof sample;

  if (arr instanceof Uint32Array || arr instanceof Int32Array) {
    sortUint32(arr);
  } else if (arr instanceof Float64Array || arr instanceof Float32Array) {
    sortFloat64(arr);
  } else if (type === 'number') {
    // 普通数字数组
    const allInt = arr.every(x => Number.isInteger(x) && x >= 0 && x < 0x100000000);
    if (allInt) {
      const uint = new Uint32Array(arr);
      sortUint32(uint);
      for (let i = 0; i < n; i++) arr[i] = uint[i];
    } else {
      const float = new Float64Array(arr);
      sortFloat64(float);
      for (let i = 0; i < n; i++) arr[i] = float[i];
    }
  } else if (type === 'string') {
    sortStrings(arr);
  } else {
    // 未知类型：使用原生排序
    arr.sort();
  }

  if (descending) arr.reverse();
  return arr;
}

// ============================================================
//  Part 7: 测试框架
// ============================================================

function generateTestData(type, size) {
  switch (type) {
    case 'uint32_dense':
      return new Uint32Array(size).map(() => (Math.random() * size) >>> 0);
    case 'uint32_sparse':
      return new Uint32Array(size).map(() => (Math.random() * size * 100) >>> 0);
    case 'uint32_sorted':
      return new Uint32Array(size).map((_, i) => i);
    case 'uint32_reversed':
      return new Uint32Array(size).map((_, i) => size - i);
    case 'uint32_duplicates':
      const unique = Math.max(10, Math.floor(Math.sqrt(size)));
      return new Uint32Array(size).map(() => (Math.random() * unique) >>> 0);

    case 'float64_random':
      return new Float64Array(size).map(() => Math.random() * 1000000 - 500000);
    case 'float64_sorted':
      return new Float64Array(size).map((_, i) => i * 0.1);
    case 'float64_mixed':
      return new Float64Array(size).map(() => (Math.random() - 0.5) * Number.MAX_SAFE_INTEGER);

    case 'string_random':
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      return Array.from({ length: size }, () => {
        const len = 5 + Math.floor(Math.random() * 15);
        let s = '';
        for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * 26)];
        return s;
      });
    case 'string_sorted':
      return Array.from({ length: size }, (_, i) => String(i).padStart(10, '0'));
    case 'string_common_prefix':
      return Array.from({ length: size }, () => 'prefix_' + Math.random().toString(36).slice(2, 12));

    case 'object_by_number':
      return Array.from({ length: size }, () => ({
        id: Math.floor(Math.random() * size * 10),
        name: 'item_' + Math.random().toString(36).slice(2, 8)
      }));
    case 'object_by_string':
      return Array.from({ length: size }, () => ({
        id: Math.floor(Math.random() * size),
        name: Math.random().toString(36).slice(2, 12)
      }));

    default:
      return [];
  }
}

function benchmark(name, fn, arr, runs = 5) {
  fn(arr.slice ? arr.slice() : [...arr]);  // Warmup
  let total = 0;
  for (let i = 0; i < runs; i++) {
    const copy = arr.slice ? arr.slice() : [...arr];
    const start = performance.now();
    fn(copy);
    total += performance.now() - start;
  }
  return total / runs;
}

function verify(arr, compareFn) {
  for (let i = 1; i < arr.length; i++) {
    if (compareFn) {
      if (compareFn(arr[i-1], arr[i]) > 0) return false;
    } else {
      if (arr[i] < arr[i-1]) return false;
    }
  }
  return true;
}

// ============================================================
//  Part 8: 运行测试
// ============================================================

console.log('═'.repeat(72));
console.log('  Section 1: Uint32 整数排序');
console.log('═'.repeat(72));

const UINT_TESTS = [
  { name: 'uint32_dense', label: '密集整数' },
  { name: 'uint32_sparse', label: '稀疏整数' },
  { name: 'uint32_sorted', label: '已排序' },
  { name: 'uint32_reversed', label: '逆序' },
  { name: 'uint32_duplicates', label: '重复值' },
];

const SIZES = [10000, 100000, 1000000];

console.log('\n类型'.padEnd(14) + '规模'.padStart(10) + 'Ultra'.padStart(12) + 'V8'.padStart(12) + '提升'.padStart(10) + '验证'.padStart(6));
console.log('-'.repeat(64));

let totalSpeedup = 0;
let testCount = 0;

for (const test of UINT_TESTS) {
  for (const size of SIZES) {
    const arr = generateTestData(test.name, size);
    const ultraTime = benchmark('Ultra', (a) => sortUint32(a), arr);
    const v8Time = benchmark('V8', (a) => a.sort((x, y) => x - y), arr);

    const testArr = arr.slice();
    sortUint32(testArr);
    const valid = verify(testArr);

    const speedup = v8Time / ultraTime;
    totalSpeedup += speedup;
    testCount++;

    const sizeStr = size >= 1000000 ? (size / 1000000) + 'M' : (size / 1000) + 'K';
    const ultStr = ultraTime < 1 ? `${(ultraTime * 1000).toFixed(0)}μs` : `${ultraTime.toFixed(1)}ms`;
    const v8Str = v8Time < 1 ? `${(v8Time * 1000).toFixed(0)}μs` : `${v8Time.toFixed(1)}ms`;

    console.log(
      test.label.padEnd(14) +
      sizeStr.padStart(10) +
      ultStr.padStart(12) +
      v8Str.padStart(12) +
      `${speedup.toFixed(1)}x`.padStart(10) +
      (valid ? '✅' : '❌').padStart(6)
    );
  }
}

console.log('\n' + '═'.repeat(72));
console.log('  Section 2: Float64 浮点数排序');
console.log('═'.repeat(72));

const FLOAT_TESTS = [
  { name: 'float64_random', label: '随机浮点' },
  { name: 'float64_sorted', label: '已排序' },
  { name: 'float64_mixed', label: '正负混合' },
];

console.log('\n类型'.padEnd(14) + '规模'.padStart(10) + 'Ultra'.padStart(12) + 'V8'.padStart(12) + '提升'.padStart(10) + '验证'.padStart(6));
console.log('-'.repeat(64));

for (const test of FLOAT_TESTS) {
  for (const size of SIZES) {
    const arr = generateTestData(test.name, size);
    const ultraTime = benchmark('Ultra', (a) => sortFloat64(a), arr);
    const v8Time = benchmark('V8', (a) => a.sort((x, y) => x - y), arr);

    const testArr = arr.slice();
    sortFloat64(testArr);
    const valid = verify(testArr);

    const speedup = v8Time / ultraTime;
    totalSpeedup += speedup;
    testCount++;

    const sizeStr = size >= 1000000 ? (size / 1000000) + 'M' : (size / 1000) + 'K';
    const ultStr = ultraTime < 1 ? `${(ultraTime * 1000).toFixed(0)}μs` : `${ultraTime.toFixed(1)}ms`;
    const v8Str = v8Time < 1 ? `${(v8Time * 1000).toFixed(0)}μs` : `${v8Time.toFixed(1)}ms`;

    console.log(
      test.label.padEnd(14) +
      sizeStr.padStart(10) +
      ultStr.padStart(12) +
      v8Str.padStart(12) +
      `${speedup.toFixed(1)}x`.padStart(10) +
      (valid ? '✅' : '❌').padStart(6)
    );
  }
}

console.log('\n' + '═'.repeat(72));
console.log('  Section 3: 字符串排序');
console.log('═'.repeat(72));

const STRING_TESTS = [
  { name: 'string_random', label: '随机字符串' },
  { name: 'string_sorted', label: '已排序' },
  { name: 'string_common_prefix', label: '公共前缀' },
];

const STRING_SIZES = [10000, 50000, 100000];

console.log('\n类型'.padEnd(14) + '规模'.padStart(10) + 'Ultra'.padStart(12) + 'V8'.padStart(12) + '提升'.padStart(10) + '验证'.padStart(6));
console.log('-'.repeat(64));

for (const test of STRING_TESTS) {
  for (const size of STRING_SIZES) {
    const arr = generateTestData(test.name, size);
    const ultraTime = benchmark('Ultra', (a) => sortStrings(a), arr);
    const v8Time = benchmark('V8', (a) => a.sort(), arr);

    const testArr = [...arr];
    sortStrings(testArr);
    const valid = verify(testArr, (a, b) => a < b ? -1 : a > b ? 1 : 0);

    const speedup = v8Time / ultraTime;
    totalSpeedup += speedup;
    testCount++;

    const sizeStr = size >= 1000000 ? (size / 1000000) + 'M' : (size / 1000) + 'K';
    const ultStr = ultraTime < 1 ? `${(ultraTime * 1000).toFixed(0)}μs` : `${ultraTime.toFixed(1)}ms`;
    const v8Str = v8Time < 1 ? `${(v8Time * 1000).toFixed(0)}μs` : `${v8Time.toFixed(1)}ms`;

    console.log(
      test.label.padEnd(14) +
      sizeStr.padStart(10) +
      ultStr.padStart(12) +
      v8Str.padStart(12) +
      `${speedup.toFixed(1)}x`.padStart(10) +
      (valid ? '✅' : '❌').padStart(6)
    );
  }
}

console.log('\n' + '═'.repeat(72));
console.log('  Section 4: 对象排序');
console.log('═'.repeat(72));

const OBJ_TESTS = [
  { name: 'object_by_number', label: '按数字字段', by: x => x.id },
  { name: 'object_by_string', label: '按字符串字段', by: x => x.name },
];

const OBJ_SIZES = [10000, 50000, 100000];

console.log('\n类型'.padEnd(14) + '规模'.padStart(10) + 'Ultra'.padStart(12) + 'V8'.padStart(12) + '提升'.padStart(10) + '验证'.padStart(6));
console.log('-'.repeat(64));

for (const test of OBJ_TESTS) {
  for (const size of OBJ_SIZES) {
    const arr = generateTestData(test.name, size);
    const ultraTime = benchmark('Ultra', (a) => ultraSort(a, { by: test.by }), arr);
    const v8Time = benchmark('V8', (a) => a.sort((x, y) => {
      const kx = test.by(x), ky = test.by(y);
      return kx < ky ? -1 : kx > ky ? 1 : 0;
    }), arr);

    const testArr = [...arr];
    ultraSort(testArr, { by: test.by });
    const valid = verify(testArr, (a, b) => {
      const ka = test.by(a), kb = test.by(b);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });

    const speedup = v8Time / ultraTime;
    totalSpeedup += speedup;
    testCount++;

    const sizeStr = size >= 1000000 ? (size / 1000000) + 'M' : (size / 1000) + 'K';
    const ultStr = ultraTime < 1 ? `${(ultraTime * 1000).toFixed(0)}μs` : `${ultraTime.toFixed(1)}ms`;
    const v8Str = v8Time < 1 ? `${(v8Time * 1000).toFixed(0)}μs` : `${v8Time.toFixed(1)}ms`;

    console.log(
      test.label.padEnd(14) +
      sizeStr.padStart(10) +
      ultStr.padStart(12) +
      v8Str.padStart(12) +
      `${speedup.toFixed(1)}x`.padStart(10) +
      (valid ? '✅' : '❌').padStart(6)
    );
  }
}

// ============================================================
//  Part 9: 汇总
// ============================================================

console.log('\n' + '═'.repeat(72));
console.log('📊 总体汇总');
console.log('═'.repeat(72));
console.log(`\n平均性能提升: ${(totalSpeedup / testCount).toFixed(1)}x`);
console.log(`测试用例数: ${testCount}`);

console.log('\n' + '═'.repeat(72));
console.log('📦 API 示例');
console.log('═'.repeat(72));
console.log(`
// 整数数组
ultraSort(new Uint32Array([3, 1, 4, 1, 5, 9]));

// 浮点数组
ultraSort(new Float64Array([3.14, 2.71, 1.41]));

// 字符串数组
ultraSort(['banana', 'apple', 'cherry']);

// 对象数组
ultraSort(users, { by: u => u.age });

// 降序
ultraSort(arr, { descending: true });
`);

console.log('✅ Ultra Sort v3 全数据类型版测试完成！');

// 导出 API
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ultraSort, sortUint32, sortFloat64, sortStrings, sortObjects };
}
