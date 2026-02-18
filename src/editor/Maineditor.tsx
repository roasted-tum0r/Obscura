import React from "react"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { importKey, decrypt, encrypt, exportKey, generateKey } from "../utils/Crypto"
import { EditorToolbar } from "./EditorToolbar"

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
        extensions: [StarterKit],
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

    return (
        <div className="editor-container">
            <EditorToolbar editor={editor} />
            <div className="editor-surface glass">
                <EditorContent editor={editor} />
            </div>

            <div className="security-status">
                <div className="status-dot" />
                Encrypted & Secured
            </div>
        </div>
    )
}