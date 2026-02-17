import { Request, Response } from 'express';
import Message from '../models/Message';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../socket';

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

export const getAdminUser = async (req: AuthRequest, res: Response) => {
    try {
        const admin = await User.findOne({ role: 'admin' }).select('name email phone');
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        res.json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch admin details' });
    }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
    try {
        const myId = req.user?._id;
        if (!myId) return res.status(401).json({ success: false, message: 'Not authenticated' });

        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: myId },
                        { receiver: myId }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', myId] },
                            '$receiver',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$receiver', myId] },
                                        { $eq: ['$read', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'otherUser'
                }
            },
            {
                $unwind: '$otherUser'
            },
            {
                $project: {
                    _id: 0,
                    user: {
                        _id: '$otherUser._id',
                        name: '$otherUser.name',
                        email: '$otherUser.email',
                        role: '$otherUser.role'
                    },
                    lastMessage: 1,
                    unreadCount: 1
                }
            },
            {
                $sort: { 'lastMessage.createdAt': -1 }
            }
        ]);

        res.json({ success: true, data: conversations });
    } catch (error) {
        console.error('getConversations error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
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

        // EMIT SOCKET EVENT
        try {
            const io = getIO();
            io.to(receiverId).emit('new_message', newMessage);
            io.to(myId?.toString() || '').emit('new_message', newMessage); // Also emit to self for multi-device sync
        } catch (err) {
            console.error('Socket emit failed:', err);
        }

        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { senderId } = req.body;
        const myId = req.user?._id;

        await Message.updateMany(
            { sender: senderId, receiver: myId, read: false },
            { $set: { read: true } }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark messages as read' });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        const lowerMsg = message.toLowerCase();

        let botResponse = "I'm not sure about that. Try asking about:\n• Today's Menu\n• Laundry timings\n• WiFi password\n• Cleaning services\n• Important contacts\n• Hostel rules";

        // Rule-based logic (Mock AI)
        if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
            botResponse = "Hello! 👋 I'm your Hostel Assistant. How can I help you today?";
        }
        else if (lowerMsg.includes('menu') || lowerMsg.includes('food') || lowerMsg.includes('breakfast') || lowerMsg.includes('lunch') || lowerMsg.includes('dinner')) {
            botResponse = "🍽️ **Today's Menu**:\n\n🍳 **Breakfast (8:00 - 10:00 AM)**:\n• Aloo Paratha with Curd\n• Tea/Coffee\n\n🍛 **Lunch (12:30 - 2:30 PM)**:\n• Rice, Dal Fry\n• Paneer Butter Masala\n• Chapati, Salad\n\nben🍱 **Dinner (8:00 - 10:00 PM)**:\n• Mix Veg Curry\n• Chapati\n• Jeera Rice\n• Gulab Jamun";
        }
        else if (lowerMsg.includes('laundry') || lowerMsg.includes('cloth') || lowerMsg.includes('washing')) {
            botResponse = "🧺 **Laundry Service**\n\n• **Timings**: 8:00 AM - 6:00 PM (Daily)\n• **Process**: Drop your clothes in the laundry bag with your room number tag.\n• **Turnaround**: 24 hours.\n\nYou can book a specialized laundry slot in the **Services** tab.";
        }
        else if (lowerMsg.includes('clean') || lowerMsg.includes('housekeeping') || lowerMsg.includes('dusting')) {
            botResponse = "🧹 **Housekeeping Service**\n\n• **Daily Cleaning**: 10:00 AM - 4:00 PM\n• **Deep Cleaning**: Available on Sundays (Request required)\n\nPlease raise a request in the **Services** tab if your room needs immediate attention.";
        }
        else if (lowerMsg.includes('contact') || lowerMsg.includes('help') || lowerMsg.includes('emergency') || lowerMsg.includes('number')) {
            botResponse = "📞 **Important Contacts**\n\n👮 **Warden**: +91 98765 43210\n🛡️ **Security Gate**: +91 91234 56789\n🚑 **Ambulance**: 108\n👨‍💼 **Manager**: +91 99887 76655\n\nFor emergencies, please contact the Warden immediately.";
        }
        else if (lowerMsg.includes('wifi') || lowerMsg.includes('internet') || lowerMsg.includes('net')) {
            botResponse = "📶 **WiFi Details**\n\n• **Network**: RoomNMeal_Student\n• **Password**: 'StudentHostel@2024'\n• **Speed**: Up to 100 Mbps\n\nIf you face connectivity issues, try turning your WiFi off and on, or raise a complaint.";
        }
        else if (lowerMsg.includes('gate') || lowerMsg.includes('curfew') || lowerMsg.includes('timing') || lowerMsg.includes('late')) {
            botResponse = "🕒 **Hostel Timings**\n\n• **Main Gate Closes**: 10:00 PM\n• **Main Gate Opens**: 6:00 AM\n\nLate entry requires prior written permission from the Warden. Unauthorized late entry may attract a fine.";
        }
        else if (lowerMsg.includes('complaint') || lowerMsg.includes('issue') || lowerMsg.includes('repair') || lowerMsg.includes('broken')) {
            botResponse = "🛠️ **Complaints & Repairs**\n\nYou can report issues directly in the app:\n1. Go to **Profile**\n2. Tap on **Complaints**\n3. Click **Raise New Complaint**\n\nWe typically resolve maintenance issues within 24 hours.";
        }
        else if (lowerMsg.includes('gym') || lowerMsg.includes('workout') || lowerMsg.includes('fitness')) {
            botResponse = "💪 **Gym Facility**\n\n• **Location**: Ground Floor, Block B\n• **Morning**: 6:00 AM - 9:00 AM\n• **Evening**: 5:00 PM - 9:00 PM\n• **Rules**: Please carry clean shoes and a towel.";
        }
        else if (lowerMsg.includes('guest') || lowerMsg.includes('visitor') || lowerMsg.includes('friend')) {
            botResponse = "👥 **Guest Policy**\n\n• Guests are allowed in the **Visitor's Lounge** only.\n• **Visiting Hours**: 4:00 PM - 8:00 PM\n• No overnight stay allowed for guests without prior management approval.";
        }
        else if (lowerMsg.includes('fee') || lowerMsg.includes('rent') || lowerMsg.includes('payment') || lowerMsg.includes('dues')) {
            botResponse = "💰 **Fee Payment**\n\n• Rent is due by the **5th of every month**.\n• You can pay via the **Home Screen** > **Pay Dues** card.\n• Late fee of ₹500 applies after the 10th.";
        }

        // Simulate network delay for realism
        setTimeout(() => {
            res.json({ success: true, reply: botResponse });
        }, 800);

    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
