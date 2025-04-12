import React from 'react';

interface PlaceholderZoneProps {
    title: string;
    children: React.ReactNode;
}

const PlaceholderZone = ({ title, children }: PlaceholderZoneProps) => {
    return (
        <div
            style={{
                border: '2px dashed #ccc',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                transition: 'background-color 0.3s',
            }} className='bg-white/20 backdrop-blur-sm shadow-lg rounded-lg p-4 w-full'
        >
            {title}
            <div
                style={{
                    marginTop: '5px',
                    fontSize: '14px',
                    opacity: 0.7,
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PlaceholderZone;
