interface Config {
    apiUrl: string;
}

function validateConfig(): Config {
    // For server-side, use process.env
    const apiUrl = process.env.VITE_API_URL ?? 'http://admin.hotelreviewsystem.com';

    return {
        apiUrl,
    };
}

// Export the config object
const config = validateConfig();
export { config };
