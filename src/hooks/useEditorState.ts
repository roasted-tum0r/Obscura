import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Editor } from '@tiptap/react';
import type { RootState, AppDispatch } from '../store';
import { saveToGist } from '../store/gistSlice';
import { SecureStorage } from '../utils/SecureStorage';
import { generateKey, exportKey } from '../utils/Crypto';

const debounce = (fn: Function, ms: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (this: any, ...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
};

export const useEditorState = (
    editor: Editor | null,
    isLocked: boolean,
    isPasswordProtected: boolean,
    salt: string | null
) => {
    const dispatch = useDispatch<AppDispatch>();
    const { filename: urlFilename } = useParams();
    const navigate = useNavigate();
    const { githubToken, gistId } = useSelector((state: RootState) => state.gist);

    const [filename, setFilename] = React.useState(urlFilename || 'Untitled');
    const [isSaving, setIsSaving] = React.useState(false);
    const [needsToken, setNeedsToken] = React.useState(false);
    const [payloadSize, setPayloadSize] = React.useState(0);
    const [count, setCount] = React.useState({ chars: 0, words: 0 });

    const keyRef = React.useRef<CryptoKey | null>(null);
    const lastSaveTimestamp = React.useRef(0);

    const saveChanges = React.useCallback(async (html: string, overrides?: { forceProtected?: boolean, forceSalt?: string }) => {
        const startTimestamp = Date.now();
        const isProtected = overrides?.forceProtected !== undefined ? overrides.forceProtected : isPasswordProtected;
        const saltToUse = overrides?.forceSalt !== undefined ? overrides.forceSalt : salt;

        if (isLocked && !overrides?.forceProtected) return;

        setIsSaving(true);
        try {
            if (!keyRef.current) {
                keyRef.current = await generateKey();
            }

            // Use the new generic SecureStorage utility
            const encrypted = await SecureStorage.encryptString(html, keyRef.current);
            setPayloadSize(encrypted.data.length);

            let payload: any = {
                v: 2,
                iv: encrypted.iv,
                p: isProtected,
                s: saltToUse || undefined,
                fn: filename
            };

            if (!isProtected) {
                payload.k = await exportKey(keyRef.current);
            }

            const charLimit = Number(import.meta.env.VITE_GLOBAL_ENCRYPTED_CHAR_COUNT) || 2000;
            console.log(`[Save] Payload Size: ${encrypted.data.length}, Limit: ${charLimit}`);

            if (encrypted.data.length > charLimit) {
                console.log("[Save] Triggering Gist sync...");
                payload.mode = "gist";
                const resultAction = await dispatch(saveToGist({
                    content: encrypted.data,
                    token: githubToken || "",
                    gistId: gistId
                }));

                if (saveToGist.fulfilled.match(resultAction)) {
                    payload.gid = resultAction.payload;
                    setNeedsToken(false);
                    console.log("[Save] Gist sync successful. Gid:", payload.gid);
                } else {
                    console.error("[Save] Gist thunk rejected:", resultAction.payload || resultAction.error);
                    if (!githubToken) {
                        setNeedsToken(true);
                        console.warn("[Save] No GitHub token and global fallback failed. Visibility triggered.");
                        setIsSaving(false);
                        return;
                    }
                }
            } else {
                setNeedsToken(false);
                payload.mode = "open";
                payload.d = encrypted.data;
            }

            if (startTimestamp < lastSaveTimestamp.current) return;

            const newHash = btoa(JSON.stringify(payload));
            const cleanFilename = filename.trim().replace(/\s+/g, '-');

            if (!isLocked || overrides?.forceProtected) {
                navigate(`/${cleanFilename}#${newHash}`, { replace: true });
                lastSaveTimestamp.current = startTimestamp;
            }
        } catch (err) {
            console.error("[Save] Process failed:", err);
        } finally {
            setIsSaving(false);
        }

        if (editor) {
            setCount({
                chars: editor.storage.characterCount.characters(),
                words: editor.storage.characterCount.words()
            });
        }
    }, [filename, isPasswordProtected, salt, githubToken, gistId, isLocked, editor, dispatch, navigate]);

    const debouncedSave = React.useMemo(() => debounce((html: string) => saveChanges(html), 800), [saveChanges]);

    return {
        filename, setFilename,
        isSaving, setIsSaving,
        needsToken, setNeedsToken,
        payloadSize, setPayloadSize,
        count, setCount,
        keyRef,
        saveChanges,
        debouncedSave
    };
};
