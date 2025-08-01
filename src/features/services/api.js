const API_URL = '';

export async function fetchLessons() {
    const response = await fetch(`${API_URL}/lessons`);
    return await response.json();
}

export async function fetchSchedules() {
    const response = await fetch(`${API_URL}/schedules`);
    return await response.json();
}