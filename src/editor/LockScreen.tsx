import React from 'react'
import { Lock, ArrowRight, Loader2 } from 'lucide-react'

interface LockScreenProps {
    onUnlock: (password: string) => Promise<boolean>
}

export const LockScreen = ({ onUnlock }: LockScreenProps) => {
    const [password, setPassword] = React.useState('')
    const [isUnlocking, setIsUnlocking] = React.useState(false)
    const [error, setError] = React.useState(false)
    const [shake, setShake] = React.useState(false)

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!password || isUnlocking) return

        setIsUnlocking(true)
        setError(false)

        const success = await onUnlock(password)

        if (!success) {
            setError(true)
            setShake(true)
            setTimeout(() => setShake(false), 500)
            setPassword('')
        }
        setIsUnlocking(false)
    }

    return (
        <div className="lock-screen" style={{ padding: '24px' }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.1, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-20%', left: '-20%', width: '60%', height: '60%', background: 'var(--accent)', filter: 'blur(160px)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-20%', right: '-20%', width: '60%', height: '60%', background: '#3b82f6', filter: 'blur(160px)', borderRadius: '50%' }} />
            </div>

            <div
                className={shake ? 'animate-shake' : ''}
                style={{ width: '100%', maxWidth: '400px', textAlign: 'center', position: 'relative', zIndex: 10 }}
            >
                <div style={{ marginBottom: '40px' }}>
                    <div style={{
                        width: '88px', height: '88px', borderRadius: '28px',
                        background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                        margin: '0 auto', boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(20px)'
                    }}>
                        <Lock size={36} />
                    </div>
                </div>

                <h2 style={{ fontSize: '2.25rem', fontWeight: '800', color: '#fff', marginBottom: '12px', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                    Obscura Locked
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', fontSize: '1rem', opacity: 0.7 }}>
                    Enter your passkey to access this file
                </p>

                <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
                    <input
                        autoFocus
                        type="password"
                        placeholder="••••••••"
                        className="input-field"
                        style={{
                            height: '72px', fontSize: '28px', textAlign: 'center',
                            fontFamily: 'monospace', letterSpacing: '0.4em',
                            borderColor: error ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)'
                        }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        type="submit"
                        disabled={!password || isUnlocking}
                        style={{
                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                            width: '52px', height: '52px', borderRadius: '16px', background: '#fff', color: '#000',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            border: 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: password ? 1 : 0, scale: password ? '1' : '0.8'
                        }}
                    >
                        {isUnlocking ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <ArrowRight size={24} />
                        )}
                    </button>
                </form>

                {error && (
                    <div style={{ marginTop: '24px', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        Invalid passkey. Please try again.
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
