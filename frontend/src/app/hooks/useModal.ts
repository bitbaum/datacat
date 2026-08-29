'use client';

import { useState, useCallback, useMemo } from 'react';

interface UseModalOptions {
  defaultOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useModal(options: UseModalOptions = {}): UseModalReturn {
  const [isOpen, setIsOpen] = useState(options.defaultOpen || false);

  const open = useCallback(() => {
    setIsOpen(true);
    options.onOpen?.();
  }, [options]);

  const close = useCallback(() => {
    setIsOpen(false);
    options.onClose?.();
  }, [options]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

// Hook for managing multiple modals
export function useModals<T extends string>(modalNames: T[]): Record<T, UseModalReturn> {
  return useMemo(() => {
    const modals = {} as Record<T, UseModalReturn>;
    modalNames.forEach((name) => {
      modals[name] = {
        isOpen: false,
        open: () => {},
        close: () => {},
        toggle: () => {},
      };
    });
    return modals;
  }, [modalNames]);
}

// Hook for modal with data
export function useModalWithData<T = any>(options: UseModalOptions = {}) {
  const modal = useModal(options);
  const [data, setData] = useState<T | null>(null);

  const openWithData = useCallback(
    (modalData: T) => {
      setData(modalData);
      modal.open();
    },
    [modal],
  );

  const closeAndClearData = useCallback(() => {
    modal.close();
    setData(null);
  }, [modal]);

  return {
    ...modal,
    data,
    openWithData,
    closeAndClearData,
    setData,
  };
}
