# Base Converter

A single HTML file for exact integer conversion between bases and signed bit representations. Open `index.html` in a modern browser. No server, build process, account, or internet connection is required to use the app.

**English · 中文 · Français**

## English

### Two views of the same value

The left side displays a mathematical signed value in binary, octal, decimal, hexadecimal, or a custom base. A negative value retains a minus sign.

The right side displays that value as a fixed-width sign-magnitude, ones-complement, or twos-complement bit pattern. Each field can be edited.

For **−59 at 8 bits**:

| Field | Result |
|---|---|
| Binary | `-11 1011` |
| Octal | `-73` |
| Decimal | `-59` |
| Hexadecimal | `-3B` |
| Sign magnitude | `1011 1011` |
| Ones complement | `1100 0100` |
| Twos complement | `1100 0101` |

This distinction is intentional. For example, `0xFF` in the left hexadecimal field is positive **255**, which is outside the signed 8-bit range. The right twos-complement pattern `11111111` represents **−1** at 8 bits.

### Features

- Exact BigInt arithmetic at every supported width: presets 4, 8, 16, 32, 64 and custom widths **1–128**.
- Bases **2–36**, with case-insensitive letters A–Z where appropriate.
- Live conversion and a Calculate button that use the same validation.
- Input remains visible when invalid or outside the signed range; derived results clear until it is corrected. Values are never silently clamped or rounded.
- Width changes preserve the mathematical value and re-encode it when it fits. Increasing the width can resolve a range error.
- Changing the custom base reformats the current value rather than reinterpreting its old digits.
- Small explanation controls describe each signed encoding and its treatment of zero.
- Explicit feedback for values that sign magnitude or ones complement cannot represent.
- Copy buttons produce ungrouped values, preserving the minus sign or leading bits. Clipboard fallback supports browsers that restrict the modern clipboard API.
- Paste support for whitespace, the typographic minus sign `−`, and matching `0b`, `0o`, and `0x` prefixes. A prefix is interpreted only when it matches the field's base; otherwise its characters must be valid digits for that base.
- Fields grow with their content. Long exact results and range limits wrap to fit narrow screens.
- English, Chinese, and French labels, explanations, validation, and accessible control names.
- A compact sun/moon switch beside the title changes between light and dark appearances without changing the current calculation. It also works with the keyboard.
- Preferences are not saved. Reloading restores English, 8 bits, and custom base 10.

The appearance starts in light mode on each visit; the theme choice is not saved.

Binary groups are visual only. While typing, the source field keeps its draft text and caret; leaving a valid field or pressing Calculate formats it. A right-side bit pattern must contain exactly the selected number of bits after removing whitespace and an optional `0b` prefix.

Reset clears values and errors, keeping valid settings. Invalid width/base settings are restored to their defaults. Inputs are limited to 1,024 digits before conversion.

### Exact ranges and encoding rules

For width **W**:

| Representation | Minimum | Maximum |
|---|---|---|
| Twos complement / signed input | −2^(W−1) | 2^(W−1) − 1 |
| Sign magnitude and ones complement | −(2^(W−1) − 1) | 2^(W−1) − 1 |
| Unsigned interpretation of the twos-complement bits | 0 | 2^W − 1 |

The unsigned information value interprets the **twos-complement bit pattern** as unsigned; it does not change the left-side input convention.

- **Sign magnitude:** the first bit is the sign; the remaining W−1 bits hold the absolute value. For bits indexed from zero, magnitude is the sum of bᵢ × 2ⁱ for i = 0 through W−2.
- **Ones complement:** for a negative value, invert all bits of its positive encoding. Decode a pattern with its top bit set as unsignedPattern − (2^W − 1).
- **Twos complement:** for a negative value, invert the positive encoding and add one. Decode a pattern with its top bit set as unsignedPattern − 2^W.
- Sign magnitude and ones complement each have two encodings of zero. Both decode to the mathematical value 0; canonical output uses positive zero.
- At 8 bits, −128 is valid in twos complement but is not representable in sign magnitude or ones complement. At 1 bit, the latter two represent only zero.

All values, masks, signed limits, and complement arithmetic stay as **BigInt**. Only bounded configuration values such as the width and radix use Number. No integer input passes through `parseInt` or floating-point arithmetic.

### Files and verification

```text
index.html              Complete offline app, including CSS and JavaScript
README.md               Documentation
LICENSE                 License text
tests/math.test.cjs      Exact arithmetic and parser regression tests
tests/browser.test.cjs   Editing, clipboard, accessibility, and layout checks
```

The app needs a modern browser with BigInt support. It has been verified in Microsoft Edge; Firefox, Safari, and physical devices have not been directly verified in this update.

Tests are development tools and are not needed to open the HTML file.

With a current Node.js runtime:

```sh
node --test tests/math.test.cjs
```

The math suite checks every signed value at widths 1–10 in all bases 2–36, all 65,536 sixteen-bit patterns with an independent weighted-bit decoder, and boundary/seeded samples at every width through 128. It performs over 4.7 million exact comparisons against independently constructed expected representations.

