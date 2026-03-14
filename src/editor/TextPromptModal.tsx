import React from 'react'
import { X, ChevronRight } from 'lucide-react'
import { useModalClose } from '../hooks/useModalClose'

interface TextPromptModalProps {
    title: string
    description?: string
    placeholder?: string
    initialValue?: string
    icon?: React.ReactNode
    onSave: (value: string) => void
    onClose: () => void
}

export const TextPromptModal = ({
    title,
    description,
    placeholder = "Type here...",
    initialValue = "",
    icon,
    onSave,
    onClose
}: TextPromptModalProps) => {
    const [value, setValue] = React.useState(initialValue)
    const modalRef = React.useRef<HTMLDivElement>(null)

    useModalClose(true, onClose, modalRef)

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (value.trim()) {
            onSave(value.trim())
        }
    }

    return (
        <div className="modal-overlay" style={{ zIndex: 4000 }}>
            <div ref={modalRef} className="modal-content" style={{ maxWidth: '400px', padding: '24px' }}>
                <button className="modal-close" onClick={onClose}>
                    <X size={18} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    {icon && (
                        <div style={{ padding: '10px', background: 'var(--glass-bright)', borderRadius: '12px', color: 'var(--accent)' }}>
                            {icon}
                        </div>
                    )}
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{title}</h3>
                        {description && <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{description}</p>}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div 
                        className="premium-input-wrapper" 
                        style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '2px' }}
                    >
                        <input
                            autoFocus
                            type="text"
                            placeholder={placeholder}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: '#fff',
                                fontSize: '15px',
                                height: '48px',
                                width: '100%',
                                padding: '0 16px',
                                fontFamily: 'Inter, sans-serif'
                            }}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
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
                            disabled={!value.trim()}
                            className="btn btn-primary"
                            style={{ flex: 2, height: '44px', borderRadius: '12px', fontSize: '14px', position: 'relative' }}
                        >
                            Confirm
                            <ChevronRight size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
