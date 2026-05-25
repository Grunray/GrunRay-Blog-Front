import { ref } from 'vue';
export async function copyTextToClipboard(text) {
    if (!text)
        return false;
    try {
        await navigator.clipboard.writeText(text);
        return true;
    }
    catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    }
}
export function useCopyToClipboard() {
    const copied = ref(false);
    let resetTimer = null;
    async function copyText(text) {
        return copyTextToClipboard(text);
    }
    async function copyWithFeedback(text, ms = 1600) {
        const ok = await copyText(text);
        if (!ok)
            return false;
        copied.value = true;
        if (resetTimer)
            clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
            copied.value = false;
            resetTimer = null;
        }, ms);
        return true;
    }
    return { copied, copyText, copyWithFeedback };
}
