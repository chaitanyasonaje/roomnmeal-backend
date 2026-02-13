import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Check if firebase is already initialized
if (!admin.apps.length) {
    try {
        // Option 1: Load from Service Account File Path
        if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

            // Check if file exists
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccount = require(serviceAccountPath);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log('🔥 Firebase Admin Initialized (File)');
            } else {
                console.warn(`⚠️ Firebase Service Account file not found at: ${serviceAccountPath}`);
                console.warn('Please download it from Firebase Console -> Project Settings -> Service Accounts and place it in backend/ root.');
            }
        }
        // Option 2: Load from JSON String in Env (Best for deployment)
        else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('🔥 Firebase Admin Initialized (JSON Env)');
        }
        else {
            console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON not set.');
        }

    } catch (error) {
        console.error('❌ Firebase Admin Initialization Error:', error);
    }
}

export default admin;
