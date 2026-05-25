import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUiStore } from '@/stores/ui';
import { FOOTER_REFRESH_EVENT, isXiqiSplitFooterLocked, } from '@/composables/useXiqiSplitFooter';
const SLICE_COUNT = 20;
const POINTER_RX = 105;
const POINTER_RY = 72;
const MAX_SLICE_SHIFT = 26;
const WORD_RATIO = (7 * 896) / 960;
/** 与 footer-grunray.css --footer-grunray-brand-height 一致，避免滚动中改 padding 造成跳动 */
const BRAND_HEIGHT_PX = 360;
const REVEAL_SPACE_PX = Math.ceil(BRAND_HEIGHT_PX * 1.12);
/** 超过此进度：页脚抬到 .app-page-cover 之上，避免蒙层与 padding 区挡住拖影 */
const FOOTER_OVER_COVER_PROGRESS = 0.08;
const PROGRESS_EPS = 0.004;
function clamp01(n) {
    return Math.min(1, Math.max(0, n));
}
function footerRevealThreshold() {
    return Math.max(96, REVEAL_SPACE_PX * 0.72);
}
export function useFooterGrunRayReveal(_footerRootRef, brandWordRef) {
    const route = useRoute();
    const ui = useUiStore();
    /** ICP 胶囊：Eric-Terminal footer-inner glass-panel，进入页脚区即 is-visible + CSS 过渡 */
    const metaBarVisible = ref(false);
    const isInteractive = ref(false);
    const isFullyRevealed = ref(false);
    let revealRaf = 0;
    let distortRaf = 0;
    let scrollIdleTimer = null;
    let contentResizeObserver = null;
    let smoothedProgress = 0;
    let lastWrittenProgress = -1;
    let lastOverCover = false;
    let lastRevealing = false;
    let sliceEls = [];
    let targetOffsets = [];
    let currentOffsets = [];
    let pointerActive = false;
    let metricsApplied = false;
    const applyRevealState = (progress, ready, remaining) => {
        if (Math.abs(progress - lastWrittenProgress) > 0.0001) {
            document.documentElement.style.setProperty('--reveal-progress', String(progress));
            lastWrittenProgress = progress;
        }
        const nextMetaVisible = remaining <= footerRevealThreshold();
        if (metaBarVisible.value !== nextMetaVisible)
            metaBarVisible.value = nextMetaVisible;
        if (isInteractive.value !== ready)
            isInteractive.value = ready;
        if (isFullyRevealed.value !== ready)
            isFullyRevealed.value = ready;
        const nextOverCover = progress >= FOOTER_OVER_COVER_PROGRESS;
        if (nextOverCover !== lastOverCover) {
            if (nextOverCover) {
                document.documentElement.setAttribute('data-footer-over-cover', '');
            }
            else {
                document.documentElement.removeAttribute('data-footer-over-cover');
            }
            lastOverCover = nextOverCover;
        }
        const nextRevealing = progress > 0.001 && progress < 0.999;
        if (nextRevealing !== lastRevealing) {
            if (nextRevealing) {
                document.documentElement.setAttribute('data-footer-revealing', '');
            }
            else {
                document.documentElement.removeAttribute('data-footer-revealing');
            }
            lastRevealing = nextRevealing;
        }
    };
    const syncBrandLayout = () => {
        const brandWord = brandWordRef.value;
        if (!brandWord)
            return;
        const content = brandWord.closest('.footer-grunray-content');
        if (!content || content.clientWidth < 1)
            return;
        const rootStyles = getComputedStyle(document.documentElement);
        const maxHRaw = rootStyles.getPropertyValue('--footer-grunray-block-max-height');
        const maxH = parseFloat(maxHRaw) || 280;
        const availW = content.clientWidth;
        let height = Math.min(maxH, availW / WORD_RATIO);
        let width = height * WORD_RATIO;
        if (width > availW) {
            width = availW;
            height = width / WORD_RATIO;
        }
        document.documentElement.style.setProperty('--brand-word-width', `${width.toFixed(2)}px`);
        document.documentElement.style.setProperty('--brand-word-height', `${height.toFixed(2)}px`);
    };
    /** 固定预留滚动区，不在滚动帧里读 getBoundingClientRect，避免 scrollHeight 突变卡顿 */
    const applyFooterMetrics = () => {
        const revealSpace = isXiqiSplitFooterLocked() ? 0 : REVEAL_SPACE_PX;
        document.documentElement.style.setProperty('--footer-reveal-space', `${revealSpace}px`);
        document.documentElement.style.setProperty('--footer-grunray-brand-height', `${BRAND_HEIGHT_PX}px`);
        syncBrandLayout();
        metricsApplied = true;
    };
    const applyXiqiSplitFooterSuppressed = () => {
        smoothedProgress = 0;
        lastWrittenProgress = -1;
        applyRevealState(0, false, REVEAL_SPACE_PX + 999);
    };
    const onFooterRefresh = () => {
        applyFooterMetrics();
        if (isXiqiSplitFooterLocked()) {
            applyXiqiSplitFooterSuppressed();
            return;
        }
        requestScrollUpdate();
    };
    const getScrollMetrics = () => {
        const threshold = footerRevealThreshold();
        const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
        const progress = clamp01(1 - remaining / threshold);
        const atBottom = remaining <= 12;
        return { threshold, remaining, progress, atBottom };
    };
    const finalizeFooterAtBottom = () => {
        if (isXiqiSplitFooterLocked())
            return;
        smoothedProgress = 1;
        const { remaining } = getScrollMetrics();
        applyRevealState(1, true, remaining);
        syncBrandLayout();
    };
    const updateScrollReveal = () => {
        if (!metricsApplied)
            applyFooterMetrics();
        if (isXiqiSplitFooterLocked()) {
            applyXiqiSplitFooterSuppressed();
            return { progress: 0, remaining: REVEAL_SPACE_PX + 999 };
        }
        const reducedMotion = ui.prefersReducedMotion;
        const { remaining, progress, atBottom } = getScrollMetrics();
        if (reducedMotion || atBottom || progress >= 0.998) {
            smoothedProgress = 1;
        }
        else if (progress > smoothedProgress) {
            const delta = progress - smoothedProgress;
            const ease = delta > 0.35 ? 0.62 : delta > 0.12 ? 0.42 : 0.28;
            smoothedProgress += delta * ease;
            if (Math.abs(progress - smoothedProgress) < PROGRESS_EPS)
                smoothedProgress = progress;
        }
        else {
            smoothedProgress += (progress - smoothedProgress) * 0.24;
            if (Math.abs(progress - smoothedProgress) < PROGRESS_EPS)
                smoothedProgress = progress;
        }
        const ready = remaining <= footerRevealThreshold() &&
            (atBottom || progress >= 0.97 || smoothedProgress >= 0.985);
        applyRevealState(smoothedProgress, ready, remaining);
        if (ready)
            syncBrandLayout();
        return { progress, remaining };
    };
    const needsRevealLoop = (progress, remaining) => {
        const inZone = remaining <= footerRevealThreshold();
        if (Math.abs(progress - smoothedProgress) > PROGRESS_EPS)
            return true;
        if (inZone && smoothedProgress < progress - PROGRESS_EPS)
            return true;
        if (inZone && smoothedProgress > progress + PROGRESS_EPS)
            return true;
        return false;
    };
    const tickReveal = () => {
        revealRaf = 0;
        const { progress, remaining } = updateScrollReveal();
        if (needsRevealLoop(progress, remaining)) {
            revealRaf = requestAnimationFrame(tickReveal);
        }
    };
    const requestScrollUpdate = () => {
        if (revealRaf)
            return;
        revealRaf = requestAnimationFrame(tickReveal);
    };
    const onScrollIdle = () => {
        if (isXiqiSplitFooterLocked())
            return;
        const { remaining } = getScrollMetrics();
        if (remaining <= 64)
            finalizeFooterAtBottom();
    };
    const onScroll = () => {
        requestScrollUpdate();
        if (scrollIdleTimer)
            window.clearTimeout(scrollIdleTimer);
        scrollIdleTimer = window.setTimeout(onScrollIdle, 100);
    };
    const onResize = () => {
        applyFooterMetrics();
        requestScrollUpdate();
    };
    const computeTargets = (clientX, clientY) => {
        for (let i = 0; i < sliceEls.length; i++) {
            const entry = sliceEls[i];
            const rect = entry.band.getBoundingClientRect();
            if (rect.width < 1 || rect.height < 1) {
                targetOffsets[i] = 0;
                continue;
            }
            const cx = rect.left + rect.width * 0.5;
            const cy = rect.top + rect.height * 0.5;
            const dx = clientX - cx;
            const dy = clientY - cy;
            const norm = (dx * dx) / (POINTER_RX * POINTER_RX) + (dy * dy) / (POINTER_RY * POINTER_RY);
            if (norm > 1) {
                targetOffsets[i] = 0;
                continue;
            }
            let influence = 1 - norm;
            influence = influence * influence * (3 - 2 * influence);
            const t = entry.sliceIndex / Math.max(1, SLICE_COUNT - 1);
            const wave = Math.sin(t * Math.PI * 3.2 + clientX * 0.035 + entry.sliceIndex * 0.55);
            const shear = (dx / POINTER_RX) * MAX_SLICE_SHIFT * 0.35;
            targetOffsets[i] = (wave * MAX_SLICE_SHIFT * 0.55 + shear) * influence;
        }
    };
    const resetTargets = () => {
        for (let i = 0; i < targetOffsets.length; i++)
            targetOffsets[i] = 0;
    };
    const tickDistortion = () => {
        distortRaf = 0;
        const ease = ui.prefersReducedMotion ? 1 : 0.2;
        let settled = true;
        for (let i = 0; i < sliceEls.length; i++) {
            const diff = targetOffsets[i] - currentOffsets[i];
            if (Math.abs(diff) > 0.05)
                settled = false;
            currentOffsets[i] += diff * ease;
            sliceEls[i].inner.style.setProperty('--slice-offset', `${currentOffsets[i].toFixed(2)}px`);
        }
        if (!settled || pointerActive)
            distortRaf = requestAnimationFrame(tickDistortion);
    };
    const requestDistortTick = () => {
        if (!distortRaf)
            distortRaf = requestAnimationFrame(tickDistortion);
    };
    const onPointerMove = (e) => {
        if (!isInteractive.value)
            return;
        pointerActive = true;
        computeTargets(e.clientX, e.clientY);
        requestDistortTick();
    };
    const onPointerEnter = () => {
        if (!isInteractive.value)
            return;
        pointerActive = false;
        resetTargets();
        requestDistortTick();
    };
    const onPointerLeave = () => {
        pointerActive = false;
        resetTargets();
        requestDistortTick();
    };
    const registerSlices = (entries) => {
        sliceEls = entries;
        targetOffsets = entries.map(() => 0);
        currentOffsets = entries.map(() => 0);
    };
    const bindBrandPointer = () => {
        const brandWord = brandWordRef.value;
        if (!brandWord)
            return;
        brandWord.addEventListener('pointerenter', onPointerEnter);
        brandWord.addEventListener('pointermove', onPointerMove, { passive: true });
        brandWord.addEventListener('pointerleave', onPointerLeave);
        brandWord.addEventListener('pointercancel', onPointerLeave);
    };
    const unbindBrandPointer = () => {
        const brandWord = brandWordRef.value;
        if (!brandWord)
            return;
        brandWord.removeEventListener('pointerenter', onPointerEnter);
        brandWord.removeEventListener('pointermove', onPointerMove);
        brandWord.removeEventListener('pointerleave', onPointerLeave);
        brandWord.removeEventListener('pointercancel', onPointerLeave);
    };
    onMounted(() => {
        applyFooterMetrics();
        void nextTick(() => {
            bindBrandPointer();
            requestScrollUpdate();
        });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        window.addEventListener(FOOTER_REFRESH_EVENT, onFooterRefresh);
        if (typeof ResizeObserver !== 'undefined') {
            contentResizeObserver = new ResizeObserver(() => {
                syncBrandLayout();
            });
            const contentEl = brandWordRef.value?.closest('.footer-grunray-content');
            if (contentEl)
                contentResizeObserver.observe(contentEl);
        }
        if ('onscrollend' in window) {
            window.addEventListener('scrollend', onScrollIdle, { passive: true });
        }
    });
    watch(() => route.fullPath, () => {
        void nextTick(() => {
            applyFooterMetrics();
            requestScrollUpdate();
        });
    });
    watch(brandWordRef, (el) => {
        if (!el)
            return;
        void nextTick(() => {
            unbindBrandPointer();
            bindBrandPointer();
            contentResizeObserver?.disconnect();
            if (typeof ResizeObserver !== 'undefined') {
                contentResizeObserver = new ResizeObserver(() => syncBrandLayout());
                const contentEl = el.closest('.footer-grunray-content');
                if (contentEl)
                    contentResizeObserver.observe(contentEl);
            }
            requestScrollUpdate();
        });
    }, { flush: 'post' });
    onUnmounted(() => {
        if (revealRaf)
            cancelAnimationFrame(revealRaf);
        if (distortRaf)
            cancelAnimationFrame(distortRaf);
        if (scrollIdleTimer)
            window.clearTimeout(scrollIdleTimer);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        window.removeEventListener(FOOTER_REFRESH_EVENT, onFooterRefresh);
        window.removeEventListener('scrollend', onScrollIdle);
        contentResizeObserver?.disconnect();
        unbindBrandPointer();
        document.documentElement.style.removeProperty('--reveal-progress');
        document.documentElement.style.removeProperty('--footer-reveal-space');
        document.documentElement.style.removeProperty('--footer-grunray-brand-height');
        document.documentElement.style.removeProperty('--brand-word-width');
        document.documentElement.style.removeProperty('--brand-word-height');
        document.documentElement.removeAttribute('data-footer-over-cover');
        document.documentElement.removeAttribute('data-footer-revealing');
    });
    return {
        metaBarVisible,
        isInteractive,
        isFullyRevealed,
        registerSlices,
        syncBrandLayout,
        requestScrollUpdate,
    };
}
