// @ts-check
// ------------------------------------------------------------------
// config/federation.shared.js
//
// ניהול מרכזי של בלוק ה-shared עבור Module Federation.
// בהמשך יעבור ל-@ips/federation-config — ה-API כאן זהה לחלוטין,
// כך שהמעבר יהיה החלפת נתיב ה-require בלבד.
// ------------------------------------------------------------------

/**
 * @typedef {Object} CatalogueEntry
 * @property {boolean} required
 *   true  → חוסר בחבילה נכשל את ה-build
 *   false → אופציונלית; אם לא מותקנת, פשוט לא תשותף
 * @property {string | false} [requiredVersion]
 *   דריסת הטווח הנדרש. false = ללא בדיקת גרסה.
 *   undefined = נלקח מה-package.json של האפליקציה.
 * @property {boolean} [transitive]
 *   true → חבילה עקיפה שמותר לשתף בלי להצהיר עליה ב-dependencies.
 *   השתמש רק כשחייבים singleton על חבילה שלא מיובאת ישירות.
 */

/**
 * @typedef {Object} SharedConfig
 * @property {boolean} singleton
 * @property {string | false} requiredVersion
 * @property {string} version
 */

/**
 * @typedef {Object} PackageJsonLike
 * @property {string} [name]
 * @property {Record<string, string>} [dependencies]
 * @property {Record<string, string>} [peerDependencies]
 */

/**
 * @typedef {Object} BuildSharedOptions
 * @property {PackageJsonLike} pkg      ה-package.json של האפליקציה הצורכת
 * @property {NodeRequire} require      ה-require של האפליקציה (חובה!)
 * @property {Record<string, SharedConfig>} [overrides]
 */

// ------------------------------------------------------------------
// הקטלוג — החוזה של הפדרציה
// ------------------------------------------------------------------

/** @type {Record<string, CatalogueEntry>} */
const CATALOGUE = {
    // ---- ליבה ----
    react: { required: true },
    "react-dom": { required: true },
    "react-router-dom": { required: true, requiredVersion: "^6.0.0" },

    // ---- MUI ----
    "@mui/material": { required: true },
    "@mui/system": { required: true },
    "@mui/icons-material": { required: false },
    "@mui/x-data-grid": { required: false },
    "@mui/x-date-pickers": { required: false },
    "@emotion/react": { required: true },

    // ---- ספריות פנימיות ----
    //"@ips/digital-utils": { required: false, requiredVersion: false },

    // ---- State ----
    zustand: { required: false, requiredVersion: false },
};

// ------------------------------------------------------------------
// עזרים
// ------------------------------------------------------------------

/**
 * @param {unknown} e
 * @returns {boolean}
 */
function isModuleNotFound(e) {
    const code = /** @type {NodeJS.ErrnoException | null} */ (e)?.code;
    return code === "MODULE_NOT_FOUND" || code === "ERR_MODULE_NOT_FOUND";
}

/**
 * בודק אם חבילה מותקנת ומה גרסתה.
 * מבדיל בין "לא מותקנת" לבין "מותקנת אך שדה exports חוסם קריאת package.json".
 *
 * @param {NodeRequire} consumerRequire
 * @param {string} name
 * @returns {{ installed: boolean, version?: string }}
 */
function probe(consumerRequire, name) {
    try {
        consumerRequire.resolve(name);
    } catch (e) {
        if (isModuleNotFound(e)) return { installed: false };
        throw e;
    }

    try {
        const meta = consumerRequire(`${name}/package.json`);
        return { installed: true, version: meta.version };
    } catch {
        // מותקנת, אך exports חוסם — זה תקין, ניפול חזרה לטווח המוצהר
        return { installed: true };
    }
}

/**
 * @param {string | undefined} spec
 * @returns {string}
 */
function stripRange(spec) {
    return String(spec ?? "").replace(/^[\^~>=<\s]+/, "");
}

