export interface AnalysisResult {
    isClean: boolean;
    issues: string[];
    age?: number;
}

export interface ScreeningSummary {
    total: number;
    clean: number;
    flagged: number;
}

// Keywords mapping for capability checks (simple heuristic)
const QUALIFICATION_KEYWORDS: Record<string, string[]> = {
    'Data Scout': ['data', 'survey', 'enumeration', 'monitoring', 'verification'],
    'Warden': ['security', 'access', 'operations', 'incident', 'safety'],
    'System Admin': ['admin', 'systems', 'iam', 'security', 'audit'],
};

export const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};

// Main Analysis Function
export const analyzeCandidate = (app: any): AnalysisResult => {
    const issues: string[] = [];
    let isClean = true;

    // 1. AGE CHECK
    const age = calculateAge(app.date_of_birth);
    if (age === null) {
        issues.push("Date of birth missing");
        isClean = false;
    } else {
        if (age < 18) {
            issues.push(`Underage (${age} years old)`);
            isClean = false;
        } else if (age > 60) {
            issues.push(`Over age limit (${age} years old)`);
            isClean = false;
        }
    }

    // 2. QUALIFICATION CHECK
    // Normalize position name to match keywords keys
    const positionKey = Object.keys(QUALIFICATION_KEYWORDS).find(key =>
        app.position.includes(key)
    );

    if (positionKey) {
        const keywords = QUALIFICATION_KEYWORDS[positionKey];
        const qual = (app.qualification || "").toLowerCase();

        // Check if ANY keyword matches
        const hasMatch = keywords.some(kw => qual.includes(kw.toLowerCase()));

        // Very basic heuristic check - flag if NO keywords match
        // Only flag if qualification is provided but doesn't match
        if (app.qualification && !hasMatch) {
            issues.push(`Qualification mismatch? ('${app.qualification}' vs '${positionKey}')`);
            // We mark as potential issue, but human review is final
            isClean = false;
        }
    }

    // 3. DOCUMENT AUDIT
    if (!app.cv_url) {
        issues.push("Missing CV");
        isClean = false;
    }
    if (!app.license_number || app.license_number.length < 3) {
        // Some roles might not need license? assuming all distinct roles here do
        issues.push("Missing/Invalid License Number");
        isClean = false;
    }
    if (!app.state_of_origin) {
        issues.push("Missing State of Origin");
        isClean = false;
    }

    // 4. NYSC Check (Generic)
    if (app.year_of_graduation) {
        const gradYear = parseInt(app.year_of_graduation);
        // If graduated recently (e.g., this year) checks are tricky, but generally fine.
        // If graduated 30 years ago, that's fine too.
        // This is just a placeholder for more logic if needed.
    }

    return {
        isClean,
        issues,
        age: age || 0
    };
};

// --- Gender Prediction Logic ---

const MALE_TITLES = ['mr', 'mister', 'mallam', 'mal', 'alhaji', 'prince', 'engr', 'dr'];
const FEMALE_TITLES = ['mrs', 'miss', 'ms', 'hajiya', 'princess', 'lady'];

const COMMON_MALE_NAMES = new Set([
    'ibrahim', 'musa', 'ahmed', 'mohammed', 'muhammed', 'muhammad', 'sani', 'bello', 'abdullahi',
    'abubakar', 'umar', 'aliyu', 'yusuf', 'kabir', 'usman', 'hassan', 'hussaini', 'idris',
    'bashir', 'mustapha', 'lawal', 'isa', 'salisu', 'aminu', 'nasiru', 'shehu', 'baba',
    'abdul', 'auwal', 'yakubu', 'jibrin', 'adam', 'adams', 'audu', 'garba', 'haruna',
    'suleiman', 'yahaya', 'dauda', 'ismail', 'ismaila', 'shuaibu', 'tahir', 'tanko',
    'balarabe', 'danjuma', 'sunday', 'emmanuel', 'david', 'john', 'peter', 'paul', 'james',
    'michael', 'samuel', 'solomon', 'moses', 'daniel', 'joseph', 'simon', 'matthew',
    'joshua', 'caleb', 'andrew', 'philip', 'stephen', 'isaac', 'gabriel', 'anthony',
    'victor', 'kenneth', 'kingsley', 'godwin', 'patrick', 'francis', 'benjamin', 'nathaniel',
    'christopher', 'augustine', 'monday', 'friday', 'thankgod', 'godfrey', 'festus',
    'tunde', 'segun', 'kunle', 'wale', 'chinedu', 'chima', 'emeka', 'ifeanyi', 'chukwudi',
    'chiroma', 'bulama', 'modu', 'kyari', 'bukar', 'vana', 'zanna', 'maina', 'sheriff',
    'bana', 'kaka', 'abana', 'grema', 'fannami', 'shettima', 'bagana'
]);

const COMMON_FEMALE_NAMES = new Set([
    'fatima', 'fatimah', 'amina', 'aminatu', 'zainab', 'aisha', 'maryam', 'khadija', 'hauwa',
    'halima', 'rakiya', 'rabiu', 'hadiza', 'asabe', 'lubabatu', 'nafi', 'nafisa', 'saudatu',
    'sakina', 'sumaiya', 'jamila', 'bilkisu', 'jidera', 'saratu', 'sadiya', 'shafa',
    'zara', 'falmata', 'bintu', 'falti', 'ya', 'yata', 'marka', 'murdjanatu', 'uwani',
    'laraba', 'jummai', 'talatu', 'lami', 'hassana', 'hussaina', 'autun', 'dije',
    'mary', 'sarah', 'elizabeth', 'grace', 'mercy', 'joy', 'blessing', 'peace', 'patience',
    'victoria', 'esther', 'ruth', 'deborah', 'hannah', 'rebecca', 'florence', 'susanna',
    'dorcas', 'martha', 'alice', 'agnes', 'faith', 'charity', 'hope', 'comfort', 'glory',
    'favour', 'precious', 'gift', 'ngozi', 'chioma', 'nneka', 'amaka', 'chinyere', 'funke',
    'kemi', 'jumoke', 'bimbo', 'bisi', 'toysin', 'yemi', 'zara', 'yagana', 'kaltum'
]);

export function predictGender(fullName: string): string {
    if (!fullName) return 'Unknown';

    const normalized = fullName.toLowerCase().trim();
    const parts = normalized.split(/\s+/);

    // 1. Check Titles
    for (const part of parts) {
        const cleanPart = part.replace('.', '');
        if (MALE_TITLES.includes(cleanPart)) return 'Male';
        if (FEMALE_TITLES.includes(cleanPart)) return 'Female';
    }

    // 2. Check Names (Prioritize First Name, then others)
    for (const part of parts) {
        if (COMMON_MALE_NAMES.has(part)) return 'Male';
        if (COMMON_FEMALE_NAMES.has(part)) return 'Female';
    }

    return 'Unknown';
}
