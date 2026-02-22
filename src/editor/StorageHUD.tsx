import React from 'react';
import { Loader2, Github, Terminal, CheckCircle2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { setGithubToken } from '../store/gistSlice';

interface StorageHUDProps {
    payloadSize: number;
    needsToken: boolean;
    loading: boolean;
    gistId: string | null;
    githubToken: string | null;
    charLimit: number;
}

export const StorageHUD: React.FC<StorageHUDProps> = ({
    payloadSize,
    needsToken,
    loading,
    gistId,
    githubToken,
    charLimit
}) => {
    const dispatch = useDispatch<AppDispatch>();

    return (
        <div className={`joint-storage-hud glass ${(payloadSize > charLimit || needsToken || loading) ? 'visible' : ''} ${needsToken ? 'pulse-red' : ''}`}>
            <div className="hud-status">
                {loading ? (
                    <Loader2 size={14} className="animate-spin text-blue-400" />
                ) : gistId ? (
                    <Github size={14} className="text-blue-400" />
                ) : (
                    <Terminal size={14} className="text-purple-400" />
                )}
                <span>{loading ? 'Syncing...' : needsToken ? 'Token Required' : gistId ? 'Gist Sync Active' : 'Provider Fallback'}</span>
            </div>

            <div className={`token-area ${githubToken ? 'has-content' : ''}`}>
                <input
                    type="password"
                    placeholder={needsToken ? "PERSONAL TOKEN REQUIRED" : "Use custom PAT..."}
                    value={githubToken || ''}
                    onChange={(e) => dispatch(setGithubToken(e.target.value))}
                />
                {githubToken ? (
                    <CheckCircle2 size={14} className="tick-icon" />
                ) : (
                    <Github size={14} className="opacity-40" />
                )}
            </div>
        </div>
    );
};
