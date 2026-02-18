import React from "react"
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import CharacterCount from '@tiptap/extension-character-count'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import { importKey, decrypt, encrypt, exportKey, generateKey } from "../utils/Crypto"
import { EditorToolbar } from "./EditorToolbar"
import {
    Bold,
    Italic,
    Highlighter,
    Heading1,
    Heading2,
    Baseline
} from 'lucide-react'

// Simple debounce function
const debounce = (fn: Function, ms: number) => {
    let timeoutId: ReturnType<typeof setTimeout>
    return function (this: any, ...args: any[]) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn.apply(this, args), ms)
    }
}

export const MainEditor = () => {
    const [exportedKey, setExportedKey] = React.useState<string>('')
    const keyRef = React.useRef<CryptoKey | null>(null)
    const isInitialLoad = React.useRef(true)

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Unleash your thoughts, secured by Obscura...',
            }),
            Typography,
            Highlight,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Link.configure({
                openOnClick: false,
            }),
            Underline,
            CharacterCount,
            BubbleMenuExtension,
        ],
        content: '',
        onUpdate: ({ editor }) => {
            if (isInitialLoad.current) return
            debouncedSave(editor.getHTML())
        },
    })

    const saveChanges = async (html: string) => {
        if (!keyRef.current) {
            const newKey = await generateKey()
            keyRef.current = newKey
            const exported = await exportKey(newKey)
            setExportedKey(exported)
        }

        const key = keyRef.current
        if (!key) return

        // Use the exportedKey from state if it exists, otherwise the one we just generated
        const currentExportedKey = exportedKey || await exportKey(key)
        if (!exportedKey) setExportedKey(currentExportedKey)

        const encrypted = await encrypt(html, key)

        const payload = {
            v: 1,
            mode: "open",
            k: currentExportedKey,
            d: encrypted.data,
            iv: encrypted.iv
        }

        // Update URL hash without triggers a reload or state loop
        const newHash = btoa(JSON.stringify(payload))
        if (window.location.hash !== '#' + newHash) {
            window.location.hash = newHash
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSave = React.useMemo(() => debounce(saveChanges, 1000), [exportedKey])

    React.useEffect(() => {
        const init = async () => {
            try {
                const hash = window.location.hash.slice(1)
                if (!hash) {
                    isInitialLoad.current = false
                    return
                }

                const parsed = JSON.parse(atob(hash))
                const key = await importKey(parsed.k)

                keyRef.current = key
                setExportedKey(parsed.k)

                const decrypted = await decrypt(parsed.d, parsed.iv, key)

                if (editor && decrypted) {
                    editor.commands.setContent(decrypted)
                }
            } catch (error) {
                console.error("Failed to restore session:", error)
            } finally {
                isInitialLoad.current = false
            }
        }

        if (editor) {
            init()
        }
    }, [editor])

    const words = editor?.storage.characterCount.words() || 0
    const characters = editor?.storage.characterCount.characters() || 0

    return (
        <div className="editor-container">
            {editor && (
                <BubbleMenu editor={editor} className="bubble-menu glass">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={editor.isActive('bold') ? 'is-active' : ''}
                    >
                        <Bold size={16} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={editor.isActive('italic') ? 'is-active' : ''}
                    >
                        <Italic size={16} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={editor.isActive('underline') ? 'is-active' : ''}
                    >
                        <Baseline size={16} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        className={editor.isActive('highlight') ? 'is-active' : ''}
                    >
                        <Highlighter size={16} />
                    </button>
                    <div className="divider" />
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                    >
                        <Heading1 size={16} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                    >
                        <Heading2 size={16} />
                    </button>
                </BubbleMenu>
            )}

            <EditorToolbar editor={editor} />
            <div className="editor-surface glass">
                <EditorContent editor={editor} />
            </div>

            <div className="security-status">
                <div className="metrics">
                    <span>{words} words</span>
                    <span className="dot"></span>
                    <span>{characters} characters</span>
                </div>
                <div className="status">
                    <div className="status-dot" />
                    Encrypted & Secured
                </div>
            </div>
        </div>
    )
}
