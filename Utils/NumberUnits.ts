/**
 * 数值显示单位的唯一真源：把任意数值渲染成带中文大数单位的字符串。
 *
 * 规则取自 `docs/adr/0001-big-number-display-units.md`，术语见 `CONTEXT.md`：
 * 中数（万进）单位表、显示有效数字、显示进位、表尾溢出、精确整数上限。
 */

/**
 * 中数（万进）大数单位表：索引 i 对应 10^(4i)，索引 18「大数」= 10^72 为表顶。
 * 「万亿」是已废弃写法，与「兆」同值双名，不在此表中出现。
 */
const UNIT_TEXTS: string[] = [
    "",
    "万", "亿", "兆", "京", "垓", "秭", "穰", "沟", "涧", "正", "载",
    "极", "恒河沙", "阿僧祇", "那由他", "不可思议", "无量", "大数"
];

/** 单位进位的十进制步长：每级恰好 ×10^4。 */
const UNIT_STEP_EXPONENT: number = 4;

/** 表顶索引：再往上一级没有可用单位，回落科学计数法。 */
const UNIT_TOP_INDEX: number = UNIT_TEXTS.length - 1;

/** 万以下的显示阈值 10^4。 */
const UNIT_THRESHOLD: number = Math.pow(10, UNIT_STEP_EXPONENT);

/** 一位整数加三位小数，即 4 位有效数字。 */
const SIGNIFICANT_DIGITS: number = 4;

/** `toExponential` 的小数位数：一位整数 + 三位小数 = 4 位有效数字。 */
const EXPONENTIAL_DECIMALS: number = SIGNIFICANT_DIGITS - 1;

/** 去掉小数尾零，连带去掉被清空的小数点（`1.000` → `1`）。 */
function stripTrailingZeros(text: string): string {
    return text.indexOf(".") < 0 ? text : text.replace(/0+$/, "").replace(/\.$/, "");
}

/**
 * 取十进制指数 ⌊log₁₀⌋。
 * 刻意不用 `Math.log`：在 10^16 这类边界上浮点误差会把指数算成 15.999…，
 * 从而把「京」误判成「兆」。`toExponential` 给出的是精确的十进制指数。
 */
function decimalExponent(abs: number): number {
    return parseInt(abs.toExponential().split("e")[1], 10);
}

/** 表尾溢出的科学计数法：最多 4 位有效数字、去尾零（`1e76` / `1.235e76`）。 */
function toScientificText(abs: number): string {
    const parts = abs.toExponential(EXPONENTIAL_DECIMALS).split("e");
    return stripTrailingZeros(parts[0]) + "e" + parts[1].replace("+", "");
}

/** abs ≥ 10^4 时的单位路径。 */
function formatWithUnit(abs: number): string {
    // 先按 4 位有效数字舍入，再由舍入结果定量级：
    // 舍入本身就会把「京」以下的尾数顶到 10^4，等价于「尾数 ≥ 10000 进位到下一级」
    // （9.9996×10^7 舍入成 1.000×10^8，量级随之从「万」跳到「亿」）。
    const parts = abs.toExponential(EXPONENTIAL_DECIMALS).split("e");
    const significand = parseFloat(parts[0]);
    const exponent = parseInt(parts[1], 10);
    const index = Math.floor(exponent / UNIT_STEP_EXPONENT);
    if (index > UNIT_TOP_INDEX) {
        return toScientificText(abs);
    }
    // exponent - index * UNIT_STEP_EXPONENT ∈ [0, 3]，只放大 1/10/100/1000 倍，不丢精度。
    const mantissa = significand * Math.pow(10, exponent - index * UNIT_STEP_EXPONENT);
    // 尾数保留 4 位有效数字：整数部分占 decimalExponent + 1 位，剩下给小数。
    const decimals = EXPONENTIAL_DECIMALS - decimalExponent(mantissa);
    return stripTrailingZeros(mantissa.toFixed(decimals > 0 ? decimals : 0)) + UNIT_TEXTS[index];
}

/** 数值格式化唯一真源；既有的两个格式化入口将改为它的薄封装。 */
export class NumberUnits {
    /**
     * 把数值渲染成带中文大数单位的字符串。
     * @param value 数值
     * @param fixed 万以下保留的小数位，默认 0；万及以上忽略此参数，一律 4 位有效数字
     * @example
     * NumberUnits.format(12345)      // 1.235万
     * NumberUnits.format(1e16)       // 1京
     * NumberUnits.format(1e76)       // 1e76
     * NumberUnits.format(1234.5678, 2) // 1234.57
     */
    static format(value: number, fixed: number = 0): string {
        if (typeof value !== "number" || !isFinite(value)) {
            return String(value);
        }
        const sign = value < 0 ? "-" : "";
        const abs = Math.abs(value);
        if (abs < UNIT_THRESHOLD) {
            const text = stripTrailingZeros(abs.toFixed(fixed));
            const rounded = Number(text);
            if (rounded < UNIT_THRESHOLD) {
                // 舍入成 0 的小负数不带负号：显示「0」而不是「-0」。
                return rounded === 0 ? "0" : sign + text;
            }
            // 舍入后跨过 10^4 的万以下值转入单位路径（9999.9999 → 1万）。
            return sign + formatWithUnit(rounded);
        }
        return sign + formatWithUnit(abs);
    }
}
