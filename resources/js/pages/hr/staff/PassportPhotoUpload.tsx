import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTenantRouter } from '@/hooks/use-tenant-router';
import { Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

interface PassportPhotoUploadProps {
    staffUuid: string;
    currentPhotoUrl: string | null;
}

const PREVIEW_MAX = 400;
const MAX_OUTPUT_PX = 600;
const JPEG_QUALITY = 0.85;
const MAX_FILE_MB = 2;

interface ImageInfo {
    naturalWidth: number;
    naturalHeight: number;
    displayWidth: number;
    displayHeight: number;
}

interface CropBox {
    x: number;
    y: number;
    size: number;
}

/**
 * Re-encode image blob at smaller size/lower quality until under maxBytes.
 */
function recompressBlob(blob: Blob, maxBytes: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let w = img.naturalWidth;
            let h = img.naturalHeight;
            let quality = 0.8;
            const tryEncode = () => {
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas not supported'));
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(
                    (b) => {
                        if (!b) return reject(new Error('Failed to create blob'));
                        if (b.size <= maxBytes || (w <= 100 && quality <= 0.5)) return resolve(b);
                        if (quality > 0.5) {
                            quality -= 0.15;
                            tryEncode();
                        } else {
                            w = Math.max(100, Math.round(w * 0.85));
                            h = Math.max(100, Math.round(h * 0.85));
                            quality = 0.8;
                            tryEncode();
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            tryEncode();
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        img.src = url;
    });
}

/**
 * Resize image so longest side is maxPx, keep aspect ratio. Returns blob.
 */
function resizeImage(file: File, maxPx: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            const scale = maxPx / Math.max(w, h);
            const dw = Math.round(w * scale);
            const dh = Math.round(h * scale);
            const canvas = document.createElement('canvas');
            canvas.width = dw;
            canvas.height = dh;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas not supported'));
                return;
            }
            ctx.drawImage(img, 0, 0, dw, dh);
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to create blob'));
                },
                'image/jpeg',
                JPEG_QUALITY
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        img.src = url;
    });
}

/**
 * Crop image to the given box (in display coords) and return as Blob.
 * Resizes output to MAX_OUTPUT_PX and compresses to stay under upload limits.
 */
function cropImageToSquare(
    file: File,
    cropBox: CropBox,
    imageInfo: ImageInfo
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const { naturalWidth: nw, naturalHeight: nh, displayWidth: dw, displayHeight: dh } = imageInfo;
            const scale = Math.min(nw / dw, nh / dh);
            const srcSize = Math.round(cropBox.size * scale);
            const srcX = Math.round(cropBox.x * scale);
            const srcY = Math.round(cropBox.y * scale);
            const clampedSize = Math.min(srcSize, nw - srcX, nh - srcY, srcX >= 0 && srcY >= 0 ? srcSize : 0);
            const size = Math.max(1, clampedSize);
            const x = Math.max(0, Math.min(srcX, nw - size));
            const y = Math.max(0, Math.min(srcY, nh - size));

            const outSize = Math.min(size, MAX_OUTPUT_PX);
            const canvas = document.createElement('canvas');
            canvas.width = outSize;
            canvas.height = outSize;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas not supported'));
                return;
            }
            ctx.drawImage(img, x, y, size, size, 0, 0, outSize, outSize);
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to create blob'));
                },
                'image/jpeg',
                JPEG_QUALITY
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        img.src = url;
    });
}

