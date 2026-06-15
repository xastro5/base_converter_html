# Base Converter

A single-file, browser-native base converter supporting Binary, Octal, Decimal, Hexadecimal, and Custom bases — with full Sign Magnitude, Ones Complement, and Twos Complement representations.

**[English](#english) · [中文](#中文) · [Français](#français)**

---

## English

### Overview

**Base Converter** is a standalone HTML file — no build tools, no dependencies, no server required. Open `index.v5.1.html` in any modern browser to use it.

It converts between numeric bases in real time as you type, supports bit widths from 4 to 64 bits (plus custom), and displays all three signed-magnitude representations simultaneously.

### Features

| Feature | Description |
|---|---|
| **Real-time bidirectional conversion** | Edit any field; all others update instantly |
| **Multiple bases** | Binary, Octal, Decimal, Hex, Custom (base 2–36) |
| **Complement codes** | Sign Magnitude, Ones Complement, Twos Complement |
| **Configurable bit width** | 4 / 8 / 16 / 32 / 64 / custom (up to 128) |
| **Overflow clamping** | Out-of-range values are clamped with a warning |
| **Adaptive UI** | Textarea height grows automatically for wide bit widths |
| **IEEE 754 safe** | 64-bit signed range fully supported via `Math.pow` |

### Supported Ranges

For a given bit width `W`:

| Representation | Minimum | Maximum |
|---|---|---|
| Signed | $-2^{W-1}$ | $2^{W-1} - 1$ |
| Unsigned | $0$ | $2^{W} - 1$ |

### Computation Formulas

#### Bit Mask
$$
\text{mask} = 2^W - 1
$$

When $W \geq 31$, JavaScript bitwise operators overflow, so `Math.pow(2, W) - 1` is used instead of `(1 << W) - 1`.

#### Sign Magnitude Parsing
For a binary string $b_{W-1}b_{W-2}\ldots b_0$ of width $W$:

$$
\text{value} = \begin{cases}
\;\ \displaystyle\sum_{i=1}^{W-1} b_i \cdot 2^{i-1} & b_{W-1} = 0 \ (\text{positive}) \\[8pt]
-\displaystyle\sum_{i=1}^{W-1} b_i \cdot 2^{i-1} & b_{W-1} = 1 \ (\text{negative})
\end{cases}
$$

The MSB (most significant bit) is the sign bit; remaining bits encode the magnitude.

#### Ones Complement Parsing
$$
\text{value} = \begin{cases}
\;\ v & \text{MSB} = 0 \\[6pt]
\;\ v - 2^W + 1 & \text{MSB} = 1
\end{cases}
$$
where $v$ is the unsigned integer value of the $W$-bit binary string.

#### Twos Complement Parsing
$$
\text{value} = \begin{cases}
\;\ v & \text{MSB} = 0 \\[6pt]
\;\ v - 2^W & \text{MSB} = 1
\end{cases}
$$

#### Twos Complement Display
The displayed twos complement representation is the **bitwise AND** of the signed value with the mask:
$$
\text{display} = \text{value} \ \mathbf{AND}\ \text{mask}
$$

#### Negative Number Display (Binary / Octal / Hex)
Negative values display as:
$$
-\text{abs}(\text{value}) \text{ in base } b
$$
Not as a masked representation — e.g., `-20` in binary shows as `-10100`, not `11111111111111111111111111101100`.

### Custom Base

Custom base values in range 2–36 use digits `0-9` then `a-z`. Negative custom base values follow the same sign-magnitude display convention.

### File Structure

```
base_converter_html/
├── index.v5.1.html   # Stable version (English only)
├── index.v5.1.1.html # With language selector (dropdown)
└── index.v5.1.2.html # With language toggle buttons
```

### Browser Compatibility

Tested in Chrome, Firefox, Safari, and Edge. Requires a modern browser with ES5 support.

### License

Copyright © 2025-2026 astrovyz. All rights reserved.

---

## 中文

### 概述

**进制转换器** 是一个单文件 HTML 应用，无需构建工具、无依赖、无需服务器。直接在现代浏览器中打开 `index.v5.1.html` 即可使用。

支持在二进制、八进制、十进制、十六进制和自定义进制之间实时双向转换，位宽可配置为 4 至 64 位（支持自定义最高 128 位），并同时显示原码、反码和补码三种有符号表示。

### 功能

| 功能 | 说明 |
|---|---|
| **实时双向转换** | 编辑任意字段，其他字段立即更新 |
| **多种进制** | 二进制、八进制、十进制、十六进制、自定义（2-36 进制） |
| **补码表示** | 原码、反码、补码 |
| **可配置位宽** | 4 / 8 / 16 / 32 / 64 / 自定义（最高 128） |
| **溢出处理** | 超出范围的值自动钳制并显示警告 |
| **自适应高度** | 宽位宽时文本框高度自动增长 |
| **IEEE 754 安全** | 通过 Math.pow 完整支持 64 位有符号范围 |

### 支持范围

对于给定位宽 $W$：

| 表示方式 | 最小值 | 最大值 |
|---|---|---|
| 有符号 | $-2^{W-1}$ | $2^{W-1} - 1$ |
| 无符号 | $0$ | $2^{W} - 1$ |

### 计算公式

#### 位掩码
$$
\text{mask} = 2^W - 1
$$

当 $W \geq 31$ 时，JavaScript 位运算符会溢出，因此使用 `Math.pow(2, W) - 1` 而非 `(1 << W) - 1`。

#### 原码解析
对于宽度为 $W$ 的二进制字符串 $b_{W-1}b_{W-2}\ldots b_0$：

$$
\text{value} = \begin{cases}
\;\ \displaystyle\sum_{i=1}^{W-1} b_i \cdot 2^{i-1} & b_{W-1} = 0 \ (\text{正数}) \\[8pt]
-\displaystyle\sum_{i=1}^{W-1} b_i \cdot 2^{i-1} & b_{W-1} = 1 \ (\text{负数})
\end{cases}
$$

最高位（MSB）为符号位，剩余位表示数值大小。

#### 反码解析
$$
\text{value} = \begin{cases}
\;\ v & \text{MSB} = 0 \\[6pt]
\;\ v - 2^W + 1 & \text{MSB} = 1
\end{cases}
$$
其中 $v$ 为该 $W$ 位二进制字符串的无符号整数值。

#### 补码解析
$$
\text{value} = \begin{cases}
\;\ v & \text{MSB} = 0 \\[6pt]
\;\ v - 2^W & \text{MSB} = 1
\end{cases}
$$

#### 补码显示
显示的补码表示为有符号值与掩码的按位 AND：
$$
\text{display} = \text{value} \ \mathbf{AND}\ \text{mask}
$$

#### 负数显示（二进制 / 八进制 / 十六进制）
负数显示为：
$$
-\text{abs}(\text{value}) \text{（以 base } b \text{ 表示})
$$
即显示数值的绝对值前加负号，而非补码掩码表示。例如：`-20` 的二进制显示为 `-10100`，而非 `11111111111111111111111111101100`。

