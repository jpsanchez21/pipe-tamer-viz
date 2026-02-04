export interface PipeSpec {
    id: string;
    type: 'Tubing' | 'Drill Pipe';
    name: string;
    minTorque: number;
    optTorque: number;
    maxTorque: number;
}

export const pipeSpecs: PipeSpec[] = [
    // TUBING
    { id: 't-238-n80', type: 'Tubing', name: 'TUBING 2 3/8 4,7 N-80 EUE', minTorque: 1350, optTorque: 1800, maxTorque: 2250 },
    { id: 't-238-j55', type: 'Tubing', name: 'TUBING 2 3/8 6,4 J-55 EUE', minTorque: 970, optTorque: 1290, maxTorque: 1610 },
    { id: 't-278-64-j55', type: 'Tubing', name: 'TUBING 2 7/8 6,4 J-55 EUE', minTorque: 850, optTorque: 1300, maxTorque: 1750 },
    { id: 't-278-65-n80', type: 'Tubing', name: 'TUBING 2 7/8 6,5 N-80 EUE', minTorque: 1730, optTorque: 2300, maxTorque: 2880 },
    { id: 't-278-65-l80', type: 'Tubing', name: 'TUBING 2 7/8 6,5 L-80 EUE', minTorque: 1690, optTorque: 2250, maxTorque: 2810 },
    { id: 't-278-65-j55', type: 'Tubing', name: 'TUBING 2 7/8 6,5 J-55 EUE', minTorque: 1240, optTorque: 1650, maxTorque: 2060 },
    { id: 't-278-104-s135', type: 'Tubing', name: 'TUBING 2 7/8 10,4 S135 NC31', minTorque: 6600, optTorque: 8034, maxTorque: 9085 },
    { id: 't-312-l80', type: 'Tubing', name: 'TUBING 3 1/2 9,3 L-80 EUE', minTorque: 2400, optTorque: 3200, maxTorque: 4000 },
    { id: 't-312-n80', type: 'Tubing', name: 'TUBING 3 1/2 9,3 N-80 EUE', minTorque: 2400, optTorque: 3200, maxTorque: 4000 },
    { id: 't-312-p110', type: 'Tubing', name: 'TUBING 3 1/2 9,3 P110 EUE', minTorque: 3170, optTorque: 4230, maxTorque: 5290 },
    { id: 't-312-sd70', type: 'Tubing', name: 'TUBING 3 1/2 9,3 SD70CS SEC', minTorque: 2930, optTorque: 3220, maxTorque: 3540 },
    { id: 't-312-j55', type: 'Tubing', name: 'TUBING 3 1/2 9,3 J-55 EUE', minTorque: 1710, optTorque: 2280, maxTorque: 2850 },
    { id: 't-312-881-l80', type: 'Tubing', name: 'TUBING 3 1/2 8,81 L-80 EUE', minTorque: 2350, optTorque: 3130, maxTorque: 3910 },
    { id: 't-412-n80', type: 'Tubing', name: 'TUBING 4 1/2 12,75 N-80 EUE', minTorque: 3020, optTorque: 4020, maxTorque: 5030 },
    { id: 't-412-p110', type: 'Tubing', name: 'TUBING 4 1/2 12,75 P110 EUE', minTorque: 4010, optTorque: 5340, maxTorque: 6680 },
    { id: 't-412-sd70', type: 'Tubing', name: 'TUBING 4 1/2 12,75 SD70CS SEC', minTorque: 4300, optTorque: 4730, maxTorque: 5200 },
    { id: 't-412-wedge', type: 'Tubing', name: 'TUBING 4 1/2 11,6 N-80 WEDGE 513', minTorque: 2800, optTorque: 3400, maxTorque: 4900 },
    { id: 't-512-sd70', type: 'Tubing', name: 'TUBING 5 1/2 17 SD70CS SEC', minTorque: 4950, optTorque: 5450, maxTorque: 6000 },
    { id: 't-512-j55', type: 'Tubing', name: 'TUBING 5 1/2 15,5 J-55 LTC', minTorque: 1627, optTorque: 2170, maxTorque: 2712 },
    { id: 't-512-n80', type: 'Tubing', name: 'TUBING 5 1/2 17 N-80 BTC', minTorque: 4125, optTorque: 5500, maxTorque: 6875 },

    // DRILL PIPE
    { id: 'dp-238-s135', type: 'Drill Pipe', name: 'DRILL PIPE 2 3/8 6,65 S135 NC26', minTorque: 3900, optTorque: 4100, maxTorque: 4300 },
    { id: 'dp-278-htpac', type: 'Drill Pipe', name: 'DRILL PIPE 2 7/8 HTPAC 11,08', minTorque: 4300, optTorque: 4700, maxTorque: 5100 },
    { id: 'dp-312-g105', type: 'Drill Pipe', name: 'DRILL PIPE 3 1/2 13, G105 NC38', minTorque: 10000, optTorque: 11100, maxTorque: 13000 },
    { id: 'dp-312-s135', type: 'Drill Pipe', name: 'DRILL PIPE 3 1/2 13, S135 NC38', minTorque: 10000, optTorque: 11100, maxTorque: 12100 },
    { id: 'dp-312-ht38-wtfd', type: 'Drill Pipe', name: 'DRILL PIPE 3 1/2 HT38 13,3 WTFD', minTorque: 12500, optTorque: 13500, maxTorque: 14500 },
    { id: 'dp-312-ht38-std', type: 'Drill Pipe', name: 'DRILL PIPE 3 1/2 HT38 13,3 STD', minTorque: 14700, optTorque: 16150, maxTorque: 17600 },
];
