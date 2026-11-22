import {useEffect} from 'react';
import {soundFX} from '../utils/sound';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

function getFocusableElements(): HTMLElement[] {
  const nodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-tv-focusable="true"]'),
  );
  return nodes.filter((el) => {
    if ((el as HTMLButtonElement).disabled) return false;
    if (el.getAttribute('aria-disabled') === 'true') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

function findNextElement(
  current: HTMLElement | null,
  candidates: HTMLElement[],
  dir: Direction,
): HTMLElement | null {
  if (candidates.length === 0) return null;
  if (!current || !candidates.includes(current)) {
    return candidates[0];
  }

  const cRect = current.getBoundingClientRect();
  const cx = cRect.left + cRect.width / 2;
  const cy = cRect.top + cRect.height / 2;

  let best: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const el of candidates) {
    if (el === current) continue;
    const r = el.getBoundingClientRect();
    const tx = r.left + r.width / 2;
    const ty = r.top + r.height / 2;
    const dx = tx - cx;
    const dy = ty - cy;

    let isValid = false;
    let primary = 0;
    let secondary = 0;

    if (dir === 'RIGHT' && dx > 10) {
      isValid = true;
      primary = dx;
      secondary = Math.abs(dy);
    } else if (dir === 'LEFT' && dx < -10) {
      isValid = true;
      primary = Math.abs(dx);
      secondary = Math.abs(dy);
    } else if (dir === 'DOWN' && dy > 10) {
      isValid = true;
      primary = dy;
      secondary = Math.abs(dx);
    } else if (dir === 'UP' && dy < -10) {
      isValid = true;
      primary = Math.abs(dy);
      secondary = Math.abs(dx);
    }

    if (!isValid) continue;

    // Heavily penalize off-axis items so row/column navigation feels natural on a TV
    const score = primary + secondary * 2.4;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  return best;
}

export function focusTvElement(el: HTMLElement | null) {
  if (!el) return;
  const all = document.querySelectorAll<HTMLElement>('[data-tv-focused="true"]');
  all.forEach((node) => node.removeAttribute('data-tv-focused'));
  el.setAttribute('data-tv-focused', 'true');
  el.focus({preventScroll: false});
  el.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'smooth'});
}

interface UseTvNavigationOptions {
  screenKey: string;
  onBack?: () => void;
  onKeyEvent?: (key: string) => boolean | void;
}

export function useTvNavigation({screenKey, onBack, onKeyEvent}: UseTvNavigationOptions) {
  // Auto-focus primary element on screen change or when focused element unmounts between game phases
  useEffect(() => {
    const syncFocus = () => {
      const candidates = getFocusableElements();
      if (candidates.length === 0) return;
      const currentFocused = candidates.find(
        (el) => el.getAttribute('data-tv-focused') === 'true',
      );
      if (currentFocused && currentFocused.isConnected) return;
      const auto =
        candidates.find((el) => el.getAttribute('data-tv-autofocus') === 'true') ??
        candidates[0] ??
        null;
      focusTvElement(auto);
    };

    const timer = window.setTimeout(syncFocus, 60);
    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(syncFocus);
    });
    observer.observe(document.body, {childList: true, subtree: true});

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [screenKey]);

  // Sync mouse hover/focus with tv-focused indicator
  useEffect(() => {
    const handlePointerFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.getAttribute('data-tv-focusable') === 'true') {
        const all = document.querySelectorAll<HTMLElement>('[data-tv-focused="true"]');
        all.forEach((node) => {
          if (node !== target) node.removeAttribute('data-tv-focused');
        });
        target.setAttribute('data-tv-focused', 'true');
      }
    };
    document.addEventListener('focusin', handlePointerFocus);
    return () => document.removeEventListener('focusin', handlePointerFocus);
  }, []);

  // Global D-Pad / Remote keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTyping =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.isContentEditable;

      if (isTyping) {
        if (e.key === 'Escape') {
          e.preventDefault();
          activeEl.blur();
          soundFX.back();
        }
        return;
      }

      if (onKeyEvent) {
        const handled = onKeyEvent(e.key);
        if (handled === true) {
          e.preventDefault();
          return;
        }
      }

      let dir: Direction | null = null;
      if (e.key === 'ArrowUp') dir = 'UP';
      else if (e.key === 'ArrowDown') dir = 'DOWN';
      else if (e.key === 'ArrowLeft') dir = 'LEFT';
      else if (e.key === 'ArrowRight') dir = 'RIGHT';

      if (dir) {
        e.preventDefault();
        const candidates = getFocusableElements();
        const current =
          candidates.find((el) => el === activeEl) ??
          candidates.find((el) => el.getAttribute('data-tv-focused') === 'true') ??
          null;
        const next = findNextElement(current, candidates, dir);
        if (next) {
          focusTvElement(next);
          soundFX.navTick();
        }
        return;
      }

      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Select' || e.key === 'MediaPlayPause') {
        const candidates = getFocusableElements();
        const current =
          candidates.find((el) => el === activeEl) ??
          candidates.find((el) => el.getAttribute('data-tv-focused') === 'true') ??
          null;
        if (current) {
          e.preventDefault();
          current.click();
        }
        return;
      }

      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'BrowserBack') {
        if (onBack) {
          e.preventDefault();
          soundFX.back();
          onBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, onKeyEvent]);
}
