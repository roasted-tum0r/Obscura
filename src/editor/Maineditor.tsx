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
import { importKey, decrypt, encrypt, exportKey, generateKey } from "../utils/Crypto"
import { EditorToolbar } from "./EditorToolbar"
import {
    Bold,
    Italic,
    Highlighter,
    Heading1,
    Heading2,
    Baseline,
    Github,
    Lock,
    Loader2,
    CheckCircle2,
    Code,
    Link as LinkIcon,
    Terminal,
    AlignLeft,
    AlignCenter,
    AlignRight
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

export const MainEditor = () => {
    const dispatch = useDispatch<AppDispatch>()
    const { githubToken, loading, gistId } = useSelector((state: RootState) => state.gist)

    const [exportedKey, setExportedKey] = React.useState<string>('')
    const [isSaving, setIsSaving] = React.useState(false)
    const [needsToken, setNeedsToken] = React.useState(false)
    const [payloadSize, setPayloadSize] = React.useState(0)

    const keyRef = React.useRef<CryptoKey | null>(null)
    const isInitialLoad = React.useRef(true)

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
        ],
        content: '',
        onUpdate: ({ editor }) => {
            if (isInitialLoad.current) return
            debouncedSave(editor.getHTML())
        },
    })

    const saveChanges = async (html: string) => {
        setIsSaving(true)
        try {
            if (!keyRef.current) {
                const newKey = await generateKey()
                keyRef.current = newKey
                setExportedKey(await exportKey(newKey))
            }
            const key = keyRef.current!
            const currentExportedKey = exportedKey || await exportKey(key)

            const compressed = await Compressor.compressGzip(html)
            const compressedBase64 = Compressor.toBase64(compressed)
            const encrypted = await encrypt(compressedBase64, key)
            setPayloadSize(encrypted.data.length)

            let payload: any = { v: 1, k: currentExportedKey, iv: encrypted.iv }

            if (encrypted.data.length > 1800) {
                console.log("[Pipeline] Threshold hit - sync required");
                payload.mode = "gist"
                const resultAction = await dispatch(saveToGist({
                    content: encrypted.data,
                    token: githubToken || ""
                }))

                if (saveToGist.fulfilled.match(resultAction)) {
                    payload.gid = resultAction.payload
                    setNeedsToken(false)
                } else if (!githubToken) {
                    setNeedsToken(true)
                    return
                }
            } else {
                setNeedsToken(false)
                payload.mode = "open"
                payload.d = encrypted.data
            }

            const newHash = btoa(JSON.stringify(payload))
            if (window.location.hash !== '#' + newHash) {
                window.location.hash = newHash
            }
        } catch (err) {
            console.error("Save failed:", err)
        } finally {
            setIsSaving(false)
        }
    }

    const debouncedSave = React.useMemo(() => debounce(saveChanges, 1000), [exportedKey, githubToken])

    React.useEffect(() => {
        const init = async () => {
            try {
                const hash = window.location.hash.slice(1)
                if (!hash) { isInitialLoad.current = false; return; }

                const parsed = JSON.parse(atob(hash))
                const key = await importKey(parsed.k)
                keyRef.current = key
                setExportedKey(parsed.k)

                let encryptedData = parsed.d
                if (parsed.mode === 'gist' && parsed.gid) {
                    const resultAction = await dispatch(fetchFromGist({ gistId: parsed.gid, token: githubToken || undefined }))
                    if (fetchFromGist.fulfilled.match(resultAction)) {
                        encryptedData = resultAction.payload
                    }
                }

                if (!encryptedData) return
                const decryptedBase64 = await decrypt(encryptedData, parsed.iv, key)
                const html = await Compressor.decompressGzip(Compressor.fromBase64(decryptedBase64))
                if (editor) editor.commands.setContent(html)
            } catch (error) {
                console.error("Init failed:", error)
            } finally {
                isInitialLoad.current = false
            }
        }
        if (editor) init()
    }, [editor, dispatch])

    const characters = editor?.storage.characterCount.characters() || 0
    const words = editor?.storage.characterCount.words() || 0

    const setLink = () => {
        const url = window.prompt('URL')
        if (url) editor?.chain().focus().setLink({ href: url }).run()
    }

    return (
        <div className="editor-container">
            {/* Top Toolbar (Fixed in index.css) */}
            <EditorToolbar editor={editor} />

            {/* Main Scrolling Surface */}
            <div className="editor-surface">
                <EditorContent editor={editor} />

                {/* Footer Signature */}
                <footer className="editor-footer">
                    <div className="footer-item">
                        <span>© 2026</span>
                    </div>
                    <div className="footer-item">
                        <span>roasted-tum0r</span>
                    </div>
                    <div className="footer-item">
                        <Lock size={10} />
                        <span>AES-GCM SECURED</span>
                    </div>
                </footer>
            </div>

            {/* Joint Storage HUD - Only appears when threshold exceeded */}
            <div className={`joint-storage-hud glass ${(payloadSize > 1800 || needsToken) ? 'visible' : ''} ${needsToken ? 'pulse-red' : ''}`}>
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

            {/* Bubble Menu */}
            {editor && (
                <BubbleMenu editor={editor} className="bubble-menu glass">
                    <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}><Bold size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}><Italic size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}><Baseline size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'is-active' : ''}><Highlighter size={16} /></button>
                    <div className="divider" />
                    <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}><AlignLeft size={16} /></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}><AlignCenter size={16} /></button>
                    <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}><AlignRight size={16} /></button>
                    <div className="divider" />
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}><Heading1 size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}><Heading2 size={16} /></button>
                    <div className="divider" />
                    <button onClick={setLink} className={editor.isActive('link') ? 'is-active' : ''}><LinkIcon size={16} /></button>
                    <button onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'is-active' : ''}><Code size={16} /></button>
                </BubbleMenu>
            )}

            {/* Bottom Left Stats Bubble */}
            <div className="stats-bubble glass">
                <div className="stats-item">
                    <span className="stats-value">{words}</span>
                    <span className="stats-label">Words</span>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div className="stats-item">
                    <span className="stats-value">{characters}</span>
                    <span className="stats-label">Chars</span>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div className="stats-item">
                    {isSaving || loading ? (
                        <Loader2 size={16} className="animate-spin text-blue-400" />
                    ) : (
                        <Lock size={16} className="text-green-400" />
                    )}
                </div>
            </div>
        </div>
    )
}