### 自定义进制

自定义进制支持 2-36，使用数字 `0-9` 和字母 `a-z`。负数的自定义进制表示同样遵循符号-数值显示约定。

### 文件结构

```
base_converter_html/
├── index.v5.1.html   # 稳定版本（仅英文）
├── index.v5.1.1.html # 带语言选择器（下拉框）
└── index.v5.1.2.html # 带语言切换按钮
```

### 浏览器兼容性

已在 Chrome、Firefox、Safari 和 Edge 中测试通过。需要支持 ES5 的现代浏览器。

### 许可证

版权所有 © 2025-2026 astrovyz。保留所有权利。

---

## Français

### Présentation

**Convertisseur de Base** est un fichier HTML autonome — aucun outil de build, aucune dépendance, aucun serveur requis. Ouvrez simplement `index.v5.1.html` dans un navigateur moderne.

Il convertit entre les bases numériques en temps réel à mesure que vous tapez, prend en charge les largeurs de bits de 4 à 64 bits (et personnalisé jusqu'à 128), et affiche simultanément les trois représentations en complément.

### Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| **Conversion bidirectionnelle en temps réel** | Modifiez n'importe quel champ ; tous les autres se mettent à jour instantanément |
| **Bases multiples** | Binaire, Octal, Décimal, Hexadécimal, Personnalisé (base 2–36) |
| **Codes complémentaires** | Signe & Magnitude, Complément à 1, Complément à 2 |
| **Largeur de bits configurable** | 4 / 8 / 16 / 32 / 64 / personnalisé (jusqu'à 128) |
| **Limitation de débordement** | Les valeurs hors plage sont limitées avec un avertissement |
| **UI adaptative** | La hauteur de la zone de texte s'adapte automatiquement aux grandes largeurs |
| **Compatible IEEE 754** | La plage signée 64 bits est entièrement prise en charge via `Math.pow` |

### Plages supportées

Pour une largeur de bits $W$ donnée :

| Représentation | Minimum | Maximum |
|---|---|---|
| Signée | $-2^{W-1}$ | $2^{W-1} - 1$ |
| Non signée | $0$ | $2^{W} - 1$ |

### Formules de calcul

#### Masque de bits
$$
\text{mask} = 2^W - 1
$$

Lorsque $W \geq 31$, les opérateurs bit à bit de JavaScript débordent, donc `Math.pow(2, W) - 1` est utilisé à la place de `(1 << W) - 1`.

#### Analyse Signe & Magnitude
Pour une chaîne binaire $b_{W-1}b_{W-2}\ldots b_0$ de largeur $W$ :

$$
\text{value} = \begin{cases}
\;\ \displaystyle\sum_{i=1}^{W-1} b_i \cdot 2^{i-1} & b_{W-1} = 0 \ (\text{positif}) \\[8pt]
-\displaystyle\sum_{i=1}^{W-1} b_i \cdot 2^{i-1} & b_{W-1} = 1 \ (\text{négatif})
\end{cases}
$$

Le bit de poids fort (MSB) est le bit de signe ; les bits restants encodent la magnitude.

#### Analyse Complément à 1
$$
\text{value} = \begin{cases}
\;\ v & \text{MSB} = 0 \\[6pt]
\;\ v - 2^W + 1 & \text{MSB} = 1
\end{cases}
$$
où $v$ est la valeur entière non signée de la chaîne binaire de $W$ bits.

#### Analyse Complément à 2
$$
\text{value} = \begin{cases}
\;\ v & \text{MSB} = 0 \\[6pt]
\;\ v - 2^W & \text{MSB} = 1
\end{cases}
$$

#### Affichage Complément à 2
La représentation en complément à 2 affichée est le **ET bit à bit** de la valeur signée avec le masque :
$$
\text{display} = \text{value} \ \mathbf{AND}\ \text{mask}
$$

#### Affichage des nombres négatifs (Binaire / Octal / Hexadécimal)
Les valeurs négatives s'affichent comme :
$$
-\text{abs}(\text{value}) \text{ en base } b
$$
Et non comme une représentation masquée — par exemple, `-20` en binaire affiche `-10100`, et non `11111111111111111111111111101100`.

### Base personnalisée

Les valeurs en base personnalisée dans la plage 2–36 utilisent les chiffres `0-9` puis `a-z`. Les valeurs négatives en base personnalisée suivent la même convention d'affichage signe-magnitude.

### Structure des fichiers

```
base_converter_html/
├── index.v5.1.html   # Version stable (anglais uniquement)
├── index.v5.1.1.html # Avec sélecteur de langue (menu déroulant)
└── index.v5.1.2.html # Avec boutons de commutation de langue
```

### Compatibilité des navigateurs

Testé dans Chrome, Firefox, Safari et Edge. Requiert un navigateur moderne avec support ES5.

### Licence

Copyright © 2025-2026 astrovyz. Tous droits réservés.
