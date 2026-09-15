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
  // Depend on the callbacks, not the options object: the `{}` default is a fresh
  // object every render, which made `open`/`close` new functions every render.
  const { onOpen, onClose } = options;

  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

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
export function useModalWithData<T = unknown>(options: UseModalOptions = {}) {
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
