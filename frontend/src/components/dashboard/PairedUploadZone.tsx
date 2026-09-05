import React, { useRef, useState } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';

interface PairedUploadZoneProps {
  beforeFile: File | null;
  setBeforeFile: (file: File | null) => void;
  afterFile: File | null;
  setAfterFile: (file: File | null) => void;
  beforeUrl: string | null;
  setBeforeUrl: (url: string | null) => void;
  afterUrl: string | null;
  setAfterUrl: (url: string | null) => void;
}

export const PairedUploadZone: React.FC<PairedUploadZoneProps> = ({
  beforeFile,
  setBeforeFile,
  afterFile,
  setAfterFile,
  beforeUrl,
  setBeforeUrl,
  afterUrl,
  setAfterUrl,
}) => {
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const [isDraggingBefore, setIsDraggingBefore] = useState(false);
  const [isDraggingAfter, setIsDraggingAfter] = useState(false);

  const handleFile = (
    file: File | null,
    setFile: (f: File | null) => void,
    currentUrl: string | null,
    setUrl: (u: string | null) => void
  ) => {
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
    if (file) {
      setFile(file);
      setUrl(URL.createObjectURL(file));
    } else {
      setFile(null);
      setUrl(null);
    }
  };

  const renderSlot = (
    title: string,
    file: File | null,
    url: string | null,
    inputRef: React.RefObject<HTMLInputElement | null>,
    isDragging: boolean,
    setIsDragging: (d: boolean) => void,
    onFileDrop: (files: FileList | null) => void,
    onClear: () => void
  ) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="text-[10px] font-mono text-text-muted flex justify-between items-center">
          <span>{title}</span>
          {file && (
            <span className="text-[9px] truncate max-w-[100px]" title={file.name}>
              {file.name}
            </span>
          )}
        </div>
        
        {url ? (
          <div className="relative w-full h-24 rounded border border-border overflow-hidden bg-[#171D26] group">
            <img src={url} alt={title} className="w-full h-full object-cover" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="absolute top-1 right-1 p-1 bg-black/60 rounded text-text-secondary hover:text-alert opacity-0 group-hover:opacity-100 transition-opacity"
              title="Clear Image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 px-1.5 text-[9px] font-mono text-text-secondary truncate">
              {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : ''}
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              onFileDrop(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`w-full h-24 flex flex-col items-center justify-center rounded border-2 border-dashed cursor-pointer transition-colors ${
              isDragging
                ? 'border-signal bg-signal/15 text-signal'
                : 'border-border-strong hover:border-signal/50 bg-[#171D26] text-text-muted hover:text-text-primary'
            }`}
          >
            <UploadCloud className={`w-5 h-5 mb-1 ${isDragging ? 'text-signal' : ''}`} />
            <span className="text-[10px] font-mono">Upload {title}</span>
          </div>
        )}
        <input
          type="file"
          accept=".tif,.tiff,.png,.jpg,.jpeg"
          className="hidden"
          ref={inputRef}
          onChange={(e) => onFileDrop(e.target.files)}
        />
      </div>
    );
  };

  return (
    <div className="p-3 bg-[#10151c] border-b border-border flex flex-col gap-3">
      <div className="text-[11px] font-semibold text-text-primary font-sans flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5 text-signal" />
        <span>Dual-Slot Local Upload (Change Detection)</span>
      </div>
      <div className="flex gap-2">
        {renderSlot(
          'Before (T0)',
          beforeFile,
          beforeUrl,
          beforeInputRef,
          isDraggingBefore,
          setIsDraggingBefore,
          (files) => {
            if (files && files.length > 0) {
              handleFile(files[0], setBeforeFile, beforeUrl, setBeforeUrl);
            }
          },
          () => handleFile(null, setBeforeFile, beforeUrl, setBeforeUrl)
        )}
        {renderSlot(
          'After (T1)',
          afterFile,
          afterUrl,
          afterInputRef,
          isDraggingAfter,
          setIsDraggingAfter,
          (files) => {
            if (files && files.length > 0) {
              handleFile(files[0], setAfterFile, afterUrl, setAfterUrl);
            }
          },
          () => handleFile(null, setAfterFile, afterUrl, setAfterUrl)
        )}
      </div>
    </div>
  );
};
