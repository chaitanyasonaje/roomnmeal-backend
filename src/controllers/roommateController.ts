import { Request, Response } from 'express';
import { RoommateProfile } from '../models/RoommateProfile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Create or Update Profile
export const upsertProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const userId = req.user.id;
        const { college, city, budget, gender, habits, bio, interests, moveInDate, contactHidden } = req.body;

        let profile = await RoommateProfile.findOne({ userId });

        if (profile) {
            // Update existing
            profile.college = college || profile.college;
            profile.city = city || profile.city;
            profile.budget = budget || profile.budget;
            profile.gender = gender || profile.gender;
            profile.habits = { ...profile.habits, ...habits };
            profile.bio = bio || profile.bio;
            profile.interests = interests || profile.interests;
            profile.moveInDate = moveInDate || profile.moveInDate;
            profile.contactHidden = contactHidden !== undefined ? contactHidden : profile.contactHidden;
            await profile.save();
        } else {
            // Create new
            profile = await RoommateProfile.create({
                userId,
                college,
                city,
                budget,
                gender,
                habits,
                bio,
                interests,
                moveInDate,
                contactHidden
            });
        }

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error('Error upserting roommate profile:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get My Profile
export const getMyProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const profile = await RoommateProfile.findOne({ userId: req.user.id }).populate('userId', 'name email profilePicture');
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        res.json({ success: true, data: profile });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get Matches (Potential Roommates)
export const getMatches = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const myProfile = await RoommateProfile.findOne({ userId: req.user.id });

        if (!myProfile) {
            return res.status(400).json({ success: false, message: 'Please create a profile first to see matches.' });
        }

        const { college, budget, gender } = myProfile;

        // Basic matching logic
        // 1. Same college (strict)
        // 2. Budget within +/- 20%
        // 3. Gender compatibility (My gender matches their pref OR 'Any')
        // Exclude self

        const minBudget = budget * 0.8;
        const maxBudget = budget * 1.2;

        const matches = await RoommateProfile.find({
            userId: { $ne: req.user.id }, // Not me
            college: { $regex: new RegExp(college, 'i') }, // Same college (case insensitive)
            budget: { $gte: minBudget, $lte: maxBudget }, // Budget range
            // For MVP, simple gender check: if I'm searching, show me people who are looking for 'Any' or my gender
            // This can be refined.
        })
            .populate('userId', 'name email profilePicture')
            .limit(20);

        res.json({ success: true, count: matches.length, data: matches });

    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
