
(async () => {
    await fetchActivities();
})();

async function fetchActivities() {
    const intervalsAthleteId = 'i498286';
    const intervalsApiKey = '2fl81ly3b8gu4pkcwjw9ktffq';
    const authHeaderValue = `Basic ${btoa(`API_KEY:${intervalsApiKey}`)}`;
    const headers = { "Authorization": authHeaderValue };
    const oldestActivity= '2026-01-01'
    const queryParams = '?oldest='+oldestActivity;
    const url = `https://intervals.icu/api/v1/athlete/${intervalsAthleteId}/activities${queryParams}`;
    const intervalsResponse = await getData(url, headers);
    console.log(intervalsResponse.length);
    const filteredActivities = intervalsResponse.filter((activity)=> activity.type.toLowerCase().includes('run') || activity.type.toLowerCase().includes('ride'))
    console.log(filteredActivities.length);

}

async function getData(url, headers) {
  try {
    const response = await fetch(url, {headers});
    if (!response.ok) {
      throw new Error(`Response: ${response.status}, ${response.body}`);
    }

    const result = await response.json();
    console.log(result+"gg");
    return result;
  } catch (error) {
    console.error(error.message);
  }
}