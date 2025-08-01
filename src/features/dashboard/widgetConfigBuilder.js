/**
 * @module WidgetConfigBuilder
 * @description A factory module for creating dashboard widget configurations.
 * This separates the complex widget configuration logic from the DashboardView component.
 */

import { buildHrvReportPages } from '../Analysis/Reports/modules/hrvReportBuilder.js';
import { createMemberManagementWidget } from './widgets/memberManagementWidget.js';
import { createEmployeeManagementWidget } from './widgets/employeeManagementWidget.js';
import { createFinancialManagementWidget } from './widgets/financialManagementWidget.js';
import { createScheduleManagementWidget } from './widgets/scheduleManagementWidget.js';

export function buildWidgetConfig(data, context) {
    // Destructure with defaults to ensure resilience against missing data
    const {
        t,
        members = [],
        activeMembers = 0,
        employees = [],
        sessionsToday = 0,
        gymOccupancy = { percentage: 0, roomDetails: [] },
        avgTrainerRating = 'N/A',
        trainerRatingDetails = [],
        financialSummary = { totalRevenue: 0, totalExpenses: 0, netProfit: 0 },
        workoutLogs = [],
        memberGrowth = { labels: [], data: [] },
        classPopularity = [],
        invoices = [],
        expenses = [],
        expenseCategories = [],
        schemas = [] // Ensure schemas is destructured for recent-activity
    } = data;

    // These are not currently used but are kept for future reference or if other widgets need them.
    // const { pausedMembers, expiredMembers, netMemberGrowth, products, subscriptions, growthChartData, ageCategories } = data;

    const { memberManagementState, employeeManagementState, bluetoothState,  hrvAnalysisResult } = context;

    // --- Calculate Revenue Today ---
    const todayStr = new Date().toISOString().split('T')[0];
    const revenueToday = (invoices || [])
        .filter(inv => inv.status === 'Paid' && inv.date === todayStr)
        .reduce((sum, inv) => sum + inv.amount, 0);

    const chartColors = ['#60a5fa', '#f87171', '#4ade80', '#facc15', '#a78bfa', '#fb923c', '#34d399', '#fb7185'];

    return [
        {
            id: 'quick-stats',
            title: t('quickStats', 'Quick Stats'),
            icon: '📊',
            colSpan: 2,
            rowSpan: 1,
            normalContent: `
                <div class="kpi-group horizontal">
                    <div class="kpi-item">
                        <p class="kpi-label">${t('activeMembers', 'Active Members')}</p>
                        <p class="kpi-value">${activeMembers}</p>
                    </div>
                    <div class="kpi-item">
                        <p class="kpi-label">${t('revenueToday', 'Revenue Today')}</p>
                        <p class="kpi-value">€ ${revenueToday.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
            `,
            // No expanded content for this simple widget
        },
        // --- Large Management Widgets ---
        createMemberManagementWidget({ t, members }, context),
        createEmployeeManagementWidget({ t, employees }, context),
        createFinancialManagementWidget({ t, financialSummary, invoices, expenses, expenseCategories }, context),
        createScheduleManagementWidget({ t, sessionsToday, workoutLogs, members, schemas }, context),
        {
            id: 'sessions-today',
            title: t('sessionsToday', 'Sessions Today'),
            icon: '🗓️',
            colSpan: 1,
            rowSpan: 2, // For expanded view
            normalContent: `<p class="text-5xl font-bold">${data.sessionsToday}</p>`,
            getExpandedContent: (expandedData, t) => {
                const { members, schemas, sessionsTodayDetailsLogs } = expandedData;
                const sessionsBySchema = sessionsTodayDetailsLogs.reduce((acc, log) => {
                    const schema = schemas.find(s => s.id === log.schemaId);
                    const name = schema ? schema.name : 'Custom Workout';
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                }, {});

                const html = `
                    <div style="height: 150px; margin-bottom: 1rem;"><canvas id="sessions-today-chart"></canvas></div>
                    <table class="activity-table">
                        <thead><tr><th>Member</th><th>Workout</th><th>Duration</th></tr></thead>
                        <tbody>
                            ${(sessionsTodayDetailsLogs || []).map(log => {
                                const member = members.find(m => m.id === log.userId);
                                const schema = schemas.find(s => s.id === log.schemaId);
                                return `<tr>
                                    <td>${member ? member.name : 'Unknown'}</td>
                                    <td>${schema ? schema.name : 'Custom Workout'}</td>
                                    <td>${log.duration} min</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                    ${(sessionsTodayDetailsLogs || []).length === 0 ? '<p class="note">No sessions logged today.</p>' : ''}
                `;

                const chart = {
                    id: 'sessions-today-chart',
                    config: {
                        type: 'bar',
                        data: {
                            labels: Object.keys(sessionsBySchema),
                            datasets: [{
                                label: 'Sessions by Type',
                                data: Object.values(sessionsBySchema),
                                backgroundColor: '#a78bfa'
                            }]
                        },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: 'Sessions by Type' } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
                    }
                }
                return { html, chart };
            }
        },
        {
            id: 'gym-occupancy',
            title: t('gym_occupancy'),
            icon: '🏋️',
            colSpan: 1,
            normalContent: `<p class="text-5xl font-bold">${gymOccupancy.percentage}%</p>`,
            expandedContent: `
                <table class="activity-table">
                    <thead>
                        <tr>
                            <th>Room</th>
                            <th>Status</th>
                            <th>Occupants</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gymOccupancy.roomDetails.map(room => `
                            <tr class="clickable-row" data-action="view-room-details" data-room-id="${room.id}">
                                <td>${room.name}</td>
                                <td><span class="status status-${room.status.toLowerCase()}">${room.status}</span></td>
                                <td>${room.occupants.length > 0 ? room.occupants.map(o => o.name.split(' ')[0]).join(', ') : 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p class="note">Click a room to see more details (future functionality).</p>
            `
        },
        {
            id: 'recent-activity',
            title: t('recentActivity', 'Recent Activity'),
            icon: '⏱️',
            colSpan: 4,
            rowSpan: 2,
            normalContent: `
                <table class="activity-table">
                    <thead>
                        <tr>
                            <th>${t('member', 'Member')}</th>
                            <th>${t('workout', 'Workout')}</th>
                            <th>${t('date', 'Date')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${workoutLogs.slice(0, 5).map(log => {
                            const member = members.find(m => m.id === log.userId);
                            const schema = schemas.find(s => s.id === log.schemaId);
                            return `<tr>
                                <td>${member ? member.name : 'Unknown'}</td>
                                <td>${schema ? schema.name : 'Custom Workout'}</td>
                                <td>${new Date(log.date).toLocaleDateString('nl-NL')}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            `,
            expandedContent: `
                <table class="activity-table">
                    <thead>
                        <tr>
                            <th>${t('member', 'Member')}</th>
                            <th>${t('workout', 'Workout')}</th>
                            <th>${t('date', 'Date')}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${workoutLogs.slice(0, 10).map(log => {
                            const member = members.find(m => m.id === log.userId);
                            const schema = schemas.find(s => s.id === log.schemaId);
                            return `<tr>
                                <td>${member ? member.name : 'Unknown'}</td>
                                <td>${schema ? schema.name : 'Custom Workout'}</td>
                                <td>${new Date(log.date).toLocaleDateString('nl-NL')}</td>
                                <td class="actions">
                                    <button class="btn-icon" data-action="leave-note" data-log-id="${log.id}" title="Leave Note" aria-label="Leave Note">&#128221;</button>
                                    <button class="btn-icon" data-action="schedule-follow-up" data-log-id="${log.id}" title="Schedule Follow-up" aria-label="Schedule Follow-up">&#128197;</button>
                                    <button class="btn-icon" data-action="delete-log" data-log-id="${log.id}" title="Delete Log" aria-label="Delete Log">&#128465;</button>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
                ${workoutLogs.length > 10 ? '<p class="note">Showing first 10 recent activities...</p>' : ''}
            `,
        },
        {
            id: 'trainer-rating',
            title: t('avgTrainerRating', 'Avg. Trainer Rating'),
            icon: '⭐',
            colSpan: 1,
            normalContent: `<p class="text-5xl font-bold">${avgTrainerRating} / 5</p>`,
            expandedContent: `
                <table class="activity-table">
                    <thead>
                        <tr>
                            <th>Trainer</th>
                            <th>Avg. Rating</th>
                            <th># Ratings</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trainerRatingDetails.map(trainer => `
                            <tr class="clickable-row" data-action="view-trainer-ratings" data-trainer-id="${trainer.id}" title="Click to view comments">
                                <td>${trainer.name}</td>
                                <td>${trainer.averageRating}</td>
                                <td>${trainer.ratingCount}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p class="note">Click on a trainer to view comments.</p>
            `
        },
        {
            id: 'member-growth-chart',
            title: t('memberGrowth', 'Member Growth'),
            icon: '📈',
            colSpan: 2,
            rowSpan: 2,
            normalContent: `<p>Chart showing member growth over time. Expand to see details.</p>`,
            expandedContent: `<div style="height: 250px;"><canvas id="member-growth-canvas"></canvas></div>`,
            chart: {
                id: 'member-growth-canvas',
                config: {
                    type: 'line',
                    data: {
                        labels: memberGrowth.labels,
                        datasets: [{
                            label: t('newMembers', 'New Members'),
                            data: memberGrowth.data,
                            borderColor: '#60a5fa',
                            backgroundColor: 'rgba(96, 165, 250, 0.2)',
                            tension: 0.1,
                            fill: true,
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                }
            }
        },
        {
            id: 'class-popularity',
            title: t('classPopularity', 'Class Popularity'),
            icon: '🏆',
            colSpan: 2,
            rowSpan: 2,
            normalContent: `
                <ol class="widget-list ordered">
                    ${(classPopularity || []).slice(0, 5).map(([name, count]) => `<li><span>${name}</span><strong>${count} logged</strong></li>`).join('')}
                </ol>
            `,
            expandedContent: `
                <div style="height: 250px; margin-bottom: 1rem;"><canvas id="class-popularity-canvas"></canvas></div>
                <table class="activity-table">
                    <thead><tr><th>Class Name</th><th>Times Logged</th></tr></thead>
                    <tbody>${(classPopularity || []).map(([name, count]) => `<tr><td>${name}</td><td>${count}</td></tr>`).join('')}</tbody>
                </table>
            `,
            chart: {
                id: 'class-popularity-canvas',
                config: {
                    type: 'doughnut',
                    data: {
                        labels: (classPopularity || []).map(([name]) => name),
                        datasets: [{
                            label: 'Times Logged',
                            data: (classPopularity || []).map(([, count]) => count),
                            backgroundColor: chartColors,
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                }
            }
        }
        ,
        {
            id: 'bluetooth-manager',
            title: t('bluetoothManager', 'Bluetooth Manager'),
            icon: '🔌',
            colSpan: 2,
            normalContent: (() => {
                const { state, deviceName } = bluetoothState;
                switch (state) {
                    case 'connected':
                        return `<p><strong>Status:</strong> Connected to <strong>${deviceName || 'Unknown Device'}</strong></p>`;
                    case 'connecting':
                        return `<p><strong>Status:</strong> Connecting...</p>`;
                    case 'error':
                        return `<p><strong>Status:</strong> <span class="text-danger">Error</span>. Please try again.</p>`;
                    case 'disconnected':
                    default:
                        return `<p>No device connected. Use the floating widget or expand this one to connect.</p>`;
                }
            })(),
            expandedContent: (() => {
                const { state, deviceName } = bluetoothState;
                if (state === 'connected') {
                    return `
                        <p><strong>Device:</strong> ${deviceName || 'Unknown Device'}</p>
                        <p><strong>Status:</strong> <span class="text-success">Connected</span></p>
                        <hr>
                        <h4>Device Settings</h4>
                        <p class="note">These are for display only.</p>
                        <div class="form-group">
                            <label class="form-switch">
                                <input type="checkbox" checked>
                                <i></i> Auto-reconnect on startup
                            </label>
                        </div>
                        <div class="widget-actions"><button class="btn btn-sm btn-danger" data-action="bt-disconnect">Disconnect</button></div>
                    `;
                }
                return `
                    <p>No device connected. Click the button to scan for a heart rate monitor.</p>
                    <p class="note">Ensure Bluetooth is enabled on your computer and the device is discoverable.</p>
                    <div class="widget-actions"><button class="btn btn-sm" data-action="bt-connect">Connect New Device</button></div>`;
            })()
        },
        {
            id: 'training-analyser',
            title: 'Training Analyser',
            icon: '🔬',
            colSpan: 2,
            normalContent: `
                <p>Upload and analyze training data.</p>
                <div class="widget-actions">
                    <button class="btn btn-sm" data-action="dashboard-upload-rr">Upload RR-data (.txt)</button>
                    <a href="#/reports" class="btn btn-sm">Go to Reports</a>
                </div>
            `,
            expandedContent: hrvAnalysisResult 
                ? buildHrvReportPages(hrvAnalysisResult).map(page => `<div><h3>${page.title}</h3><div>${page.chartConfig}</div></div>`).join('') 
                : '<p><em>Upload a file to see the analysis.</em></p>'
        },
        {
            id: 'profile-settings-widget',
            title: t('profileSettings', 'Profile Settings'),
            icon: '👤',
            colSpan: 1,
            normalContent: `
                <div class="widget-actions vertical">
                    <a href="#/profile-settings" class="btn btn-sm">Go to Profile Settings</a>
                </div>
            `
        },
        {
            id: 'general-settings-widget',
            title: t('generalSettings', 'General Settings'),
            icon: '⚙️',
            colSpan: 1,
            normalContent: `
                <div class="widget-actions vertical">
                    <a href="#/general-settings" class="btn btn-sm">Go to General Settings</a>
                </div>
            `
        },
    ];
}