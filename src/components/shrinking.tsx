'use client'

import { useEffect, useRef, useState } from 'react'

export default function ShrinkDiv({ children }: { children: React.ReactNode }) {
    const contentRef = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState<number | 'auto'>(0)

    useEffect(() => {
        // if no children, set height to 0
        if (!children) {
            setHeight(0)
            return
        } else {
            // calculate height of content
            const contentHeight = contentRef.current?.style.height
                ? parseInt(contentRef.current.style.height)
                : contentRef.current?.scrollHeight
            if (contentHeight) {
                setHeight(contentHeight)
            }
        }
    }, [children])

    return (
        <div
            style={{
                height: height === 'auto' ? 'auto' : `${height}px`,
                overflow: 'hidden',
                transition: 'height 300ms ease',
            }}
        >
            <div ref={contentRef}>
                {children}
            </div>
        </div>
    )
}
