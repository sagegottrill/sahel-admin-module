import { useState, useEffect } from 'react';

interface CountdownProps {
    targetDate: string;
    title?: string;
}

export default function Countdown({ targetDate, title = "Application Deadline" }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }

        return timeLeft;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    const timerComponents: JSX.Element[] = [];

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval as keyof typeof timeLeft] && timeLeft[interval as keyof typeof timeLeft] !== 0) {
            return;
        }

        timerComponents.push(
            <div key={interval} className="flex flex-col items-center mx-2 md:mx-4">
                <span className="text-3xl md:text-5xl font-bold text-white drop-shadow-md">
                    {String(timeLeft[interval as keyof typeof timeLeft]).padStart(2, '0')}
                </span>
                <span className="text-xs md:text-sm uppercase text-gray-200 mt-1">{interval}</span>
            </div>
        );
    });

    return (
        <div className="flex flex-col items-center animate-fade-in-up">
            {title && <h3 className="text-white text-lg md:text-xl font-medium mb-4 drop-shadow-md uppercase tracking-widest">{title}</h3>}
            <div className="flex justify-center items-center bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 shadow-xl">
                {timerComponents.length ? timerComponents : <span className="text-2xl text-white font-bold">Time's up!</span>}
            </div>
        </div>
    );
}
