import React from 'react'
import { Shield, Info, Copy, Check, Eye, EyeOff } from 'lucide-react'

interface SetupPasswordModalProps {
    onComplete: (password: string) => void
    onClose: () => void
}

export const SetupPasswordModal = ({ onComplete, onClose }: SetupPasswordModalProps) => {
    const [password, setPassword] = React.useState('')
    const [showPassword, setShowPassword] = React.useState(false)
    const [copied, setCopied] = React.useState(false)

    const suggestPassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
        const length = 16
        let res = ""
        for (let i = 0; i < length; i++) res += chars.charAt(Math.floor(Math.random() * chars.length))
        setPassword(res)
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(password)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="flex items-center gap-3 mb-6">
                    <div style={{ padding: '8px', borderRadius: '12px', background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                        <Shield size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Protect your file</h2>
                </div>

                <div className="mb-8">
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)', display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        <Info size={20} style={{ color: '#fb923c', flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
                            <span style={{ fontWeight: '700', color: '#fb923c' }}>Important:</span> Obscura uses end-to-end encryption. If you lose this password, your data <span style={{ textDecoration: 'underline', fontStyle: 'italic' }}>cannot</span> be recovered.
                        </p>
                    </div>

                    <div className="premium-input-wrapper" style={{ marginBottom: '12px' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter a strong passkey..."
                            className="premium-password-input"
                            style={{ textAlign: 'left', paddingRight: '100px', fontSize: '18px' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
                            <button
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' }}
                                title={showPassword ? "Hide Password" : "Show Password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            {password && (
                                <button
                                    onClick={handleCopy}
                                    style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' }}
                                    title="Copy Password"
                                >
                                    {copied ? <Check size={18} style={{ color: '#4ade80' }} /> : <Copy size={18} />}
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={suggestPassword}
                        className="suggest-btn"
                    >
                        <Shield size={12} />
                        Need a strong suggestion?
                    </button>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!password}
                        onClick={() => onComplete(password)}
                        className="btn btn-primary"
                    >
                        Finish & Lock
                    </button>
                </div>
            </div>
        </div>
    )
}