For browser tests, install Playwright and its Chromium browser:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node --test tests/browser.test.cjs
```

Alternatively, set `BROWSER_CHANNEL=msedge` to use an installed Microsoft Edge, and `PLAYWRIGHT_PATH` to an existing Playwright module if needed. Optional `TEST_ARTIFACTS` selects a directory for screenshots and measured results.

Set `TEST_THEME=dark` to run the same browser checks and screenshots in dark mode.

The browser suite includes all 8-bit values, boundary cases at every width 1–128, exact wide integers, invalid/incomplete edits, configuration changes, copy behavior, language changes, and six viewport sizes.

## 中文

### 使用方法

在现代浏览器中直接打开 `index.html`。应用由单个 HTML 文件组成，包含全部样式和脚本，无需服务器、构建工具、账号或网络连接。

**左侧与右侧的负数表示有意不同：**

- 左侧表示数学上的有符号数值。例如 −59 的二进制为 `-11 1011`，十六进制为 `-3B`。
- 右侧表示固定宽度的编码。在 8 位下，−59 的原码为 `1011 1011`，反码为 `1100 0100`，补码为 `1100 0101`。
- 所有数值字段均可编辑。右侧编码在去除空格和可选的 `0b` 前缀后，必须恰好符合所选位宽。

### 行为与范围

- 使用 BigInt 精确计算，支持 **1–128 位**和 **2–36 进制**。
- 超出范围或无效的输入会保留并显示提示，其他结果会清空，不会静默截断、钳制或舍入。
- 更改位宽时保留数学数值，并在可表示时重新编码。更改自定义进制时重新格式化当前数值。
- 8 位补码的有符号范围为 −128 至 127；原码和反码只能表示 −127 至 127。无法表示的情况会明确说明。
- 原码和反码的正零、负零均解码为 0，规范输出使用正零。
- 信息区的无符号数值是对**补码位模式**的无符号解释，不改变左侧的输入含义。
- 支持复制无分组空格的完整数值，保留负号和前导位。
- 粘贴时支持空白字符、排版负号 `−`，以及对应进制的 `0b`、`0o`、`0x` 前缀。
- 字段随内容自动增高，长数值和范围可在窄屏幕上换行显示。
- 提供中、英、法三种语言和编码说明；不会保存偏好设置。
- 标题旁的日月图标可切换浅色与深色模式，也支持键盘操作；切换不会改变当前计算。每次打开默认浅色，不保存主题选择。
- 重置清空数值与错误，保留有效设置；无效的位宽或进制会恢复默认值。刷新页面恢复英文、8 位和自定义 10 进制。

需要支持 BigInt 的现代浏览器。本次更新已在 Microsoft Edge 中验证。开发测试方法见上方英文部分，运行应用不需要测试依赖。

## Français

### Utilisation

Ouvrez `index.html` dans un navigateur moderne. Ce fichier contient toute l'application, ses styles et ses scripts. Aucun serveur, outil de compilation, compte ou accès Internet n'est nécessaire.

**La différence entre les nombres négatifs à gauche et à droite est intentionnelle :**

- À gauche, les champs affichent une valeur mathématique signée. Par exemple, −59 devient `-11 1011` en binaire et `-3B` en hexadécimal.
- À droite, la même valeur est encodée sur un nombre fixe de bits. Sur 8 bits : signe et valeur absolue `1011 1011`, complément à un `1100 0100`, complément à deux `1100 0101`.
- Tous les champs sont modifiables. Un encodage doit contenir exactement le nombre de bits choisi après suppression des espaces et du préfixe facultatif `0b`.

### Comportement et plages

- Calculs BigInt exacts, de **1 à 128 bits**, dans les bases **2 à 36**.
- Une saisie incorrecte ou hors plage reste visible avec une explication. Les résultats dérivés sont effacés ; aucune valeur n'est arrondie ou limitée silencieusement.
- Changer le nombre de bits conserve la valeur mathématique et la réencode si elle est représentable. Changer la base personnalisée reformate la valeur courante.
- Sur 8 bits, le complément à deux accepte −128 à 127 ; les deux autres encodages acceptent −127 à 127. Les valeurs non représentables sont signalées.
- Les zéros positif et négatif des deux premiers encodages sont décodés en 0 ; la sortie canonique utilise le zéro positif.
- La valeur non signée du panneau d'information interprète les **bits du complément à deux** sans signe. Elle ne change pas la convention des champs de gauche.
- Les boutons de copie conservent tous les chiffres, le signe et les bits initiaux, sans espaces de groupement.
- Le collage accepte les espaces, le signe moins typographique `−` et les préfixes correspondant à la base : `0b`, `0o`, `0x`.
- Les champs grandissent avec leur contenu, et les grands nombres s'adaptent aux écrans étroits.
- Interface et explications en anglais, chinois et français. Les préférences ne sont pas enregistrées.
- Le bouton soleil/lune près du titre permet de passer du mode clair au mode sombre, y compris au clavier, sans changer le calcul. Chaque visite commence en mode clair ; le choix du thème n'est pas enregistré.
- Réinitialiser efface les valeurs et les erreurs en conservant les réglages valides. Les réglages invalides retrouvent leur valeur par défaut. Recharger la page rétablit l'anglais, 8 bits et la base personnalisée 10.

Un navigateur moderne compatible avec BigInt est requis. Cette mise à jour a été vérifiée dans Microsoft Edge. Les tests de développement sont décrits plus haut ; ils ne sont pas nécessaires pour utiliser le fichier HTML.

## License

See [LICENSE](LICENSE).
