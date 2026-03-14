import { useEffect, type RefObject } from 'react';

export const useModalClose = (
    isOpen: boolean,
    onClose: () => void,
    modalRef: RefObject<HTMLDivElement | null>
) => {
    useEffect(() => {
        if (!isOpen) return;

        const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
            const isMobile = window.innerWidth <= 768;
            if (isMobile && modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            const isMobile = window.innerWidth <= 768;
            if (!isMobile && e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose, modalRef]);
};
