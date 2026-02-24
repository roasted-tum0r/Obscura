import React from 'react'
import { ArrowRight, Loader2, X, ShieldAlert, type LucideIcon } from 'lucide-react'

interface PasswordVerifyModalProps {
    isOpen: boolean
    onClose: () => void
    onVerify: (password: string) => Promise<boolean> | void
    title?: string
    description?: string
    placeholder?: string
    buttonText?: string
    icon?: LucideIcon
}

export const PasswordVerifyModal = ({
    isOpen,
    onClose,
    onVerify,
    title = "Verify Identity",
    description = "Please enter your passkey to confirm this action.",
    placeholder = "Enter Passkey",
    buttonText,
    icon: Icon = ShieldAlert
}: PasswordVerifyModalProps) => {
    const [password, setPassword] = React.useState('')
    const [isVerifying, setIsVerifying] = React.useState(false)
    const [error, setError] = React.useState(false)
    const [shake, setShake] = React.useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!password || isVerifying) return

        setIsVerifying(true)
        setError(false)

        try {
            const success = await onVerify(password)
            // If onVerify returns void, we assume success or that it handles closing
            if (success === false) {
                setError(true)
                setShake(true)
                setTimeout(() => setShake(false), 500)
            } else if (success === true) {
                setPassword('')
            }
        } catch (err) {
            setError(true)
            setShake(true)
            setTimeout(() => setShake(false), 500)
        } finally {
            setIsVerifying(false)
        }
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

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div className="lock-icon-container" style={{ width: '64px', height: '64px', borderRadius: '20px', marginBottom: '24px' }}>
                        <Icon size={28} />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', margin: '0 0 8px 0', fontFamily: 'Outfit, sans-serif' }}>
                        {title}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', opacity: 0.7, margin: 0, lineHeight: 1.5 }}>
                        {description}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="premium-input-wrapper" style={{ borderColor: error ? 'rgba(239, 68, 68, 0.4)' : undefined }}>
                    <input
                        autoFocus
                        type="password"
                        placeholder={placeholder}
                        className="premium-password-input"
                        style={{ height: '56px', fontSize: '18px' }}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value)
                            if (error) setError(false)
                        }}
                    />

                    {!buttonText ? (
                        <button
                            type="submit"
                            disabled={!password || isVerifying}
                            style={{
                                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                                width: '40px', height: '40px', borderRadius: '12px', background: '#fff', color: '#000',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                border: 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                opacity: password ? 1 : 0, scale: password ? '1' : '0.8'
                            }}
                        >
                            {isVerifying ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <ArrowRight size={18} />
                            )}
                        </button>
                    ) : null}
                </form>

                {buttonText && (
                    <button
                        onClick={handleSubmit}
                        className="setup-btn"
                        style={{ marginTop: '24px', width: '100%', height: '56px' }}
                        disabled={!password || isVerifying}
                    >
                        {isVerifying ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <span>{buttonText}</span>
                        )}
                    </button>
                )}

                {error && (
                    <div style={{ marginTop: '20px', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
                        Verification failed. Please try again.
                    </div>
                )}
                
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                    <button 
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', opacity: 0.6 }}
                    >
                        Cancel Action
                    </button>
                </div>
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
