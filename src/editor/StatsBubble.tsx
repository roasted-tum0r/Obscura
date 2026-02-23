import React from 'react';
import { Loader2, Lock, Unlock } from 'lucide-react';

interface StatsBubbleProps {
    count: { words: number; chars: number };
    isSaving: boolean;
    loading: boolean;
    isPasswordProtected: boolean;
    timeLeft: number;
    onToggleLock: () => void;
}

export const StatsBubble: React.FC<StatsBubbleProps> = ({
    count,
    isSaving,
    loading,
    isPasswordProtected,
    timeLeft,
    onToggleLock
}) => {
    return (
        <div className="stats-bubble glass">
            <div className="stats-item">
                <span className="stats-value">{count.words}</span>
                <span className="stats-label">Words</span>
            </div>
            <div className="stats-item">
                <span className="stats-value">{count.chars}</span>
                <span className="stats-label">Chars</span>
            </div>
            {(isPasswordProtected || isSaving || loading) && (
                <div className="stats-item" style={{ marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid var(--border)' }}>
                    {isSaving || loading ? (
                        <Loader2 size={16} className="animate-spin text-blue-400" />
                    ) : (
                        <div className="flex items-center gap-2 cursor-pointer" onClick={onToggleLock}>
                            <Lock size={16} className="text-purple-400" />
                            {timeLeft > 0 && <span className="stats-label" style={{ fontSize: '9px' }}>{timeLeft}s</span>}
                        </div>
                    )}
                </div>
            )}

            {!isPasswordProtected && !loading && !isSaving && (
                <div className="stats-item" style={{ marginLeft: '4px' }}>
                    <Unlock size={16} className="text-green-400/50 cursor-pointer" onClick={onToggleLock} />
                </div>
            )}
        </div>
    );
};
