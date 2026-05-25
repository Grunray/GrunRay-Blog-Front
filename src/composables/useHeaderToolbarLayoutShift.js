/** 顶栏工具槽 FLIP：消失后再移动 / 先移动再出现（overshoot 回弹） */
const FLIP_DURATION_MS = 440;
export function captureToolbarFlipSlots(root) {
    const map = new Map();
    if (!root)
        return map;
    root.querySelectorAll('[data-toolbar-flip]').forEach((el) => {
        const id = el.dataset.toolbarFlip;
        if (!id)
            return;
        const r = el.getBoundingClientRect();
        if (r.width < 0.5 && r.height < 0.5)
            return;
        map.set(id, r);
    });
    return map;
}
function overshootKeyframes(dx, dy) {
    const ox = -dx * 0.14;
    const oy = -dy * 0.14;
    return [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: `translate(${ox}px, ${oy}px)`, offset: 0.68 },
        { transform: 'translate(0px, 0px)' },
    ];
}
export function playToolbarFlipAfterRemove(before, root, prefersReducedMotion) {
    if (prefersReducedMotion || !root || before.size === 0)
        return Promise.resolve();
    const after = captureToolbarFlipSlots(root);
    const tasks = [];
    before.forEach((rB, id) => {
        const rA = after.get(id);
        const el = root.querySelector(`[data-toolbar-flip="${id}"]`);
        if (!rA || !el || rA.width < 0.5 || rA.height < 0.5)
            return;
        const dx = rB.left - rA.left;
        const dy = rB.top - rA.top;
        if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35)
            return;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        tasks.push(new Promise((resolve) => {
            requestAnimationFrame(() => {
                const anim = el.animate(overshootKeyframes(dx, dy), {
                    duration: FLIP_DURATION_MS,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                });
                anim.onfinish = () => {
                    el.style.transform = '';
                    resolve();
                };
            });
        }));
    });
    return tasks.length ? Promise.all(tasks).then(() => undefined) : Promise.resolve();
}
/** 从「未出现槽位」布局过渡到「已出现」布局：对槽位做 FLIP（可跳过新出现的槽 id，如 photo） */
export function playToolbarFlipBeforeReveal(narrow, wide, root, prefersReducedMotion, skipIds = new Set()) {
    if (prefersReducedMotion || !root || narrow.size === 0)
        return Promise.resolve();
    const tasks = [];
    narrow.forEach((rN, id) => {
        if (skipIds.has(id))
            return;
        const rW = wide.get(id);
        const el = root.querySelector(`[data-toolbar-flip="${id}"]`);
        if (!rW || !el)
            return;
        const dx = rN.left - rW.left;
        const dy = rN.top - rW.top;
        if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35)
            return;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        tasks.push(new Promise((resolve) => {
            requestAnimationFrame(() => {
                const anim = el.animate(overshootKeyframes(dx, dy), {
                    duration: FLIP_DURATION_MS,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                });
                anim.onfinish = () => {
                    el.style.transform = '';
                    resolve();
                };
            });
        }));
    });
    return tasks.length ? Promise.all(tasks).then(() => undefined) : Promise.resolve();
}