// ------------------------------------------------------------------
// הפונקציה הראשית
// ------------------------------------------------------------------

/**
 * בונה את בלוק ה-shared עבור ModuleFederationPlugin,
 * תוך אימות שכל התלויות מוצהרות ומותקנות כראוי.
 *
 * @param {BuildSharedOptions} options
 * @returns {Record<string, SharedConfig>}
 */
function buildShared({ pkg, require: consumerRequire, overrides = {} }) {
    if (!consumerRequire) {
        throw new Error("[federation] חובה להעביר את require של האפליקציה");
    }

    /** @type {Record<string, string>} */
    const deps = { ...pkg.dependencies, ...pkg.peerDependencies };

    /** @type {Record<string, SharedConfig>} */
    const shared = {};
    /** @type {string[]} */
    const problems = [];
    /** @type {string[]} */
    const skipped = [];
    /** @type {string[]} */
    const ghosts = [];

    for (const [name, spec] of Object.entries(CATALOGUE)) {
        const declaredRange = deps[name];
        const declared = Boolean(declaredRange);
        const result = probe(consumerRequire, name);

        // --- מוצהרת אך לא מותקנת ---
        if (declared && !result.installed) {
            problems.push(
                `${name} — מוצהרת ב-package.json אך לא מותקנת. הרץ npm install.`
            );
            continue;
        }

        // --- עקיפה מאושרת: משתפים לפי הגרסה המותקנת, בלי דרישת הצהרה ---
        if (!declared && result.installed && spec.transitive) {
            if (!result.version) {
                problems.push(
                    `${name} — מסומנת transitive אך לא ניתן לקבוע את גרסתה. ` +
                    `ציין version ידנית ב-overrides.`
                );
                continue;
            }
            shared[name] = {
                singleton: true,
                requiredVersion: false,
                version: result.version,
            };
            continue;
        }

        // --- מותקנת אך לא מוצהרת (תלות רפאים) ---
        if (!declared && result.installed) {
            if (spec.required) {
                problems.push(
                    `${name} — מותקנת אך לא מוצהרת ב-dependencies (תלות רפאים). ` +
                    `הוסף אותה ל-package.json.`
                );
            } else {
                ghosts.push(name);
            }
            continue;
        }

        // --- לא מוצהרת ולא מותקנת ---
        if (!declared && !result.installed) {
            if (spec.required) {
                problems.push(`${name} — חובה בפדרציה, וחסרה לגמרי.`);
            } else {
                skipped.push(name);
            }
            continue;
        }

        // --- תקין: מוצהרת ומותקנת ---
        const resolvedVersion = result.version || stripRange(declaredRange);

        if (!resolvedVersion) {
            problems.push(
                `${name} — לא ניתן לקבוע גרסה. ציין version ידנית ב-overrides.`
            );
            continue;
        }

        shared[name] = {
            singleton: true,
            requiredVersion:
                spec.requiredVersion !== undefined ? spec.requiredVersion : declaredRange,
            version: resolvedVersion,
        };
    }

    if (problems.length) {
        throw new Error(
            `[federation] בעיות בתלויות של "${pkg.name ?? "unknown"}":\n  - ` +
            problems.join("\n  - ")
        );
    }

    if (ghosts.length) {
        console.warn(
            `[federation] אזהרה — מותקנות אך לא מוצהרות, ולכן לא ישותפו: ` +
            ghosts.join(", ")
        );
    }

    if (process.env.FEDERATION_DEBUG) {
        console.log(`\n[federation] shared עבור ${pkg.name ?? "unknown"}:`);
        console.table(
            Object.entries(shared).map(([name, c]) => ({
                package: name,
                provides: c.version,
                requires: c.requiredVersion === false ? "(any)" : c.requiredVersion,
            }))
        );
        if (skipped.length) {
            console.log("דולג (לא מותקן):", skipped.join(", "));
        }
        console.log("");
    }

    return { ...shared, ...overrides };
}

module.exports = { buildShared, CATALOGUE };
