import React from 'react'
import { Link2, X, Globe } from 'lucide-react'

interface LinkModalProps {
    onSave: (url: string) => void
    onClose: () => void
    initialUrl?: string
}

export const LinkModal = ({ onSave, onClose, initialUrl = "" }: LinkModalProps) => {
    const [url, setUrl] = React.useState(initialUrl)

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (url) {
            onSave(url)
        }
    }

    return (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
            <div className="modal-content" style={{ maxWidth: '400px', padding: '24px' }}>
                <button className="modal-close" onClick={onClose}>
                    <X size={18} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '10px', background: 'var(--accent-soft)', borderRadius: '12px', color: 'var(--accent)' }}>
                        <Link2 size={20} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Insert Link</h3>
                </div>

                <form onSubmit={handleSubmit}>
                    <div 
                        className="premium-input-wrapper" 
                        style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '2px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                            <Globe size={16} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginRight: '12px' }} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="https://example.com"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#fff',
                                    fontSize: '15px',
                                    height: '48px',
                                    width: '100%',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                        <button 
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                            style={{ flex: 1, height: '44px', borderRadius: '12px', fontSize: '14px' }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={!url}
                            className="btn btn-primary"
                            style={{ flex: 2, height: '44px', borderRadius: '12px', fontSize: '14px' }}
                        >
                            Insert Link
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
