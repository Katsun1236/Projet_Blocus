export default [
    {
        ignores: ["node_modules/", "dist/", "build/"]
    },
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                localStorage: "readonly",
                sessionStorage: "readonly",
                fetch: "readonly",
                URL: "readonly",
                Blob: "readonly",
                FormData: "readonly",
                Event: "readonly",
                CustomEvent: "readonly",
                navigator: "readonly",
                supabase: "readonly",
                crypto: "readonly",
                Math: "readonly",
                Date: "readonly",
                Promise: "readonly",
                HTMLElement: "readonly",
                IntersectionObserver: "readonly",
                performance: "readonly",
                confirm: "readonly",
                alert: "readonly",
                Notification: "readonly",
                getComputedStyle: "readonly",
                FullCalendar: "readonly",
                Audio: "readonly",
                Chart: "readonly",
                Timestamp: "readonly",
                DOMPurify: "readonly",
                requestAnimationFrame: "readonly",
                history: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error"
        }
    }
];