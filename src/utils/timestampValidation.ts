/**
 * Timestamp Validation Utilities
 * Ensures consistency between trips, connections, and telemetry data
 */

import { PipeTrip, SensorDataPoint } from '@/types/trip';

export interface ValidationIssue {
    severity: 'error' | 'warning' | 'info';
    type: string;
    message: string;
    affectedItem?: string;
    timestamp?: Date;
}

export interface ValidationReport {
    isValid: boolean;
    issues: ValidationIssue[];
    summary: {
        totalTrips: number;
        totalConnections: number;
        telemetryPoints: number;
        timeRange: {
            start: Date;
            end: Date;
        };
        timezone: string;
    };
}

/**
 * Validates that all timestamps are consistent and make sense
 */
export function validateTimestamps(
    trips: PipeTrip[],
    sensorData: SensorDataPoint[]
): ValidationReport {
    const issues: ValidationIssue[] = [];

    // 1. Validate telemetry data range
    if (sensorData.length === 0) {
        issues.push({
            severity: 'error',
            type: 'NO_TELEMETRY',
            message: 'No telemetry data available'
        });
        return createReport(issues, trips, sensorData);
    }

    const telemetryStart = sensorData[0].timestamp;
    const telemetryEnd = sensorData[sensorData.length - 1].timestamp;

    // 2. Check if telemetry is in chronological order
    for (let i = 1; i < sensorData.length; i++) {
        if (sensorData[i].timestamp < sensorData[i - 1].timestamp) {
            issues.push({
                severity: 'error',
                type: 'TELEMETRY_ORDER',
                message: `Telemetry data out of order at index ${i}`,
                timestamp: sensorData[i].timestamp
            });
            break; // Only report first occurrence
        }
    }

    // 3. Validate each trip
    trips.forEach((trip, index) => {
        // 3.1 Check trip times are valid dates
        if (!(trip.startTime instanceof Date) || isNaN(trip.startTime.getTime())) {
            issues.push({
                severity: 'error',
                type: 'INVALID_DATE',
                message: `Trip ${trip.name || trip.id} has invalid startTime`,
                affectedItem: trip.id
            });
        }

        if (!(trip.endTime instanceof Date) || isNaN(trip.endTime.getTime())) {
            issues.push({
                severity: 'error',
                type: 'INVALID_DATE',
                message: `Trip ${trip.name || trip.id} has invalid endTime`,
                affectedItem: trip.id
            });
        }

        // 3.2 Check trip end is after start
        if (trip.endTime <= trip.startTime) {
            issues.push({
                severity: 'error',
                type: 'INVALID_RANGE',
                message: `Trip ${trip.name || trip.id} ends before or at start time`,
                affectedItem: trip.id,
                timestamp: trip.startTime
            });
        }

        // 3.3 Check trip is within telemetry range
        if (trip.startTime < telemetryStart || trip.endTime > telemetryEnd) {
            issues.push({
                severity: 'warning',
                type: 'OUT_OF_TELEMETRY_RANGE',
                message: `Trip ${trip.name || trip.id} extends beyond telemetry data range`,
                affectedItem: trip.id,
                timestamp: trip.startTime
            });
        }

        // 3.4 Validate connections within this trip
        if (trip.connections && trip.connections.length > 0) {
            trip.connections.forEach((conn, connIndex) => {
                // Connection times are valid
                if (!(conn.startTime instanceof Date) || isNaN(conn.startTime.getTime())) {
                    issues.push({
                        severity: 'error',
                        type: 'INVALID_CONNECTION_DATE',
                        message: `Connection ${conn.id} in trip ${trip.name} has invalid startTime`,
                        affectedItem: conn.id
                    });
                }

                if (!(conn.endTime instanceof Date) || isNaN(conn.endTime.getTime())) {
                    issues.push({
                        severity: 'error',
                        type: 'INVALID_CONNECTION_DATE',
                        message: `Connection ${conn.id} in trip ${trip.name} has invalid endTime`,
                        affectedItem: conn.id
                    });
                }

                // Connection end is after start
                if (conn.endTime <= conn.startTime) {
                    issues.push({
                        severity: 'error',
                        type: 'INVALID_CONNECTION_RANGE',
                        message: `Connection ${conn.id} in trip ${trip.name} ends before or at start`,
                        affectedItem: conn.id
                    });
                }

                // Connection is within trip bounds
                if (conn.startTime < trip.startTime || conn.endTime > trip.endTime) {
                    issues.push({
                        severity: 'warning',
                        type: 'CONNECTION_OUT_OF_TRIP',
                        message: `Connection ${conn.id} extends beyond trip ${trip.name} boundaries`,
                        affectedItem: conn.id,
                        timestamp: conn.startTime
                    });
                }

                // Connections don't overlap (within same trip)
                if (connIndex > 0) {
                    const prevConn = trip.connections![connIndex - 1];
                    if (conn.startTime < prevConn.endTime) {
                        issues.push({
                            severity: 'warning',
                            type: 'CONNECTION_OVERLAP',
                            message: `Connection ${conn.id} overlaps with previous connection in trip ${trip.name}`,
                            affectedItem: conn.id,
                            timestamp: conn.startTime
                        });
                    }
                }
            });
        }

        // 3.5 Check for trips that overlap with each other
        if (index > 0) {
            const prevTrip = trips[index - 1];
            if (trip.startTime < prevTrip.endTime) {
                issues.push({
                    severity: 'warning',
                    type: 'TRIP_OVERLAP',
                    message: `Trip ${trip.name || trip.id} overlaps with previous trip ${prevTrip.name || prevTrip.id}`,
                    affectedItem: trip.id,
                    timestamp: trip.startTime
                });
            }
        }
    });

    // 4. Check timezone consistency
    const sampleDate = telemetryStart;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = sampleDate.getTimezoneOffset();

    if (offset !== 0) {
        issues.push({
            severity: 'info',
            type: 'TIMEZONE_INFO',
            message: `Using timezone: ${timezone} (UTC offset: ${offset / 60} hours)`
        });
    }

    return createReport(issues, trips, sensorData);
}

