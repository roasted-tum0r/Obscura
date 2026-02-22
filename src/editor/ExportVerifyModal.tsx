import React from 'react'
import { Lock, X, Loader2 } from 'lucide-react'
import { deriveKeyFromPassword, importSalt } from "../utils/Crypto"

interface ExportVerifyModalProps {
    isOpen: boolean
    onClose: () => void
    onVerify: (password: string) => void
    isVerifying: boolean
}

export const ExportVerifyModal = ({ isOpen, onClose, onVerify, isVerifying }: ExportVerifyModalProps) => {
    const [password, setPassword] = React.useState("")
    const [error, setError] = React.useState(false)

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) return
        onVerify(password)
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content glass login-shake">
                <header className="modal-header">
                    <div className="modal-icon setup">
                        <Lock size={20} />
                    </div>
                    <div>
                        <h2>Verify Identity</h2>
                        <p>Enter password to authorize download</p>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="Current Password"
                            className={`input-field ${error ? 'error' : ''}`}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                setError(false)
                            }}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        className="setup-btn"
                        disabled={!password || isVerifying}
                    >
                        {isVerifying ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <span>Confirm & Download</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
