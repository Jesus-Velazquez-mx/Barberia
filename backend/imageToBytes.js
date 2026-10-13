import fs from 'node:fs/promises';

async function nodeImageToBytes(filePath) {
    try {
        // Login
        const credentials = {
            email: 'rei.ayanami@nerv-barbershop.test',
            password: 'password',
        };
        const authResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });
        const body = await authResponse.json();
        const token = body.data.token;

        // Get the presigned post URL
        const presignedURL = await fetch('http://localhost:3000/api/presigned-url', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const { url, fields, key } = (await presignedURL.json()).data;

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
    } catch (error) {
        console.error('Error:', error);
    }
}

const imagePath = 'C:/Users/erick/Pictures/Camera Roll/WIN_20261012_19_43_04_Pro.jpg';
await nodeImageToBytes(imagePath);
