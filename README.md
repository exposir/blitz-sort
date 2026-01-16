# blitz-sort

[English](./README_EN.md) | 简体中文

超快速 JavaScript 排序库。通过针对不同数据类型使用最优算法，性能超越 V8 原生 `.sort()`。

## 特性

- **多类型支持**: Uint32、Float64、字符串、对象
- **自适应算法**: 根据数据规模和分布自动选择最佳算法
- **模式检测**: 已排序/逆序数组瞬间处理
- **零依赖**: 纯 JavaScript 实现
- **原地排序**: 最小内存开销

## 安装

```bash
npm install blitz-sort
```

## 使用

```javascript
const { ultraSort, sortUint32, sortFloat64, sortStrings, sortObjects } = require('blitz-sort');

// 整数数组
const integers = new Uint32Array([3, 1, 4, 1, 5, 9, 2, 6]);
ultraSort(integers);
// => Uint32Array [1, 1, 2, 3, 4, 5, 6, 9]

// 浮点数组
const floats = new Float64Array([3.14, -2.71, 1.41, -0.5]);
ultraSort(floats);
// => Float64Array [-2.71, -0.5, 1.41, 3.14]

// 字符串数组
const strings = ['banana', 'apple', 'cherry', 'date'];
ultraSort(strings);
// => ['apple', 'banana', 'cherry', 'date']

// 对象数组 (按字段排序)
const users = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 35 }
];
ultraSort(users, { by: u => u.age });
// => [{ name: 'Bob', age: 25 }, { name: 'Alice', age: 30 }, { name: 'Charlie', age: 35 }]

// 降序排列
ultraSort(integers, { descending: true });
// => Uint32Array [9, 6, 5, 4, 3, 2, 1, 1]
```

## API

### `ultraSort(arr, options?)`

主排序函数，自动检测数组类型并应用最优算法。

**参数:**
- `arr` - 待排序数组 (原地修改)
- `options.by` - 对象排序时的键提取函数
- `options.descending` - 是否降序排列 (默认: `false`)

**返回:** 排序后的数组

### `sortUint32(arr)`

Uint32Array 专用优化排序。根据数据特征使用:
- 插入排序 (n ≤ 32)
- 计数排序 (密集整数范围)
- 基数排序 (n ≥ 5000)

### `sortFloat64(arr)`

Float64Array 专用优化排序。包含已排序/逆序数组的模式检测。

### `sortStrings(arr)`

字符串数组优化排序。使用:
- 插入排序 (n ≤ 32)
- MSD 基数排序 (n ≥ 1000)

### `sortObjects(arr, keyFn)`

对象排序，对字符串键使用 Schwartzian 变换避免重复计算。

## 算法选择策略

| 数据类型 | 数据规模 | 算法 |
|---------|---------|------|
| Uint32 | n ≤ 32 | 插入排序 |
| Uint32 | 33-256 | V8 原生 |
| Uint32 | 密集范围 | 计数排序 |
| Uint32 | n ≥ 5000 | LSD 基数排序 |
| Float64 | 所有 | 模式检测 + V8 原生 |
| String | n ≤ 32 | 插入排序 |
| String | n ≥ 1000 | MSD 基数排序 |
| Object | 数字键 | V8 原生 |
| Object | 字符串键 | Schwartzian 变换 |

## 性能对比

blitz-sort vs V8 原生 `.sort()` 基准测试:

### 整数 (Uint32Array)

| 测试场景 | 10K | 100K | 1M |
|---------|-----|------|-----|
| 密集整数 | 4.9x | 14.2x | 17.0x |
| 稀疏整数 | 1.8x | 14.7x | 15.7x |
| 已排序 | 4.0x | 63.7x | 73.2x |
| 逆序 | 2.2x | 40.1x | 50.4x |
| 大量重复 | 32.3x | 39.8x | 52.3x |

### 浮点数 (Float64Array)

| 测试场景 | 10K | 100K | 1M |
|---------|-----|------|-----|
| 随机浮点 | 1.0x | 1.0x | 1.0x |
| 已排序 | 6.0x | 149.6x | 159.4x |
| 正负混合 | 1.0x | 1.0x | 1.0x |

### 字符串

| 测试场景 | 10K | 50K | 100K |
|---------|-----|-----|------|
| 随机字符串 | 2.4x | 3.0x | 3.6x |
| 已排序 | 0.8x | 2.6x | 2.7x |
| 公共前缀 | 1.1x | 1.2x | 1.4x |

### 对象

| 测试场景 | 10K | 50K | 100K |
|---------|-----|-----|------|
| 按数字字段 | 1.1x | 1.1x | 1.2x |
| 按字符串字段 | 1.4x | 1.4x | 2.1x |

**平均性能提升: 19.9x**

*运行 `npm run benchmark` 查看你机器上的实际结果。*

## 实现原理

### 模式检测

排序前，采样前 32 个元素检测数据模式:
- **已排序**: 直接返回
- **逆序**: O(n) 反转操作
- **随机**: 执行完整排序算法

### 整数基数排序

对于大型整数数组，LSD (最低有效位) 基数排序按字节处理数字，对有界整数达到 O(n) 时间复杂度。

### 字符串 MSD 基数排序

对于大型字符串数组，MSD (最高有效位) 基数排序按字符位置分组，递归排序每个桶。

### Schwartzian 变换

按字符串键排序对象时，预先计算所有键值，避免比较过程中重复调用 `keyFn`。

## 环境要求

- Node.js >= 14.0.0
- 使用 `BigUint64Array` 进行浮点数转整数

## 许可证

MIT
