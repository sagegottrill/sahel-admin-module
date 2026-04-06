export type FormField =
    | {
        key: string;
        label: string;
        type: 'text' | 'textarea' | 'number' | 'date';
        required?: boolean;
        placeholder?: string;
    }
    | {
        key: string;
        label: string;
        type: 'select';
        required?: boolean;
        options: string[];
    }
    | {
        key: string;
        label: string;
        type: 'boolean';
        required?: boolean;
    };

export interface FormDefinition {
    id: string;
    created_at?: string;
    updated_at?: string;
    name: string;
    description?: string;
    is_active?: boolean;
    fields: FormField[];
}

export interface Submission {
    id: string;
    created_at: string;
    form_id: string;
    submitter_email: string;
    submitter_user_id?: string | null;
    status: 'Pending' | 'Approved' | 'Rejected' | string;
    cleared_at?: string | null;
    cleared_by_email?: string | null;
    payload: Record<string, unknown>;
}

export interface ContactMessage {
    id: string;
    created_at: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'New' | 'Read' | 'Replied';
}
