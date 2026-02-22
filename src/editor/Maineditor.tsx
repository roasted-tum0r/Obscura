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

import {
    importKey,
    deriveKeyFromPassword,
    importSalt,
    exportSalt
} from "../utils/Crypto"
import { SecureStorage } from "../utils/SecureStorage"
import { EditorToolbar } from "./EditorToolbar"
import { SetupPasswordModal } from "./SetupPasswordModal"
import { LockScreen } from "./LockScreen"
import { ExportVerifyModal } from "./ExportVerifyModal"
import { ExportBar, performExportAction } from "./ExportBar"
import { StorageHUD } from "./StorageHUD"
import { StatsBubble } from "./StatsBubble"
import { useIdleLock } from "../hooks/useIdleLock"
import { useEditorState } from "../hooks/useEditorState"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from '../store';
import { fetchFromGist } from "../store/gistSlice"
import {
    Bold,
    Italic,
    Highlighter,
    Heading1,
    Heading2,
    Baseline,
    CheckCircle2,
    Code,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
} from 'lucide-react'

export const MainEditor = () => {
    const dispatch = useDispatch<AppDispatch>()
    const { githubToken, loading, gistId } = useSelector((state: RootState) => state.gist)
    const charLimit = Number(import.meta.env.VITE_GLOBAL_ENCRYPTED_CHAR_COUNT) || 2000

    // --- State & Logic Hooks ---
    const [editorInstance, setEditorInstance] = React.useState<any>(null)
    const [isSetupModalOpen, setIsSetupModalOpen] = React.useState(false)
    const [isPasswordProtected, setIsPasswordProtected] = React.useState(false)
    const [salt, setSalt] = React.useState<string | null>(null)

    // Pass editorInstance and isLocked to the custom state hook
    const { isLocked, setIsLocked, timeLeft } = useIdleLock(isPasswordProtected)
    const {
        filename, setFilename,
        isSaving,
        needsToken,
        payloadSize,
        count, setCount,
        keyRef,
        saveChanges,
        debouncedSave
    } = useEditorState(editorInstance, isLocked, isPasswordProtected, salt)

    // Update idle lock's protection status
    React.useEffect(() => {
        // Technically useIdleLock could take this as a prop and handle internal effect, 
        // but for now we sync it here if needed or just pass it in.
    }, [isPasswordProtected])

    // --- Export Management ---
    const [isExportVerifyOpen, setIsExportVerifyOpen] = React.useState(false)
    const [exportType, setExportType] = React.useState<'docx' | 'txt' | 'pdf' | null>(null)
    const [isVerifyingExport, setIsVerifyingExport] = React.useState(false)

    const triggerExport = (type: 'docx' | 'txt' | 'pdf') => {
        if (isPasswordProtected) {
            setExportType(type)
            setIsExportVerifyOpen(true)
        } else {
            performExportAction(editor, filename, type)
        }
    }

    const verifyAndExport = async (password: string) => {
        setIsVerifyingExport(true)
        try {
            const saltBytes = importSalt(salt!)
            const derivedKey = await deriveKeyFromPassword(password, saltBytes)
            const hash = window.location.hash.slice(1)
            const parsed = JSON.parse(atob(hash))
            // Attempt to decrypt to verify password
            const decrypted = await SecureStorage.decryptString(parsed.d, parsed.iv, derivedKey)
            if (decrypted) {
                performExportAction(editor, filename, exportType!)
                setIsExportVerifyOpen(false)
            }
        } catch (e) {
            alert("Incorrect password")
        } finally {
            setIsVerifyingExport(false)
        }
    }

    // --- Editor Instance ---
    // We use a ref for debouncedSave to avoid stale closures in Tiptap instance
    const saveRef = React.useRef(debouncedSave)
    React.useEffect(() => {
        saveRef.current = debouncedSave
    }, [debouncedSave])

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
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Table.configure({ resizable: true }),
            TableRow, TableHeader, TableCell,
            Subscript, Superscript,
            TextStyle, Color, FontFamily,
            TiptapImage.configure({
                allowBase64: true,
                HTMLAttributes: { class: 'editor-image' },
            }),
            CodeBlockLowlight.configure({ lowlight }),
            Focus.configure({ className: 'has-focus', mode: 'all' }),
            Dropcursor.configure({ color: '#8b5cf6', width: 2 }),
            Gapcursor,
        ],
        content: '',
        onUpdate: ({ editor }) => {
            if (isLocked) return
            // Use the current ref to avoid stale closure issues
            saveRef.current(editor.getHTML())

            setCount({
                chars: editor.storage.characterCount.characters(),
                words: editor.storage.characterCount.words()
            })
        },
    })

    React.useEffect(() => {
        if (editor) setEditorInstance(editor)
    }, [editor])

    // --- Initialization Logic ---
    React.useEffect(() => {
        const init = async () => {
            try {
                const hash = window.location.hash.slice(1)
                if (!hash) return

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
                    const html = await SecureStorage.decryptString(encryptedData, parsed.iv, keyRef.current)
                    if (editor) editor.commands.setContent(html)
                }
            } catch (error) {
                console.error("Init failed:", error)
            }
        }
        if (editor) init()
    }, [editor])

    // --- Auth Actions ---
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
            const html = await SecureStorage.decryptString(encryptedData, parsed.iv, key)

            keyRef.current = key
            if (editor) editor.commands.setContent(html)
            setIsLocked(false)
            return true
        } catch (e) {
            return false
        }
    }

    const handleSetupComplete = async (password: string) => {
        const derivedSalt = importSalt(exportSalt(window.crypto.getRandomValues(new Uint8Array(16))))
        const key = await deriveKeyFromPassword(password, derivedSalt)
        keyRef.current = key
        setSalt(exportSalt(derivedSalt))
        setIsPasswordProtected(true)
        setIsSetupModalOpen(false)

        if (editor) {
            saveChanges(editor.getHTML(), { forceProtected: true, forceSalt: exportSalt(derivedSalt) })
            setIsLocked(true)
        }
    }

    const toggleLock = () => {
        if (isPasswordProtected) {
            setIsLocked(true)
        } else {
            setIsSetupModalOpen(true)
        }
    }

    const setLink = () => {
        const url = window.prompt('URL')
        if (url) editor?.chain().focus().setLink({ href: url }).run()
    }

    return (
        <div className="editor-container">
            {/* 
                Responsive Components:
                ExportBar and EditorToolbar handle their own mobile layouts via CSS.
            */}
            <ExportBar
                onTriggerExport={triggerExport}
            />

            <EditorToolbar editor={editor} filename={filename} setFilename={setFilename} />

            <div className="editor-content-wrapper">
                <EditorContent editor={editor} />
            </div>

            {/* --- Modals --- */}
            {(isSetupModalOpen && !isLocked) && (
                <SetupPasswordModal
                    onComplete={handleSetupComplete}
                    onClose={() => setIsSetupModalOpen(false)}
                />
            )}

            {isLocked && <LockScreen onUnlock={handleUnlock} />}

            {/* Countdown indicator for locked state could be added here if needed, using timeLeft */}
            {isPasswordProtected && !isLocked && timeLeft < 10 && (
                <div style={{ position: 'fixed', bottom: '100px', left: '24px', opacity: 0.5, fontSize: '10px' }}>
                    Locking in {timeLeft}s...
                </div>
            )}
            {isExportVerifyOpen && (
                <ExportVerifyModal
                    isOpen={isExportVerifyOpen}
                    onClose={() => setIsExportVerifyOpen(false)}
                    onVerify={verifyAndExport}
                    isVerifying={isVerifyingExport}
                />
            )}

            {/* --- Bubble Menu & HUDs --- */}
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

            {/* Status HUDs */}
            <div className="editor-status-huds">
                <StatsBubble
                    count={count}
                    isSaving={isSaving}
                    loading={loading}
                    isPasswordProtected={isPasswordProtected}
                    timeLeft={timeLeft}
                    onToggleLock={toggleLock}
                />

                <StorageHUD
                    payloadSize={payloadSize}
                    needsToken={needsToken}
                    loading={loading}
                    gistId={gistId}
                    githubToken={githubToken}
                    charLimit={charLimit}
                />
            </div>

            <div className="editor-footer glass">
                <div className="footer-section">
                    <CheckCircle2 size={12} className={isSaving ? 'animate-pulse text-accent' : 'text-green-400'} />
                    <span>{isSaving ? 'Syncing...' : 'Encrypted & Saved'}</span>
                </div>
            </div>
        </div>
    )
}
