// src/utils/Gist.ts
import axios, { type AxiosResponse } from 'axios';

const GIST_API_URL = "https://api.github.com/gists";

// Fallback token for users without a GitHub account. 
// Data is still encrypted locally, so the owner of this token cannot read the content.
// SECURITY NOTE: This token is exposed in the frontend bundle. 
const GLOBAL_GIST_TOKEN = import.meta.env.VITE_GLOBAL_GIST_TOKEN || "";

export interface GistResponse {
    id: string;
    files: {
        [key: string]: {
            content: string;
        }
    }
}

/**
 * Creates a secret gist with the given content.
 * Requires a GitHub Personal Access Token (PAT).
 */
export async function createGist(content: string, token: string): Promise<AxiosResponse> {
    const finalToken = token || GLOBAL_GIST_TOKEN;
    if (!finalToken) {
        throw new Error("No GitHub token provided and no global fallback configured.");
    }

    const response = await axios.post<GistResponse>(
        GIST_API_URL,
        {
            description: "Obscura Encrypted Data",
            public: false,
            files: {
                "obscura.data": {
                    content: content,
                },
            },
        },
        {
            headers: {
                "Authorization": `token ${finalToken}`,
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json",
            },
        }
    );

    return response;
}

/**
 * Fetches the content of a gist by ID.
 * Token is optional for public/secret gists if you have the direct link, 
 * but recommended for consistency.
 */
export async function getGist(gistId: string, token?: string): Promise<string> {
    const finalToken = token || GLOBAL_GIST_TOKEN;
    const headers: Record<string, string> = {
        "Accept": "application/vnd.github.v3+json",
    };
    if (finalToken) {
        headers["Authorization"] = `token ${finalToken}`;
    }

    const response = await axios.get<GistResponse>(`${GIST_API_URL}/${gistId}`, {
        headers,
    });

    const file = response.data.files["obscura.data"];

    if (!file) {
        throw new Error("Gist does not contain obscura.data file.");
    }

    return file.content;
}

/**
 * Updates an existing gist.
 */
export async function updateGist(gistId: string, content: string, token: string): Promise<AxiosResponse> {
    const finalToken = token || GLOBAL_GIST_TOKEN;
    if (!finalToken) {
        throw new Error("No GitHub token provided and no global fallback configured.");
    }

    const response = await axios.patch<GistResponse>(
        `${GIST_API_URL}/${gistId}`,
        {
            files: {
                "obscura.data": {
                    content: content,
                },
            },
        },
        {
            headers: {
                "Authorization": `token ${finalToken}`,
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json",
            },
        }
    );

    return response;
}
