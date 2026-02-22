import React from "react"
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Highlight from '@tiptap/extension-highlight'
import TaskListExt from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import CharacterCount from '@tiptap/extension-character-count'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import TextAlign from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'
import { Image as TiptapImage } from '@tiptap/extension-image'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Focus } from '@tiptap/extension-focus'
import { Dropcursor } from '@tiptap/extension-dropcursor'
import { Gapcursor } from '@tiptap/extension-gapcursor'
import { common, createLowlight } from 'lowlight'

const lowlight = createLowlight(common)

import { saveAs } from 'file-saver'
import { asBlob } from 'html-docx-js-typescript'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

import {
    importKey,
    decrypt,
    encrypt,
    exportKey,
    generateKey,
    deriveKeyFromPassword,
    generateSalt,
    exportSalt,
    importSalt
} from "../utils/Crypto"
import { EditorToolbar } from "./EditorToolbar"
import { SetupPasswordModal } from "./SetupPasswordModal"
import { LockScreen } from "./LockScreen"
import { ExportVerifyModal } from "./ExportVerifyModal"
import { useParams, useNavigate } from "react-router-dom"
import {
    Bold,
    Italic,
    Highlighter,
    Heading1,
    Heading2,
    Baseline,
    Github,
    // Lock,
    // Unlock,
    Loader2,
    CheckCircle2,
    Code,
    Link as LinkIcon,
    Terminal,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Download,
    FileType,
    FileIcon
} from 'lucide-react'
import { Compressor } from "../utils/Compressor"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "../store"
import { saveToGist, fetchFromGist, setGithubToken } from "../store/gistSlice"

const debounce = (fn: Function, ms: number) => {
    let timeoutId: ReturnType<typeof setTimeout>
    return function (this: any, ...args: any[]) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn.apply(this, args), ms)
    }
}

const IDLE_TIME = 60 // 60 seconds

