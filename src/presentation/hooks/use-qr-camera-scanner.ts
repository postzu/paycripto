'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

/**
 * Result of a QR code scan
 */
export interface QrScanResult {
    address: string;
    amount?: string;
    asset?: string;
}

/**
 * Camera error messages
 */
export const CameraErrorMessages = {
    HTTPS_REQUIRED: 'Para usar a câmera, abra esta página em HTTPS (ou localhost) e permita o acesso quando o navegador solicitar.',
    NOT_SUPPORTED: 'Seu navegador não oferece acesso à câmera. Atualize o app/navegador ou libere a permissão nas configurações.',
    PERMISSION_DENIED: 'Precisamos da sua permissão para usar a câmera. Libere o acesso nas configurações do navegador/aparelho e tente novamente.',
    NOT_FOUND: 'Nenhuma câmera foi encontrada neste dispositivo ou está bloqueada. Conecte uma câmera ou libere a permissão e tente novamente.',
    IN_USE: 'Outra aplicação está usando a câmera. Feche-a e tente novamente.',
    GENERIC: 'Não foi possível acessar a câmera. Verifique as permissões do aplicativo/navegador.',
    INVALID_QR: 'QR Code inválido ou formato não suportado. Certifique-se de que o QR contenha um endereço válido.',
} as const;

/**
 * Parses EIP-681 Ethereum URLs
 * https://eips.ethereum.org/EIPS/eip-681
 */
export function parseEthereumUrl(data: string): { address: string; amount?: string } {
    let address = data;
    let amount: string | undefined;

    if (data.toLowerCase().startsWith('ethereum:')) {
        const parts = data.split('?');
        const path = parts[0].replace(/^ethereum:/i, '');
        address = path.split('@')[0];

        if (parts.length > 1) {
            const params = new URLSearchParams(parts[1]);
            const amountParam = params.get('amount');
            if (amountParam) {
                amount = amountParam;
            }
        }
    }

    return { address, amount };
}

/**
 * Checks if environment supports camera access
 */
export function checkCameraSupport(): { supported: boolean; errorMessage?: string } {
    if (typeof window === 'undefined') {
        return { supported: false, errorMessage: CameraErrorMessages.NOT_SUPPORTED };
    }

    const isSecure = window.isSecureContext;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (!isSecure && !isLocalhost) {
        return { supported: false, errorMessage: CameraErrorMessages.HTTPS_REQUIRED };
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return { supported: false, errorMessage: CameraErrorMessages.NOT_SUPPORTED };
    }

    return { supported: true };
}

/**
 * Maps DOM exceptions to user-friendly error messages
 */
export function mapCameraError(error: unknown): string {
    const domError = error as DOMException;

    switch (domError?.name) {
        case 'NotAllowedError':
            return CameraErrorMessages.PERMISSION_DENIED;
        case 'NotFoundError':
            return CameraErrorMessages.NOT_FOUND;
        case 'NotReadableError':
            return CameraErrorMessages.IN_USE;
        default:
            return CameraErrorMessages.GENERIC;
    }
}

export interface UseQrCameraScannerOptions {
    /** Called when a valid QR code is scanned */
    onScan: (result: QrScanResult) => void;
    /** Called when an invalid QR is detected */
    onError?: (message: string) => void;
    /** Function to validate/normalize addresses */
    normalizeAddress: (address: string) => string | null;
}

export interface UseQrCameraScannerReturn {
    /** Ref to attach to the video element */
    videoRef: React.RefObject<HTMLVideoElement | null>;
    /** Ref to attach to the canvas element (hidden) */
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    /** Whether the scanner modal is open */
    isOpen: boolean;
    /** Open the scanner modal */
    open: () => void;
    /** Close the scanner modal */
    close: () => void;
    /** Current error message, if any */
    error: string | null;
    /** Clear the current error */
    clearError: () => void;
}

/**
 * Custom hook for QR code camera scanning
 * 
 * Follows Single Responsibility Principle:
 * - Only handles camera access and QR code detection
 * - Delegates address handling to parent via callbacks
 * 
 * @example
 * const scanner = useQrCameraScanner({
 *   onScan: (result) => console.log('Scanned:', result),
 *   normalizeAddress: (addr) => getAddress(addr)
 * });
 */
export function useQrCameraScanner({
    onScan,
    onError,
    normalizeAddress,
}: UseQrCameraScannerOptions): UseQrCameraScannerReturn {
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processFrameRef = useRef<() => void>(() => { });

    // Stop the camera and cleanup
    const stopCamera = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, []);

    // Process a frame and look for QR codes
    const processFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !isOpen) {
            return;
        }

        if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
            animationFrameRef.current = requestAnimationFrame(processFrame);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            animationFrameRef.current = requestAnimationFrame(processFrame);
            return;
        }

        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
            const { address, amount } = parseEthereumUrl(code.data);
            const normalizedAddress = normalizeAddress(address);

            if (normalizedAddress) {
                stopCamera();
                setIsOpen(false);
                onScan({ address: normalizedAddress, amount });
                return;
            } else {
                setError(CameraErrorMessages.INVALID_QR);
                onError?.(CameraErrorMessages.INVALID_QR);
            }
        }

        animationFrameRef.current = requestAnimationFrame(processFrame);
    }, [isOpen, normalizeAddress, onScan, onError, stopCamera]);

    // Start the camera
    const startCamera = useCallback(async () => {
        setError(null);

        const support = checkCameraSupport();
        if (!support.supported) {
            setError(support.errorMessage!);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true');
                await videoRef.current.play();
                animationFrameRef.current = requestAnimationFrame(processFrame);
            }
        } catch (err) {
            console.error('Camera error:', err);
            const errorMessage = mapCameraError(err);
            setError(errorMessage);
        }
    }, [processFrame]);

    // Handle modal open/close
    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
            setError(null);
        }

        return () => {
            stopCamera();
        };
    }, [isOpen, startCamera, stopCamera]);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const clearError = useCallback(() => setError(null), []);

    return {
        videoRef,
        canvasRef,
        isOpen,
        open,
        close,
        error,
        clearError,
    };
}
