import React from 'react';
import { createAvatar } from '@dicebear/core';
import { openPeeps } from '@dicebear/collection';

type Mood = 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral';

const ProfilePicture = ({ mood, flipped }: { mood: Mood, flipped?: boolean }) => {
    // Instead of trying to modify the face, use different seeds for different expressions
    // while keeping part of the seed consistent to maintain similar appearance
    const getMoodSeed = (mood: Mood): string => {
        // Base seed to keep some character consistency
        const baseSeed = 'user';

        // Add mood to the seed
        return `${baseSeed}-${mood}`;
    };

    // Create avatar with mood-specific seed
    const seed = getMoodSeed(mood);
    const avatar = createAvatar(openPeeps, { seed });

    // Log what we're doing for debugging
    console.log(`Creating avatar with mood: ${mood}, seed: ${seed}`);

    return (
        <div style={{ transform: flipped ? 'scaleX(-1)' : undefined }}>
            <div
                dangerouslySetInnerHTML={{ __html: avatar.toString() }}
                style={{ width: 100, height: 100 }}
            />
        </div>
    );
};

export default ProfilePicture;
