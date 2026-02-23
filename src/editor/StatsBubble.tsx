import React from 'react';

interface StatsBubbleProps {
    count: { words: number; chars: number };
}

export const StatsBubble: React.FC<StatsBubbleProps> = ({
    count,
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
        </div>
    );
};
