import fs from 'node:fs/promises';

const credentials = {
    email: 'gerardway@email.com',
    password: 'password',
};

async function getTokenFromLogin({ email, password }) {
    // Login

    const authResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    const body = await authResponse.json();
    return body.data.token;
}

async function getPresignedURL(token) {
    // Get the presigned post URL
    const presignedURL = await fetch('http://localhost:3000/api/presigned-url', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return (await presignedURL.json()).data;
}

async function uploadFileToBucket(filePath) {
    try {
        const token = await getTokenFromLogin(credentials);
        const { url, fields } = await getPresignedURL(token);

        // Upload the file
        const buffer = await fs.readFile(filePath);

        const formData = new FormData();
        Object.entries(fields).forEach(([name, value]) => {
            formData.append(name, value);
        });
        formData.append('Content-Type', 'image/jpeg');
        formData.append('file', new Blob([buffer], { type: 'image/jpeg' }), 'image.jpg');

        const upload = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!upload.ok) {
            throw new Error(await upload.text());
        }

        console.log('Image uploaded successfully to bucket.');
    } catch (error) {
        console.error('Error:', error);
    }
}

const imagePath = 'C:/Users/erick/Pictures/Camera Roll/test_cara.jpg';
await uploadFileToBucket(imagePath);
