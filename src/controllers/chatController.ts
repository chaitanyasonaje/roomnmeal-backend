import { Request, Response } from 'express';
import Message from '../models/Message';
import { AuthRequest } from '../middleware/auth';

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const myId = req.user?._id;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: userId },
                { sender: userId, receiver: myId }
            ]
        }).sort({ createdAt: 1 });

        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
};

export const saveMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { receiverId, text } = req.body;
        const myId = req.user?._id;

        const newMessage = await Message.create({
            sender: myId,
            receiver: receiverId,
            text,
        });

        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        const lowerMsg = message.toLowerCase();

        let botResponse = "I'm not sure about that. Try asking about the menu, laundry, or contacts.";

        // Rule-based logic (Mock AI)
        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            botResponse = "Hello! How can I assist you today?";
        } else if (lowerMsg.includes('menu') || lowerMsg.includes('food')) {
            botResponse = "Today's Menu:\nBreakfast: Aloo Paratha\nLunch: Rice, Dal, Paneer\nDinner: Chapati, Mix Veg";
        } else if (lowerMsg.includes('laundry') || lowerMsg.includes('cloth')) {
            botResponse = "Laundry service is available from 8 AM to 6 PM. You can book a slot in the Services tab.";
        } else if (lowerMsg.includes('clean') || lowerMsg.includes('housekeeping')) {
            botResponse = "Housekeeping is available daily. Please book a request if you need your room cleaned.";
        } else if (lowerMsg.includes('contact') || lowerMsg.includes('help')) {
            botResponse = "Warden: +91 9876543210\nSecurity: +91 9123456789\nAmbulance: 108";
        } else if (lowerMsg.includes('wifi') || lowerMsg.includes('internet')) {
            botResponse = "WiFi Password: 'StudentHostel@2024'. If it's slow, try restarting your device or raising a complaint.";
        } else if (lowerMsg.includes('gate') || lowerMsg.includes('curfew')) {
            botResponse = "The hostel gate closes at 10:00 PM. Late entry requires prior permission from the warden.";
        } else if (lowerMsg.includes('complaint') || lowerMsg.includes('issue')) {
            botResponse = "You can raise a complaint in the Profile > Complaints section. We usually resolve issues within 24 hours.";
        } else if (lowerMsg.includes('gym')) {
            botResponse = "The Gym is located on the ground floor. Open from 6 AM to 9 AM and 5 PM to 9 PM.";
        }

        // Simulate network delay for realism
        setTimeout(() => {
            res.json({ success: true, reply: botResponse });
        }, 1000);

    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
