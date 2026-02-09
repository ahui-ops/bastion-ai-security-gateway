
interface GithubRepoInfo {
    owner: string;
    repo: string;
}

interface TreeItem {
    path: string;
    mode: string;
    type: string;
    sha: string;
    size?: number;
    url: string;
}

export const parseGithubUrl = (url: string): GithubRepoInfo | null => {
    try {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
            let repo = parts[1];
            if (repo.endsWith('.git')) {
                repo = repo.replace(/\.git$/, '');
            }
            return { owner: parts[0], repo };
        }
    } catch (e) {
        console.error("Invalid URL", e);
    }
    return null;
};

const getRepoDetails = async (owner: string, repo: string) => {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!res.ok) throw new Error(`Failed to fetch repo details: ${res.statusText}`);
    return res.json();
};

const getRepoTree = async (owner: string, repo: string, branch: string) => {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    if (!res.ok) throw new Error(`Failed to fetch repo tree: ${res.statusText}`);
    return res.json();
};

const getFileContent = async (owner: string, repo: string, path: string): Promise<string> => {
    const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${path.split('/').map(encodeURIComponent).join('/')}/HEAD/${path}`);
    // fallback to api if raw fails or specific branch? 
    // actually raw.githubusercontent.com is easier: /{owner}/{repo}/{branch}/{path}
    // But I need the branch.
    return "";
};

// Better approach for content: use the blob API or download_url from contents API?
// contents API restricts size to 1MB.
// raw.githubusercontent is best.
// URL: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}

const fetchRawContent = async (owner: string, repo: string, branch: string, path: string) => {
    const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`);
    if (!res.ok) return ""; // Skip files we can't read
    return await res.text();
}

export const fetchRepositoryContext = async (url: string): Promise<string> => {
    const info = parseGithubUrl(url);
    if (!info) throw new Error("Invalid GitHub URL");

    const { owner, repo } = info;

    // 1. Get default branch
    const details = await getRepoDetails(owner, repo);
    const defaultBranch = details.default_branch || 'main';

    // 2. Get Tree
    const treeData = await getRepoTree(owner, repo, defaultBranch);
    const tree: TreeItem[] = treeData.tree || [];

    // 3. Filter relevant files (prevent fetching thousands of files)
    // Priority: sensitive files, source code.
    // Ignore: images, locks, binary, large files.
    const meaningfulExtensions = ['.java', '.kt', '.gradle', '.xml', '.ts', '.tsx', '.js', '.jsx', '.json', '.py', '.env', '.properties'];
    const ignorePatterns = ['node_modules', 'dist', 'build', '.git', 'package-lock.json', 'yarn.lock', 'test', 'androidTest', 'res/drawable', 'res/mipmap'];

    const targetFiles = tree.filter(item => {
        if (item.type !== 'blob') return false;

        // Check extension
        const hasExtension = meaningfulExtensions.some(ext => item.path.endsWith(ext) || item.path.endsWith('Dockerfile') || item.path.endsWith('Makefile'));
        if (!hasExtension) return false;

        // Check ignore list (more aggressive filtering of tests and assets)
        const isIgnored = ignorePatterns.some(pattern => item.path.includes(pattern));
        if (isIgnored) return false;

        // Limit individual file size to 50KB (was 100KB) to save tokens
        if (item.size && item.size > 50 * 1024) return false;

        return true;
    });

    // Sort by high-security relevance
    const sortedFiles = targetFiles.sort((a, b) => {
        const getPriority = (path: string) => {
            if (path.includes('.env') || path.includes('secret') || path.includes('key')) return 100;
            if (path.includes('build.gradle') || path.includes('settings.gradle') || path.includes('local.properties')) return 90;
            if (path.includes('AndroidManifest.xml')) return 80;
            if (path.includes('Service') || path.includes('Auth') || path.includes('Security') || path.includes('Vault')) return 70;
            if (path.includes('Controller') || path.includes('Manager')) return 50;
            return 0;
        };

        return getPriority(b.path) - getPriority(a.path);
    });

    // Limit to top 10 files (was 15) for better quota management
    const filesToFetch = sortedFiles.slice(0, 10);

    let context = "";

    // Parallel fetch
    await Promise.all(filesToFetch.map(async file => {
        try {
            const content = await fetchRawContent(owner, repo, defaultBranch, file.path);
            if (content) {
                // Trim very long files just in case
                const trimmedContent = content.length > 30000 ? content.substring(0, 30000) + "\n... [truncated]" : content;
                context += `\n// File: ${file.path}\n${trimmedContent}\n`;
            }
        } catch (err) {
            console.error(`Failed to read ${file.path}`, err);
        }
    }));

    if (!context) {
        throw new Error("No readable code found in this repository.");
    }

    return context;
};