export function PassportPhotoUpload({ staffUuid, currentPhotoUrl }: PassportPhotoUploadProps) {
    const tenantRouter = useTenantRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
    const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, size: 200 });
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dragRef = useRef<{ startX: number; startY: number; startCropX: number; startCropY: number } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setError(null);
        if (!file) {
            setSelectedFile(null);
            setImageInfo(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            return;
        }
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (JPEG, PNG, etc.).');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('Image must be under 2 MB. It will be resized and compressed for upload.');
            return;
        }
        setSelectedFile(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
        setImageInfo(null);
        setCropBox({ x: 0, y: 0, size: 200 });
    };

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        const rect = img.getBoundingClientRect();
        const displayW = Math.round(rect.width);
        const displayH = Math.round(rect.height);
        setImageInfo({ naturalWidth: nw, naturalHeight: nh, displayWidth: displayW, displayHeight: displayH });
        const size = Math.min(displayW, displayH) * 0.9;
        const x = (displayW - size) / 2;
        const y = (displayH - size) / 2;
        setCropBox({ x, y, size });
    }, []);

    const handleCropMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            if (!imageInfo) return;
            dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                startCropX: cropBox.x,
                startCropY: cropBox.y,
            };
        },
        [imageInfo, cropBox.x, cropBox.y]
    );

    const handleCropMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!dragRef.current || !imageInfo) return;
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            const maxX = imageInfo.displayWidth - cropBox.size;
            const maxY = imageInfo.displayHeight - cropBox.size;
            setCropBox((prev) => ({
                ...prev,
                x: Math.max(0, Math.min(maxX, dragRef.current!.startCropX + dx)),
                y: Math.max(0, Math.min(maxY, dragRef.current!.startCropY + dy)),
            }));
        },
        [imageInfo, cropBox.size]
    );

    const handleCropMouseUp = useCallback(() => {
        dragRef.current = null;
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleCropMouseMove);
        window.addEventListener('mouseup', handleCropMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleCropMouseMove);
            window.removeEventListener('mouseup', handleCropMouseUp);
        };
    }, [handleCropMouseMove, handleCropMouseUp]);

    const clearSelection = () => {
        setSelectedFile(null);
        setImageInfo(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleUpload = async () => {
        if (!selectedFile || !imageInfo) return;
        setUploading(true);
        setError(null);
        try {
            let blob = await cropImageToSquare(selectedFile, cropBox, imageInfo);
            const maxBytes = MAX_FILE_MB * 1024 * 1024;
            if (blob.size > maxBytes) {
                blob = await recompressBlob(blob, maxBytes);
            }
            await doUpload(blob);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process image.');
        } finally {
            setUploading(false);
        }
    };

    const doUpload = (blob: Blob) => {
        const file = new File([blob], 'passport.jpg', { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('passport_photo', file);
        return new Promise<void>((resolve, reject) => {
            router.post(tenantRouter.route('hr.staff.passport.upload', { staff: staffUuid }), formData, {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    clearSelection();
                    resolve();
                },
                onError: (errors: Record<string, string>) => {
                    setError(Object.values(errors).join(' ') || 'Upload failed. Try a smaller image (under 2 MB).');
                    reject(new Error('Upload failed'));
                },
                onFinish: () => {},
            });
        });
    };

    return (
        <div className="space-y-3">
            <Label>Passport photo</Label>
            {currentPhotoUrl && !selectedFile && (
                <div className="flex items-start gap-3">
                    <img
                        src={currentPhotoUrl}
                        alt="Current passport"
                        className="h-24 w-24 rounded-lg border object-cover"
                    />
                    <p className="text-sm text-muted-foreground">Current photo on file. Upload a new image to replace.</p>
                </div>
            )}
            {previewUrl && selectedFile && (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Drag the square to choose the area to crop. Then click Crop & upload. Image is resized to keep upload under 2 MB.
                    </p>
                    <div
                        ref={containerRef}
                        className="relative inline-block max-h-[320px] max-w-full overflow-hidden rounded-lg border bg-muted/30"
                    >
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="block max-h-[280px] max-w-full object-contain"
                            onLoad={onImageLoad}
                        />
                        {imageInfo && (
                            <>
                                <div className="pointer-events-none absolute inset-0">
                                    <div className="absolute left-0 top-0 bg-black/45" style={{ width: imageInfo.displayWidth, height: cropBox.y }} />
                                    <div className="absolute bg-black/45" style={{ left: 0, top: cropBox.y, width: cropBox.x, height: cropBox.size }} />
                                    <div className="absolute bg-black/45" style={{ left: cropBox.x + cropBox.size, top: cropBox.y, width: imageInfo.displayWidth - cropBox.x - cropBox.size, height: cropBox.size }} />
                                    <div className="absolute left-0 bg-black/45" style={{ top: cropBox.y + cropBox.size, width: imageInfo.displayWidth, height: imageInfo.displayHeight - cropBox.y - cropBox.size }} />
                                </div>
                                <div
                                    className="absolute cursor-move rounded-lg border-2 border-primary bg-primary/10"
                                    style={{
                                        left: cropBox.x,
                                        top: cropBox.y,
                                        width: cropBox.size,
                                        height: cropBox.size,
                                    }}
                                    onMouseDown={handleCropMouseDown}
                                />
                            </>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleUpload}
                            disabled={uploading || !imageInfo}
                        >
                            {uploading ? 'Uploading…' : (
                                <>
                                    <Upload className="mr-1.5 h-4 w-4" />
                                    Crop & upload
                                </>
                            )}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={clearSelection} disabled={uploading}>
                            <X className="mr-1.5 h-4 w-4" />
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
            {!selectedFile && (
                <div className="space-y-1.5">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="border-input file:text-foreground flex h-9 max-w-xs rounded-md border bg-transparent px-3 py-1 text-sm file:inline-flex file:border-0 file:bg-transparent file:font-medium"
                    />
                    <p className="text-xs text-muted-foreground">Max 2 MB; will be resized for upload.</p>
                </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

