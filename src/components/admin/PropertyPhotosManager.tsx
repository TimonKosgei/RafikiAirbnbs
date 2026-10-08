import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { PropertyImage } from '../../types';
import { processImageFile } from '../../lib/images/upload';

interface PropertyPhotosManagerProps {
  images: PropertyImage[];
  propertyId?: string;
  propertyName?: string;
  onChange: (images: PropertyImage[]) => void;
}

const SAMPLE_PHOTO_PRESETS = [
  {
    name: 'Modern Living Room',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80',
    alt: 'Sunlit modern living room with skyline view',
  },
  {
    name: 'Serene Master Bedroom',
    url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1400&q=80',
    alt: 'Master bedroom with crisp white organic linens',
  },
  {
    name: 'Garden Veranda',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
    alt: 'Cedar veranda overlooking private courtyard',
  },
  {
    name: 'Executive Workspace',
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80',
    alt: 'Solid oak workstation with high-speed fiber connectivity',
  },
  {
    name: 'Rooftop Pool',
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=80',
    alt: 'Heated rooftop plunge pool at golden hour',
  },
];

export const PropertyPhotosManager: React.FC<PropertyPhotosManagerProps> = ({
  images,
  propertyId = 'new',
  propertyName = 'Property',
  onChange,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const newImages: PropertyImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const processed = await processImageFile(file);
        const imageId = `img-upload-${Date.now()}-${i}`;
        const isFirst = images.length === 0 && newImages.length === 0;

        newImages.push({
          id: imageId,
          property_id: propertyId,
          url: processed.url,
          alt: `${propertyName} - ${file.name.replace(/\.[^/.]+$/, '')}`,
          is_cover: isFirst,
          display_order: images.length + newImages.length,
        });
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to process one or more images.'
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput.trim());
    } catch {
      setErrorMessage('Please enter a valid HTTP or HTTPS image URL.');
      return;
    }

    setErrorMessage(null);
    const isFirst = images.length === 0;
    const newImage: PropertyImage = {
      id: `img-url-${Date.now()}`,
      property_id: propertyId,
      url: urlInput.trim(),
      alt: altInput.trim() || `${propertyName} photo`,
      is_cover: isFirst,
      display_order: images.length,
    };

    onChange([...images, newImage]);
    setUrlInput('');
    setAltInput('');
  };

  const handleAddPreset = (preset: (typeof SAMPLE_PHOTO_PRESETS)[0]) => {
    const isFirst = images.length === 0;
    const newImage: PropertyImage = {
      id: `img-preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      property_id: propertyId,
      url: preset.url,
      alt: `${propertyName} - ${preset.alt}`,
      is_cover: isFirst,
      display_order: images.length,
    };
    onChange([...images, newImage]);
  };

  const setCover = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      is_cover: i === index,
    }));
    onChange(updated);
  };

  const removeImage = (index: number) => {
    const wasCover = images[index]?.is_cover;
    const updated = images.filter((_, i) => i !== index);

    // If removed image was cover, assign cover to the first remaining image
    if (wasCover && updated.length > 0) {
      updated[0].is_cover = true;
    }

    // Re-index display_order
    const reindexed = updated.map((img, i) => ({
      ...img,
      display_order: i,
    }));

    onChange(reindexed);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const reindexed = reordered.map((img, i) => ({
      ...img,
      display_order: i,
    }));

    onChange(reindexed);
  };

  const updateAlt = (index: number, alt: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], alt };
    onChange(updated);
  };

  return (
    <div className="space-y-4 rounded-xl bg-white border border-[#1A1D1B]/12 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1A1D1B]/10 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1D1B] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#2C4C3E]" />
            <span>Property Photography & Gallery ({images.length})</span>
          </h3>
          <p className="text-xs text-[#5C5F58]">
            Upload real photos from your computer, paste image URLs, or choose curated architectural presets.
          </p>
        </div>
        <span className="text-xs font-mono-num text-[#5C5F58] bg-[#F2EFE9] px-2.5 py-1 rounded">
          {images.filter((i) => i.is_cover).length ? 'Cover Selected' : 'No Cover Selected'}
        </span>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/20 text-xs text-[#DC2626]">
          {errorMessage}
        </div>
      )}

      {/* 1. DIRECT FILE UPLOAD ZONE */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#2C4C3E] bg-[#2C4C3E]/5 scale-[0.99]'
            : 'border-[#1A1D1B]/20 bg-[#FBF9F5] hover:border-[#2C4C3E] hover:bg-[#F2EFE9]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#2C4C3E]/10 flex items-center justify-center text-[#2C4C3E]">
            <Upload className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#1A1D1B]">
              {isProcessing ? 'Processing & Optimizing Image...' : 'Click to upload photos from your computer'}
            </p>
            <p className="text-[11px] text-[#5C5F58] mt-0.5">
              Supports JPEG, PNG, and WebP (Multiple files supported, auto-optimized)
            </p>
          </div>
        </div>
      </div>

      {/* 2. PASTE URL & QUICK PRESETS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
        <div className="md:col-span-7">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-[#5C5F58]">
              Or Add via Direct Web Image URL:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-3.5 h-3.5 text-[#5C5F58] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#1A1D1B]/15 text-xs bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleAddUrl}
                disabled={!urlInput.trim()}
                className="h-9 px-3.5 rounded-lg bg-[#2C4C3E] text-white text-xs font-semibold hover:bg-[#223B30] disabled:opacity-40 transition-colors shrink-0 cursor-pointer"
              >
                Add URL
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-5">
          <label className="block text-[11px] font-medium text-[#5C5F58] mb-1.5">
            Add Sample Hospitality Photos:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PHOTO_PRESETS.slice(0, 3).map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleAddPreset(preset)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F2EFE9] hover:bg-[#E5DFD3] text-[11px] font-medium text-[#1A1D1B] border border-[#1A1D1B]/10 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#2C4C3E]" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CURRENT GALLERY GRID */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#1A1D1B]/10">
          <div className="flex items-center justify-between text-xs text-[#5C5F58]">
            <span className="font-medium text-[#1A1D1B]">Uploaded Gallery Photos</span>
            <span>Use arrows to reorder · Star icon marks cover</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                className={`relative rounded-lg overflow-hidden border transition-all bg-[#F2EFE9] flex flex-col ${
                  img.is_cover
                    ? 'border-[#2C4C3E] ring-2 ring-[#2C4C3E]/30'
                    : 'border-[#1A1D1B]/15'
                }`}
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-4/3 w-full bg-[#1A1D1B]/5 overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  {/* Cover Badge */}
                  {img.is_cover && (
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-[#2C4C3E] text-white text-[10px] font-semibold tracking-wide flex items-center gap-1 shadow-xs">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      <span>COVER</span>
                    </div>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    title="Remove Photo"
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-[#DC2626] text-white transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Photo Controls */}
                <div className="p-2 space-y-1.5 bg-white border-t border-[#1A1D1B]/10 flex-1 flex flex-col justify-between">
                  <input
                    type="text"
                    value={img.alt || ''}
                    onChange={(e) => updateAlt(idx, e.target.value)}
                    placeholder="Photo caption / alt"
                    className="w-full text-[11px] px-1.5 py-0.5 rounded border border-[#1A1D1B]/15 text-[#1A1D1B] bg-white"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setCover(idx)}
                      disabled={img.is_cover}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        img.is_cover
                          ? 'bg-[#2C4C3E]/10 text-[#2C4C3E] cursor-default'
                          : 'bg-[#F2EFE9] hover:bg-[#2C4C3E] hover:text-white text-[#4A4E48]'
                      }`}
                    >
                      {img.is_cover ? 'Primary Cover' : 'Set as Cover'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 'left')}
                        disabled={idx === 0}
                        title="Move Earlier"
                        className="p-1 rounded hover:bg-[#F2EFE9] disabled:opacity-20 text-[#1A1D1B] cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 'right')}
                        disabled={idx === images.length - 1}
                        title="Move Later"
                        className="p-1 rounded hover:bg-[#F2EFE9] disabled:opacity-20 text-[#1A1D1B] cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && (
        <div className="p-4 rounded-lg bg-[#FFFBEB] border border-[#F59E0B]/20 text-xs text-[#B45309] flex items-start gap-2">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            No photos added yet. Upload high-quality photos from your computer or choose from the sample presets above so guests can preview this residence.
          </span>
        </div>
      )}
    </div>
  );
};
