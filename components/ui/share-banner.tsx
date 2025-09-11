'use client';

import * as React from 'react';
import { Copy, RotateCw, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ShareBannerProps {
  shareUrl: string;
  expiresAt?: Date;
  onRotate?: () => Promise<void>;
  onCopy?: () => void;
  className?: string;
}

export function ShareBanner({
  shareUrl,
  expiresAt,
  onRotate,
  onCopy,
  className,
}: ShareBannerProps) {
  const [copied, setCopied] = React.useState(false);
  const [rotating, setRotating] = React.useState(false);
  const [showRotateConfirm, setShowRotateConfirm] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRotate = async () => {
    if (!onRotate) return;
    
    if (!showRotateConfirm) {
      setShowRotateConfirm(true);
      setTimeout(() => setShowRotateConfirm(false), 3000);
      return;
    }

    setRotating(true);
    try {
      await onRotate();
      setShowRotateConfirm(false);
    } finally {
      setRotating(false);
    }
  };

  const timeToExpiry = expiresAt
    ? formatDistanceToNow(expiresAt, { addSuffix: false })
    : null;

  const isExpiringSoon = expiresAt
    ? (expiresAt.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000 // 7 days
    : false;

  return (
    <div className={cn(
      'flex items-center justify-between gap-4 p-4 rounded-lg',
      'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200',
      className
    )}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-700">Client Share Link</span>
            {expiresAt && (
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                isExpiringSoon
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
              )}>
                <Clock className="w-3 h-3" />
                Expires in {timeToExpiry}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 truncate max-w-md">
              {shareUrl}
            </code>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
            >
              View as client
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
            'transition-all duration-200',
            copied
              ? 'bg-green-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          )}
        >
          <Copy className="w-4 h-4" />
          {copied ? 'Copied!' : 'Copy Link'}
        </button>

        {onRotate && (
          <button
            onClick={handleRotate}
            disabled={rotating}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'transition-all duration-200',
              showRotateConfirm
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300',
              rotating && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RotateCw className={cn('w-4 h-4', rotating && 'animate-spin')} />
            {showRotateConfirm ? 'Click to confirm' : 'Rotate'}
          </button>
        )}
      </div>
    </div>
  );
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  expiresAt?: Date;
  onRotate?: () => Promise<void>;
}

export function ShareModal({
  isOpen,
  onClose,
  shareUrl,
  expiresAt,
  onRotate,
}: ShareModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Share Project</h2>
        <ShareBanner
          shareUrl={shareUrl}
          expiresAt={expiresAt}
          onRotate={onRotate}
          className="mb-4"
        />
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This link provides read-only access to project status and updates.
            {expiresAt && ` The link will expire on ${expiresAt.toLocaleDateString()}.`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}