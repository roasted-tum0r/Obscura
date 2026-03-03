import React from 'react'
import { ArrowRight, Loader2, X, ShieldAlert, Shield, Info, Copy, Check, Eye, EyeOff, type LucideIcon } from 'lucide-react'

interface PasswordModalProps {
    isOpen: boolean
    onClose: () => void
    mode: 'verify' | 'setup'
    onComplete: (password: string) => Promise<boolean | void> | void
    
    // Customization for 'verify' mode
    title?: string
    description?: string
    placeholder?: string
    buttonText?: string
    icon?: LucideIcon
    
    // Options for 'setup' mode
    showWarning?: boolean
    showSuggest?: boolean
}

export const PasswordModal = ({
    isOpen,
    onClose,
    mode,
    onComplete,
    title,
    description,
    placeholder,
    buttonText,
    icon: Icon,
    showWarning = true,
    showSuggest = true
}: PasswordModalProps) => {
    const [password, setPassword] = React.useState('')
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [error, setError] = React.useState(false)
    const [shake, setShake] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)
    const [copied, setCopied] = React.useState(false)

    // Reset state when opening/closing
    React.useEffect(() => {
        if (isOpen) {
            setPassword('')
            setError(false)
            setShake(false)
            setShowPassword(mode === 'setup') // Default to showing password in setup
        }
    }, [isOpen, mode])

    if (!isOpen) return null

    const isVerify = mode === 'verify'
    const isSetup = mode === 'setup'

    // Defaults based on mode
    const finalTitle = title || (isVerify ? "Verify Identity" : "Protect your file")
    const finalDescription = description || (isVerify ? "Please enter your passkey to confirm this action." : "")
    const finalPlaceholder = placeholder || (isVerify ? "Enter Passkey" : "Enter a strong passkey...")
    const FinalIcon = Icon || (isVerify ? ShieldAlert : Shield)

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!password || isProcessing) return

        setIsProcessing(true)
        setError(false)

        try {
            const result = await onComplete(password)
            // In verify mode, false means wrong password
            if (isVerify && result === false) {
                setError(true)
                setShake(true)
                setTimeout(() => setShake(false), 500)
            } else {
                // Success case
                setPassword('')
            }
        } catch (err) {
            setError(true)
            setShake(true)
            setTimeout(() => setShake(false), 500)
        } finally {
            setIsProcessing(false)
        }
    }

    const suggestPassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
        const length = 16
        let res = ""
        for (let i = 0; i < length; i++) res += chars.charAt(Math.floor(Math.random() * chars.length))
        setPassword(res)
        setShowPassword(true)
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(password)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
            <div 
                className={`modal-content ${shake ? 'animate-shake' : ''}`} 
                style={{ maxWidth: '440px', padding: '32px' }}
            >
                <button className="modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: isVerify ? '32px' : '24px' }}>
                    <div className="lock-icon-container" style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '20px', 
                        marginBottom: '24px',
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px auto'
                    }}>
                        <FinalIcon size={28} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', margin: '0 0 8px 0', fontFamily: 'Outfit, sans-serif' }}>
                        {finalTitle}
                    </h2>
                    {finalDescription && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', opacity: 0.7, margin: 0, lineHeight: 1.5 }}>
                            {finalDescription}
                        </p>
                    )}
                </div>

                {isSetup && showWarning && (
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)', display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        <Info size={20} style={{ color: '#fb923c', flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5', margin: 0 }}>
                            <span style={{ fontWeight: '700', color: '#fb923c' }}>Important:</span> Obscura uses end-to-end encryption. If you lose this password, your data <span style={{ textDecoration: 'underline', fontStyle: 'italic' }}>cannot</span> be recovered.
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="premium-input-wrapper" style={{ 
                        borderColor: error ? 'rgba(239, 68, 68, 0.4)' : undefined,
                        marginBottom: isSetup ? '12px' : '0'
                    }}>
                        <input
                            autoFocus
                            type={showPassword ? "text" : "password"}
                            placeholder={finalPlaceholder}
                            className="premium-password-input"
                            style={{ height: '56px', fontSize: '18px', textAlign: isSetup ? 'left' : 'center' }}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                if (error) setError(false)
                            }}
                        />

                        {isVerify ? (
                            <button
                                type="submit"
                                disabled={!password || isProcessing}
                                style={{
                                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                    width: '40px', height: '40px', borderRadius: '12px', background: '#fff', color: '#000',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    border: 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    opacity: password ? 1 : 0, scale: password ? '1' : '0.8'
                                }}
                            >
                                {isProcessing ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <ArrowRight size={18} />
                                )}
                            </button>
                        ) : (
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' }}
                                    title={showPassword ? "Hide Password" : "Show Password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                {password && (
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' }}
                                        title="Copy Password"
                                    >
                                        {copied ? <Check size={18} style={{ color: '#4ade80' }} /> : <Copy size={18} />}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {isSetup && showSuggest && (
                        <button
                            type="button"
                            onClick={suggestPassword}
                            className="suggest-btn"
                            style={{ marginBottom: '24px' }}
                        >
                            <Shield size={12} />
                            Need a strong suggestion?
                        </button>
                    )}

                    {isSetup ? (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '14px' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!password || isProcessing}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '14px' }}
                            >
                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : "Finish & Lock"}
                            </button>
                        </div>
                    ) : (
                        buttonText && (
                            <button
                                type="submit"
                                className="setup-btn"
                                style={{ marginTop: '24px', width: '100%', height: '56px' }}
                                disabled={!password || isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <span>{buttonText}</span>
                                )}
                            </button>
                        )
                    )}
                </form>

                {isVerify && error && (
                    <div style={{ marginTop: '20px', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                        Verification failed. Please try again.
                    </div>
                )}
                
                {isVerify && (
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                        <button 
                            type="button"
                            onClick={onClose}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', opacity: 0.6 }}
                        >
                            Cancel Action
                        </button>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
            `}} />
        </div>
    )
}
