const parseAdminEmails = () => {
    const raw = import.meta.env.VITE_ADMIN_EMAILS;
    if (!raw) return [];
    return raw
        .split(',')
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
};

export const isAdmin = (email: string | null | undefined): boolean => {
    if (!email) return false;
    const allowlist = parseAdminEmails();
    if (allowlist.length === 0) return false;
    return allowlist.includes(email.toLowerCase());
};
