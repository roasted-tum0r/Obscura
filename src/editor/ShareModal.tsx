import React from 'react'
import { X, Eye, Edit3, Copy, Check, Info } from 'lucide-react'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    onShare: (mode: 'readonly' | 'editable') => Promise<string>
}

export const ShareModal = ({ isOpen, onClose, onShare }: ShareModalProps) => {
    const [mode, setMode] = React.useState<'readonly' | 'editable' | null>(null)
    const [link, setLink] = React.useState('')
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [isCopied, setIsCopied] = React.useState(false)

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setMode(null)
            setLink('')
            setIsCopied(false)
            setIsGenerating(false)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleSelectMode = async (selectedMode: 'readonly' | 'editable') => {
        setMode(selectedMode)
        setIsGenerating(true)
        try {
            const generatedLink = await onShare(selectedMode)
            setLink(generatedLink)
        } catch (error) {
            console.error("Failed to generate share link:", error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCopy = () => {
        if (isCopied) return
        
        navigator.clipboard.writeText(link)
        setIsCopied(true)
        
        // After copying, the user must reset to copy again as requested
    }

    return (
        <div className="modal-overlay" style={{ zIndex: 4000 }}>
            <div className="modal-content" style={{ maxWidth: '520px' }}>
                <button className="modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ 
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: 'rgba(255, 171, 0, 0.1)',
                        border: '1px solid rgba(255, 171, 0, 0.2)',
                        borderRadius: '20px',
                        color: '#ffab00',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '16px'
                    }}>
                        Coming Soon
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', margin: '0 0 8px 0', fontFamily: 'Outfit, sans-serif' }}>
                        Share Document
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', opacity: 0.7, margin: 0 }}>
                        {mode ? "Your sharing link is ready" : "Choose how you want to share this file"}
                    </p>
                    <p style={{ color: '#ffab00', fontSize: '12px', marginTop: '8px', opacity: 0.8, fontWeight: 500 }}>
                        Note: Live sharing is currently under development. Links are for demonstration only.
                    </p>
                </div>

                {!mode ? (
                    <div className="share-options-grid">
                        <div className="share-option-card" onClick={() => handleSelectMode('readonly')}>
                            <div className="share-option-icon">
                                <Eye size={24} />
                            </div>
                            <h4>Read-only</h4>
                            <p>Recipient can view but not edit the content.</p>
                        </div>
                        <div className="share-option-card" onClick={() => handleSelectMode('editable')}>
                            <div className="share-option-icon">
                                <Edit3 size={24} />
                            </div>
                            <h4>Editable</h4>
                            <p>Recipient can collaborate and make changes.</p>
                        </div>
                    </div>
                ) : (
                    <div className="link-display-section">
                        <div style={{ 
                            padding: '16px', 
                            borderRadius: '16px', 
                            background: 'rgba(139, 92, 246, 0.05)', 
                            border: '1px solid rgba(139, 92, 246, 0.1)',
                            marginBottom: '24px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', marginBottom: '8px' }}>
                                <Info size={16} />
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                    {mode === 'readonly' ? 'Read-only Access' : 'Collaborative Access'}
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {mode === 'readonly' 
                                    ? 'Generated link allows full viewing. All encryption layers remain intact for secure transit.' 
                                    : 'Recipients can edit this document in real-time. Changes are saved back to this specific instance.'}
                            </p>
                        </div>

                        <div className="link-container">
                            <input 
                                className="link-input-readonly" 
                                readOnly 
                                value={isGenerating ? "Generating secure link..." : link} 
                            />
                            <button 
                                className="copy-button-internal" 
                                onClick={handleCopy}
                                disabled={isGenerating || isCopied}
                            >
                                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                                {isCopied ? 'Copied' : 'Copy Link'}
                            </button>
                        </div>

                        {isCopied && (
                            <p style={{ 
                                marginTop: '16px', 
                                fontSize: '0.75rem', 
                                color: 'var(--text-secondary)', 
                                textAlign: 'center',
                                fontStyle: 'italic',
                                opacity: 0.6
                            }}>
                                Note: This link can only be copied once. To get it again, please restart the sharing process.
                            </p>
                        )}

                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
                            <button 
                                onClick={() => setMode(null)}
                                style={{ 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: 'var(--accent)', 
                                    fontSize: '13px', 
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Back to options
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
