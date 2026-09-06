'use client';

import React, { useEffect } from 'react';
import { TERMS_OF_SERVICE } from '@/app/legal/terms';
import { PRIVACY_POLICY } from '@/app/legal/privacy';

interface LegalModalProps {
  type: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export function LegalModal({ type, onClose }: LegalModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    if (type) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [type, onClose]);

  if (!type) return null;

  const data = type === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="legal-modal-title" className="modal-title">
            {data.title}
          </h3>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Last Updated: {data.lastUpdated}
          </p>

          {data.sections.map((sec, i) => (
            <div key={i}>
              <h4>{sec.heading}</h4>
              <p>{sec.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
