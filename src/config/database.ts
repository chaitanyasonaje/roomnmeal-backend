import mongoose from 'mongoose';
import dns from 'dns';

// Force custom DNS to resolve SRV lookup failures
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
    console.log('Could not set custom DNS servers');
}

export const connectDatabase = async (): Promise<void> => {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error('❌ MONGODB_URI is not defined in .env');
        process.exit(1);
    }

    await mongoose.connect(mongoUri, {
        family: 4
    })
        .then(() => console.log("✅ MongoDB Connected"))
        .catch(err => {
            console.error("❌ MongoDB Connection Error:", err);
            // Do not exit process immediately in dev, might be transient
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        });
};

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB Error:', err);
});