function createReport(
    issues: ValidationIssue[],
    trips: PipeTrip[],
    sensorData: SensorDataPoint[]
): ValidationReport {
    const hasErrors = issues.some(issue => issue.severity === 'error');

    const totalConnections = trips.reduce(
        (sum, trip) => sum + (trip.connections?.length || 0),
        0
    );

    const telemetryStart = sensorData.length > 0 ? sensorData[0].timestamp : new Date();
    const telemetryEnd = sensorData.length > 0
        ? sensorData[sensorData.length - 1].timestamp
        : new Date();

    return {
        isValid: !hasErrors,
        issues,
        summary: {
            totalTrips: trips.length,
            totalConnections,
            telemetryPoints: sensorData.length,
            timeRange: {
                start: telemetryStart,
                end: telemetryEnd
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
    };
}

/**
 * Formats a validation report for display
 */
export function formatValidationReport(report: ValidationReport): string {
    let output = '=== TIMESTAMP VALIDATION REPORT ===\n\n';

    output += `Status: ${report.isValid ? '✅ VALID' : '❌ INVALID'}\n`;
    output += `Timezone: ${report.summary.timezone}\n`;
    output += `Time Range: ${report.summary.timeRange.start.toISOString()} → ${report.summary.timeRange.end.toISOString()}\n`;
    output += `Trips: ${report.summary.totalTrips}\n`;
    output += `Connections: ${report.summary.totalConnections}\n`;
    output += `Telemetry Points: ${report.summary.telemetryPoints}\n\n`;

    if (report.issues.length === 0) {
        output += '✅ No issues found!\n';
    } else {
        const errors = report.issues.filter(i => i.severity === 'error');
        const warnings = report.issues.filter(i => i.severity === 'warning');
        const info = report.issues.filter(i => i.severity === 'info');

        if (errors.length > 0) {
            output += `🔴 ERRORS (${errors.length}):\n`;
            errors.forEach(issue => {
                output += `  - ${issue.message}\n`;
                if (issue.timestamp) {
                    output += `    Time: ${issue.timestamp.toISOString()}\n`;
                }
            });
            output += '\n';
        }

        if (warnings.length > 0) {
            output += `⚠️ WARNINGS (${warnings.length}):\n`;
            warnings.forEach(issue => {
                output += `  - ${issue.message}\n`;
            });
            output += '\n';
        }

        if (info.length > 0) {
            output += `ℹ️ INFO (${info.length}):\n`;
            info.forEach(issue => {
                output += `  - ${issue.message}\n`;
            });
        }
    }

    return output;
}
