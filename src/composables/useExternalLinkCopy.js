import { ref } from 'vue';
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    }
    catch {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(input);
        return ok;
    }
}
export function useExternalLinkCopy() {
    const copyToastVisible = ref(false);
    const copyToastColor = ref('#9B7BFF');
    let copyToastTimer = null;
    async function handleExternalLinkClick(item, event) {
        if (!item.emailToCopy)
            return;
        event.preventDefault();
        const ok = await copyToClipboard(item.emailToCopy);
        if (!ok)
            return;
        copyToastColor.value = item.color;
        copyToastVisible.value = true;
        if (copyToastTimer)
            clearTimeout(copyToastTimer);
        copyToastTimer = setTimeout(() => {
            copyToastVisible.value = false;
        }, 1400);
    }
    return {
        copyToastVisible,
        copyToastColor,
        handleExternalLinkClick,
    };
}
