function calcCrc(buffer: number[]): number {
    let result = 0;

    buffer.forEach((v: number) => result ^= v);

    result ^= 254;

    return result;
}
