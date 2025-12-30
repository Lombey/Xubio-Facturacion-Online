// @ts-check
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDropdown } from '../useDropdown.js';

describe('useDropdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('debe abrir y cerrar el dropdown', () => {
    const { isOpen, open, close } = useDropdown();
    
    expect(isOpen.value).toBe(false);
    open();
    expect(isOpen.value).toBe(true);
    close();
    expect(isOpen.value).toBe(false);
  });

  it('debe cerrar después del delay en blur', () => {
    const { isOpen, handleBlur } = useDropdown({ blurDelay: 200 });
    
    isOpen.value = true;
    handleBlur();
    
    expect(isOpen.value).toBe(true);
    vi.advanceTimersByTime(200);
    expect(isOpen.value).toBe(false);
  });

  it('debe cancelar el blur si hay focus', () => {
    const { isOpen, handleBlur, handleFocus } = useDropdown({ blurDelay: 200 });
    
    isOpen.value = true;
    handleBlur();
    handleFocus(); // Cancela el blur
    
    vi.advanceTimersByTime(200);
    expect(isOpen.value).toBe(true);
  });
});
