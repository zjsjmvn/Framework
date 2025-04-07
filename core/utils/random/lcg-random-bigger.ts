/**
 * 线性同余随机数生成器（LCG, Linear Congruential Generator）
 * 使用 Hull-Dobell 定理保证最大周期，适用于伪随机数生成
 * 通过 BigInt 计算避免数值溢出问题
 */
export default class LCGRandom {
    // 使用 BigInt 存储种子，避免 Number 类型的精度问题
    private seed: bigint;

    /**
     * 构造函数，初始化随机种子
     * @param seed - 初始种子值（Number 类型，会自动转为 BigInt）
     */
    constructor(seed: number) {
        // 将输入的 Number 类型种子转为 BigInt 类型存储
        this.seed = BigInt(seed);
    }

    /**
     * 生成 [min, max) 范围内的随机浮点数（左闭右开区间）
     * @param min - 最小值（包含）
     * @param max - 最大值（不包含）
     * @returns 范围内的随机浮点数
     */
    next(min: number = 0, max: number = 1): number {
        // LCG 核心算法：X_n+1 = (a * X_n + c) mod m
        // 这里使用经典参数：
        // a = 1103515245, c = 12345, m = 2^31 (2147483648)
        this.seed = (this.seed * 1103515245n + 12345n) % 2147483648n;

        // 将结果归一化到 [0, 1) 范围
        const rnd = Number(this.seed) / 2147483648;

        // 映射到 [min, max) 范围
        return min + rnd * (max - min);
    }

    /**
     * 生成 [min, max] 范围内的随机整数（左闭右闭区间）
     * @param min - 最小值（包含）
     * @param max - 最大值（包含）
     * @returns 范围内的随机整数
     */
    nextInt(min: number, max: number): number {
        // 先更新种子（与 next() 方法相同的计算过程）
        this.seed = (this.seed * 1103515245n + 12345n) % 2147483648n;

        // 将结果归一化到 [0, 1) 范围
        const rnd = Number(this.seed) / 2147483648;

        // 计算整数范围（注意要 +1 因为两边都包含）
        const range = max - min + 1;

        // 映射到 [min, max] 范围，使用 Math.floor 确保是整数
        return min + Math.floor(rnd * range);
    }
}