export const MainEditor = () => {
    const dispatch = useDispatch<AppDispatch>()
    const { filename: urlFilename } = useParams()
    const navigate = useNavigate()
    const { githubToken, loading, gistId } = useSelector((state: RootState) => state.gist)

    const [filename, setFilename] = React.useState(urlFilename || 'Untitled')
    const [isSaving, setIsSaving] = React.useState(false)
    const [needsToken, setNeedsToken] = React.useState(false)
    const [payloadSize, setPayloadSize] = React.useState(0)
    const [_timeLeft, setTimeLeft] = React.useState(IDLE_TIME)
    const [count, setCount] = React.useState({
        chars: 0, words: 0
    })

    // BUG-006: Track the timestamp of the last successful save to prevent race conditions
    const lastSaveTimestamp = React.useRef(0)
    // Protection States
    const [isPasswordProtected, setIsPasswordProtected] = React.useState(false)
    const [isLocked, setIsLocked] = React.useState(false)
    const [isSetupModalOpen, setIsSetupModalOpen] = React.useState(false)
    const [salt, setSalt] = React.useState<string | null>(null)

    const [isExportVerifyOpen, setIsExportVerifyOpen] = React.useState(false)
    const [exportType, setExportType] = React.useState<'docx' | 'txt' | 'pdf' | null>(null)
    const [isVerifyingExport, setIsVerifyingExport] = React.useState(false)

    const keyRef = React.useRef<CryptoKey | null>(null)
    const isInitialLoad = React.useRef(true)
    const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    // --- EXPORT LOGIC ---
    const triggerExport = (type: 'docx' | 'txt' | 'pdf') => {
        if (isPasswordProtected) {
            setExportType(type)
            setIsExportVerifyOpen(true)
        } else {
            performExport(type)
        }
    }

    const verifyAndExport = async (password: string) => {
        setIsVerifyingExport(true)
        try {
            const saltBytes = importSalt(salt!)
            const derivedKey = await deriveKeyFromPassword(password, saltBytes)
            const exportedDerived = await exportKey(derivedKey)
            const exportedSession = await exportKey(keyRef.current!)

            if (exportedDerived === exportedSession) {
                performExport(exportType!)
                setIsExportVerifyOpen(false)
            } else {
                alert("Incorrect password")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsVerifyingExport(false)
        }
    }

    const performExport = async (type: 'docx' | 'txt' | 'pdf') => {
        if (!editor) {
            console.error("[Export] Editor instance not found");
            return;
        }

        console.log(`[Export] Starting ${type} export...`);
        const html = editor.getHTML()
        const text = editor.getText()
        const date = new Date().toISOString().split('T')[0]
        const finalFilename = `${filename}_${date}`

        if (type === 'txt') {
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
            saveAs(blob, `${finalFilename}.txt`)
        } else if (type === 'docx') {
            const docxBlob = await asBlob(html, {
                orientation: 'portrait',
                margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            })
            saveAs(docxBlob as Blob, `${finalFilename}.docx`)
        } else if (type === 'pdf') {
            const element = document.querySelector('.ProseMirror')
            if (element) {
                try {
                    const canvas = await html2canvas(element as HTMLElement, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#000000'
                    })

                    const imgData = canvas.toDataURL('image/png')
                    if (!imgData || imgData === 'data:,') {
                        throw new Error("Generated image data is empty or invalid");
                    }

                    const pdf = new jsPDF('p', 'mm', 'a4')
                    const imgProps = pdf.getImageProperties(imgData)
                    const pdfWidth = pdf.internal.pageSize.getWidth()
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
                    pdf.save(`${finalFilename}.pdf`)
                } catch (error) {
                    console.error("[Export] PDF generation failed:", error);
                }
            }
        }
    }

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Obscura....Write anything, carry the url anywhere....',
            }),
            Typography,
            Highlight,
            TaskListExt,
            TaskItem.configure({ nested: true }),
            Link.configure({ openOnClick: false }),
            Underline,
            CharacterCount,
            BubbleMenuExtension,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Subscript,
            Superscript,
            TextStyle,
            Color,
            FontFamily,
            TiptapImage.configure({
                allowBase64: true,
                HTMLAttributes: {
                    class: 'editor-image',
                },
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
            Focus.configure({
                className: 'has-focus',
                mode: 'all',
            }),
            Dropcursor.configure({
                color: '#8b5cf6',
                width: 2,
            }),
            Gapcursor,
        ],
        content: '',
        onUpdate: ({ editor }) => {
            if (isInitialLoad.current || isLocked) return
            resetIdleTimer()
            debouncedSave(editor.getHTML())
        },
    })

    // --- IDLE LOCK LOGIC ---
    const resetIdleTimer = React.useCallback(() => {
        if (!isPasswordProtected || isLocked) return
        setTimeLeft(IDLE_TIME)
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        idleTimerRef.current = setTimeout(() => {
            if (isPasswordProtected) setIsLocked(true)
        }, IDLE_TIME * 1000)
    }, [isPasswordProtected, isLocked])

    React.useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
        const handler = () => resetIdleTimer()

        events.forEach(e => document.addEventListener(e, handler))
        resetIdleTimer()

        return () => {
            events.forEach(e => document.removeEventListener(e, handler))
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
        }
    }, [resetIdleTimer])

    // Countdown effect
    React.useEffect(() => {
        if (!isPasswordProtected || isLocked) return

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsLocked(true)
                    return IDLE_TIME
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [isPasswordProtected, isLocked])

    const stateRef = React.useRef({ filename, isPasswordProtected, salt, githubToken, editor, isLocked })
    React.useEffect(() => {
        stateRef.current = { filename, isPasswordProtected, salt, githubToken, editor, isLocked }
    }, [filename, isPasswordProtected, salt, githubToken, editor, isLocked])

    // --- SAVE LOGIC ---
    const saveChanges = async (html: string, overrides?: { forceProtected?: boolean, forceSalt?: string }) => {
        const startTimestamp = Date.now();
        const { filename: currentFilename, isPasswordProtected: currentProtected, salt: currentSalt, githubToken: currentToken, isLocked: currentLocked } = stateRef.current

        const isProtected = overrides?.forceProtected !== undefined ? overrides.forceProtected : currentProtected;
        const saltToUse = overrides?.forceSalt !== undefined ? overrides.forceSalt : currentSalt;

        if (currentLocked && !overrides?.forceProtected) {
            console.log("[Save] Blocked: Editor is locked.");
            return
        }

        setIsSaving(true)
        try {
            if (!keyRef.current) {
                const newKey = await generateKey()
                keyRef.current = newKey
            }

            const compressed = await Compressor.compressGzip(html)
            const compressedBase64 = Compressor.toBase64(compressed)
            const encrypted = await encrypt(compressedBase64, keyRef.current!)
            setPayloadSize(encrypted.data.length)

            let payload: any = {
                v: 2,
                iv: encrypted.iv,
                p: isProtected,
                s: saltToUse || undefined,
                fn: currentFilename
            }

            if (!isProtected) {
                payload.k = await exportKey(keyRef.current!)
            }

            if (encrypted.data.length > +import.meta.env.VITE_GLOBAL_ENCRYPTED_CHAR_COUNT) {
                payload.mode = "gist"
                const resultAction = await dispatch(saveToGist({
                    content: encrypted.data,
                    token: currentToken || "",
                    gistId: gistId
                }))

                if (saveToGist.fulfilled.match(resultAction)) {
                    payload.gid = resultAction.payload
                    setNeedsToken(false)
                } else {
                    if (!currentToken) {
                        setNeedsToken(true)
                        return
                    }
                }
            } else {
                setNeedsToken(false)
                payload.mode = "open"
                payload.d = encrypted.data
            }

            const finalState = stateRef.current;
            if (startTimestamp < lastSaveTimestamp.current) return;
            if (!isProtected && finalState.isPasswordProtected) return;

            const newHash = btoa(JSON.stringify(payload))
            const cleanFilename = currentFilename.trim().replace(/\s+/g, '-')

            if (!isLocked || overrides?.forceProtected) {
                navigate(`/${cleanFilename}#${newHash}`, { replace: true })
                lastSaveTimestamp.current = startTimestamp;
            }
        } catch (err) {
            console.error("[Save] Process failed:", err)
        } finally {
            setIsSaving(false)
        }
        const characters = editor?.storage.characterCount.characters() || 0
        const words = editor?.storage.characterCount.words() || 0
        setCount({ chars: characters, words: words })
    }

    const saveRef = React.useRef(saveChanges)
    saveRef.current = saveChanges
    const debouncedSave = React.useMemo(() => debounce((html: string) => saveRef.current(html), 800), [])

    React.useEffect(() => {
        document.title = `${filename} - Obscura`
    }, [filename])

    // --- INIT LOGIC ---
    React.useEffect(() => {
        const init = async () => {
            try {
                const hash = window.location.hash.slice(1)
                if (!hash) {
                    isInitialLoad.current = false
                    return
                }

                const parsed = JSON.parse(atob(hash))
                setIsPasswordProtected(!!parsed.p)
                setSalt(parsed.s || null)
                if (parsed.fn) setFilename(parsed.fn)

                if (parsed.p) {
                    setIsLocked(true)
                    return
                } else if (parsed.k) {
                    keyRef.current = await importKey(parsed.k)
                }

                let encryptedData = parsed.d
                if (parsed.mode === 'gist' && parsed.gid) {
                    const resultAction = await dispatch(fetchFromGist({ gistId: parsed.gid, token: githubToken || undefined }))
                    if (fetchFromGist.fulfilled.match(resultAction)) {
                        encryptedData = resultAction.payload.content
                    }
                }

                if (!encryptedData) return
                if (keyRef.current) {
                    const decryptedBase64 = await decrypt(encryptedData, parsed.iv, keyRef.current)
                    const html = await Compressor.decompressGzip(Compressor.fromBase64(decryptedBase64))
                    if (editor) editor.commands.setContent(html)
                }
            } catch (error) {
                console.error("Init failed:", error)
            } finally {
                isInitialLoad.current = false
            }
            const characters = editor?.storage.characterCount.characters() || 0
            const words = editor?.storage.characterCount.words() || 0
            setCount({ chars: characters, words: words })
        }
        if (editor) init()
    }, [editor])

    // --- ACTIONS ---
    const handleUnlock = async (password: string) => {
        try {
            const hash = window.location.hash.slice(1)
            const parsed = JSON.parse(atob(hash))
            const currentSalt = parsed.s
            if (!currentSalt) return false

            const key = await deriveKeyFromPassword(password, importSalt(currentSalt))

            let encryptedData = parsed.d
            if (parsed.mode === 'gist' && parsed.gid) {
                const resultAction = await dispatch(fetchFromGist({ gistId: parsed.gid, token: githubToken || undefined }))
                if (fetchFromGist.fulfilled.match(resultAction)) {
                    encryptedData = resultAction.payload.content
                }
            }

            if (!encryptedData) return false
            const decryptedBase64 = await decrypt(encryptedData, parsed.iv, key)
            const html = await Compressor.decompressGzip(Compressor.fromBase64(decryptedBase64))

            keyRef.current = key
            if (editor) editor.commands.setContent(html)
            setIsLocked(false)
            setTimeLeft(IDLE_TIME)
            return true
        } catch (e) {
            console.error("Unlock failed:", e)
            return false
        }
    }

    const handleSetupComplete = async (password: string) => {
        const newSalt = generateSalt()
        const key = await deriveKeyFromPassword(password, newSalt)
        keyRef.current = key
        setSalt(exportSalt(newSalt))
        setIsPasswordProtected(true)
        setIsSetupModalOpen(false)

        if (editor) {
            const exported = exportSalt(newSalt)
            saveChanges(editor.getHTML(), { forceProtected: true, forceSalt: exported })
            setIsLocked(true)
        }
    }

    // const toggleLock = () => {
    //     if (isPasswordProtected) {
    //         setIsLocked(true)
    //     } else {
    //         setIsSetupModalOpen(true)
    //     }
    // }

    const setLink = () => {
        const url = window.prompt('URL')
        if (url) editor?.chain().focus().setLink({ href: url }).run()
    }

    return (
        <div className="editor-container">
            <div className="export-bar">
                <div className="export-group-label">
                    <Download size={14} />
                    <span style={{ fontSize: '8px', fontWeight: 700 }}>EXPORT</span>
                </div>
                <button className="export-btn" onClick={() => triggerExport('docx')} title="Export as DOCX">
                    <FileType size={16} />
                </button>
                <button className="export-btn" onClick={() => triggerExport('pdf')} title="Export as PDF">
                    <FileIcon size={16} />
                </button>
                <button className="export-btn" onClick={() => triggerExport('txt')} title="Export as TXT">
                    <Baseline size={16} />
                </button>
            </div>

            <EditorToolbar editor={editor} filename={filename} setFilename={setFilename} />

            <div className="editor-content-wrapper">
                <EditorContent editor={editor} />
            </div>

            {/* --- MODALS --- */}
            {(isSetupModalOpen && !isLocked) && (
                <SetupPasswordModal
                    onComplete={handleSetupComplete}
                    onClose={() => setIsSetupModalOpen(false)}
                />
            )}

            {isLocked && (
                <LockScreen
                    onUnlock={handleUnlock}
                />
            )}

            {isExportVerifyOpen && (
                <ExportVerifyModal
                    isOpen={isExportVerifyOpen}
                    onClose={() => setIsExportVerifyOpen(false)}
                    onVerify={verifyAndExport}
                    isVerifying={isVerifyingExport}
                />
            )}

            {/* Bubble Menu */}
            {editor && (
                <BubbleMenu editor={editor} className="bubble-menu glass">
                    <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}><Bold size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}><Italic size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'active' : ''}><Baseline size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'active' : ''}><Highlighter size={16} /></button>
                    <div className="divider" />
                    <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}><AlignLeft size={16} /></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}><AlignCenter size={16} /></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}><AlignRight size={16} /></button>
                    <div className="divider" />
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}><Heading1 size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}><Heading2 size={16} /></button>
                    <div className="divider" />
                    <button onClick={setLink} className={editor.isActive('link') ? 'active' : ''}><LinkIcon size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'active' : ''}><Code size={16} /></button>
                </BubbleMenu>
            )}

            {/* Storage HUD */}
            <div className={`joint-storage-hud glass ${(payloadSize > +import.meta.env.VITE_GLOBAL_ENCRYPTED_CHAR_COUNT || needsToken) ? 'visible' : ''} ${needsToken ? 'pulse-red' : ''}`}>
                <div className="hud-status">
                    {loading ? (
                        <Loader2 size={14} className="animate-spin text-blue-400" />
                    ) : gistId ? (
                        <Github size={14} className="text-blue-400" />
                    ) : (
                        <Terminal size={14} className="text-purple-400" />
                    )}
                    <span>{loading ? 'Syncing...' : gistId ? 'Gist Sync Active' : 'Provider Fallback'}</span>
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

            {/* Status Footer */}
            <div className="editor-footer glass">
                <div className="footer-section">
                    <CheckCircle2 size={12} className={isSaving ? 'animate-pulse text-accent' : 'text-green-400'} />
                    <span>{isSaving ? 'Syncing...' : 'Encrypted & Saved'}</span>
                </div>
            </div>

            {/* Stats Bubble */}
            <div className="stats-bubble glass">
                <div className="stats-item">
                    <span className="stats-value">{count.words}</span>
                    <span className="stats-label">Words</span>
                </div>
                <div className="stats-item">
                    <span className="stats-value">{count.chars}</span>
                    <span className="stats-label">Chars</span>
                </div>

                {/* {(isPasswordProtected || isSaving || loading) && (
                    <div className="stats-item" style={{ marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid var(--border)' }}>
                        {isSaving || loading ? (
                            <Loader2 size={16} className="animate-spin text-blue-400" />
                        ) : (
                            <div className="flex items-center gap-2 cursor-pointer" onClick={toggleLock}>
                                <Lock size={16} className="text-purple-400" />
                                {timeLeft > 0 && <span className="stats-label" style={{ fontSize: '9px' }}>{timeLeft}s</span>}
                            </div>
                        )}
                    </div>
                )} */}

                {/* {!isPasswordProtected && !loading && !isSaving && (
                    <div className="stats-item" style={{ marginLeft: '4px' }}>
                        <Unlock size={16} className="text-green-400/50 cursor-pointer" onClick={toggleLock} />
                    </div>
                )} */}
            </div>
        </div>
    )
}
