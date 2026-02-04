import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Brush } from 'recharts';
import { SensorDataPoint, PipeTrip } from '@/types/trip';
import { formatTime } from '@/utils/mockData';

interface TimeRangeBrushProps {
    data: SensorDataPoint[];
    startDate: Date;
    endDate: Date;
    onRangeChange: (start: Date, end: Date) => void;
    trips: PipeTrip[];
}

const TimeRangeBrush = ({
    data,
    startDate,
    endDate,
    onRangeChange,
    trips,
}: TimeRangeBrushProps) => {
    // Prepare chart data for the overview
    const chartData = useMemo(() => {
        return data.map((point) => ({
            time: formatTime(point.timestamp),
            timestamp: point.timestamp.getTime(),
            hookload: point.hookload,
        }));
    }, [data]);

    // Handle brush change
    const handleBrushChange = (brushData: any) => {
        if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
            const startIndex = brushData.startIndex;
            const endIndex = brushData.endIndex;

            if (startIndex < data.length && endIndex < data.length) {
                const newStart = data[startIndex].timestamp;
                const newEnd = data[endIndex].timestamp;
                onRangeChange(newStart, newEnd);
            }
        }
    };

    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={100}>
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 10, left: 40, bottom: 5 }}
                >
                    <XAxis
                        dataKey="time"
                        stroke="hsl(215 20% 55%)"
                        tick={{ fill: 'hsl(215 20% 55%)', fontSize: 9 }}
                        tickLine={{ stroke: 'hsl(222 30% 18%)' }}
                        height={20}
                    />
                    <YAxis
                        stroke="hsl(215 20% 55%)"
                        tick={{ fill: 'hsl(215 20% 55%)', fontSize: 9 }}
                        tickLine={{ stroke: 'hsl(222 30% 18%)' }}
                        width={40}
                        domain={['auto', 'auto']}
                    />
                    <Line
                        type="monotone"
                        dataKey="hookload"
                        stroke="hsl(195 100% 42%)"
                        strokeWidth={1}
                        dot={false}
                        isAnimationActive={false}
                    />
                    <Brush
                        dataKey="time"
                        height={30}
                        stroke="hsl(195 100% 42%)"
                        fill="hsl(222 47% 10%)"
                        onChange={handleBrushChange}
                        travellerWidth={10}
                        className="brush-selector"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TimeRangeBrush;
