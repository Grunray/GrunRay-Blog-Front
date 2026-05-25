import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { setPageCorruptState } from '@/theme/pageCorruptState';
const STORAGE_THEME = 'ui.theme';
const STORAGE_THEME_ABSTRACT_UNLOCKED = 'ui.themeAbstractUnlocked';
const STORAGE_CURSOR = 'ui.cursorTrail';
/** 音乐面板是否收起：'1' 收起（关闭 UI），'0' 展开；无键时默认展开（UI 卡片可见） */
const STORAGE_MUSIC_MINIMIZED = 'ui.musicPlayerMinimized';
function readMusicPlayerMinimized() {
    const v = localStorage.getItem(STORAGE_MUSIC_MINIMIZED);
    if (v === '0')
        return false;
    if (v === '1')
        return true;
    return false;
}
const STORAGE_PHOTO_BG = 'ui.photoBackground';
/** 无键或非法值时默认开启全屏图片背景；仅显式 '0' 为关 */
function readPhotoBackground() {
    const v = localStorage.getItem(STORAGE_PHOTO_BG);
    if (v === '0')
        return false;
    if (v === '1')
        return true;
    return true;
}
function applyPhotoBgToDocument(enabled) {
    if (enabled) {
        document.documentElement.dataset.photoBg = 'true';
    }
    else {
        delete document.documentElement.dataset.photoBg;
    }
}
function readAbstractUnlocked() {
    return localStorage.getItem(STORAGE_THEME_ABSTRACT_UNLOCKED) === '1';
}
/** 浅/深公开；abstract 仅彩蛋解锁后持久化 */
function readTheme() {
    const v = localStorage.getItem(STORAGE_THEME);
    if (v === 'dark')
        return 'dark';
    if (v === 'abstract' && readAbstractUnlocked())
        return 'abstract';
    if (v === 'abstract') {
        localStorage.setItem(STORAGE_THEME, 'light');
        return 'light';
    }
    return 'light';
}
function applyThemeToDocument(theme) {
    document.documentElement.dataset.theme = theme;
}
export const useUiStore = defineStore('ui', () => {
    const theme = ref(readTheme());
    const cursorTrailEnabled = ref(localStorage.getItem(STORAGE_CURSOR) !== '0');
    const prefersReducedMotion = ref(false);
    /** 音乐播放器是否收起（仅隐藏 UI，不卸载音频）；持久化，刷新后保持上次开/关 */
    const musicPlayerMinimized = ref(readMusicPlayerMinimized());
    /** 供顶栏 🎵 状态：是否与音频播放同步 */
    const musicPlayerPlaying = ref(false);
    /** 递增以触发开屏动画重播（供顶栏 🐌 等调用） */
    const splashWoniuReplayTick = ref(0);
    /** 开屏头像飞入首页时为 true，首页头像暂时隐藏避免叠影 */
    const splashAvatarHandoff = ref(false);
    /** 全屏图片背景（与 main.css 中 html[data-photo-bg] 联动） */
    const photoBackgroundEnabled = ref(readPhotoBackground());
    /** 404 彩蛋：是否已解锁 abstract 配色 */
    const abstractThemeUnlocked = ref(readAbstractUnlocked());
    watch(theme, (t) => {
        localStorage.setItem(STORAGE_THEME, t);
        applyThemeToDocument(t);
    }, { immediate: true });
    watch(cursorTrailEnabled, (v) => {
        localStorage.setItem(STORAGE_CURSOR, v ? '1' : '0');
    });
    watch(musicPlayerMinimized, (m) => {
        localStorage.setItem(STORAGE_MUSIC_MINIMIZED, m ? '1' : '0');
    });
    watch(photoBackgroundEnabled, (v) => {
        localStorage.setItem(STORAGE_PHOTO_BG, v ? '1' : '0');
        applyPhotoBgToDocument(v);
    }, { immediate: true });
    const cursorTrailActive = computed(() => cursorTrailEnabled.value && !prefersReducedMotion.value);
    function setReducedMotion(value) {
        prefersReducedMotion.value = value;
    }
    /** 顶栏轮换：未解锁时浅/深；解锁后 浅 → 深 → 隐藏 → 浅 */
    function cycleTheme() {
        if (abstractThemeUnlocked.value) {
            if (theme.value === 'light')
                theme.value = 'dark';
            else if (theme.value === 'dark')
                theme.value = 'abstract';
            else
                theme.value = 'light';
            return;
        }
        theme.value = theme.value === 'light' ? 'dark' : 'light';
    }
    /** 指定主题（abstract 需已解锁） */
    function setTheme(t) {
        if (t === 'abstract') {
            if (!abstractThemeUnlocked.value)
                return;
            theme.value = 'abstract';
            return;
        }
        theme.value = t === 'dark' ? 'dark' : 'light';
    }
    /** 404 彩蛋：解锁并应用 abstract 隐藏配色 */
    function unlockAbstractTheme() {
        abstractThemeUnlocked.value = true;
        localStorage.setItem(STORAGE_THEME_ABSTRACT_UNLOCKED, '1');
        theme.value = 'abstract';
        setPageCorruptState(false);
    }
    function expandMusicPlayer() {
        musicPlayerMinimized.value = false;
    }
    function setMusicPlayerMinimized(v) {
        musicPlayerMinimized.value = v;
    }
    function setMusicPlayerPlaying(v) {
        musicPlayerPlaying.value = v;
    }
    function requestSplashWoniuReplay() {
        splashWoniuReplayTick.value += 1;
    }
    function setSplashAvatarHandoff(v) {
        splashAvatarHandoff.value = v;
    }
    function togglePhotoBackground() {
        photoBackgroundEnabled.value = !photoBackgroundEnabled.value;
    }
    return {
        theme,
        cursorTrailEnabled,
        prefersReducedMotion,
        cursorTrailActive,
        musicPlayerMinimized,
        musicPlayerPlaying,
        splashWoniuReplayTick,
        splashAvatarHandoff,
        photoBackgroundEnabled,
        abstractThemeUnlocked,
        setTheme,
        cycleTheme,
        unlockAbstractTheme,
        setReducedMotion,
        expandMusicPlayer,
        setMusicPlayerMinimized,
        setMusicPlayerPlaying,
        requestSplashWoniuReplay,
        setSplashAvatarHandoff,
        togglePhotoBackground,
    };
});
