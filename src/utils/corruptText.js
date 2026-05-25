/** 组合用变音符号，用于「乱码 / Zalgo」视觉效果 */
const MARKS = [
    '\u030d',
    '\u030e',
    '\u0304',
    '\u0305',
    '\u033f',
    '\u0310',
    '\u0311',
    '\u0312',
    '\u0313',
    '\u0314',
    '\u033d',
    '\u0301',
    '\u0302',
    '\u0303',
    '\u0308',
    '\u0307',
    '\u0342',
    '\u0343',
    '\u0344',
    '\u034a',
    '\u034b',
    '\u0489',
];
/** 随机为字符叠加组合标记，intensity 0–1 越高越乱 */
export function corruptText(text, intensity = 0.38) {
    return [...text]
        .map((ch) => {
        if (ch === ' ' || ch === '\n')
            return ch;
        if (Math.random() > intensity)
            return ch;
        let out = ch;
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i += 1) {
            out += MARKS[Math.floor(Math.random() * MARKS.length)];
        }
        return out;
    })
        .join('');
}
