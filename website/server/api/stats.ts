export async function GET() {
  try {
    const [npmYear, npmWeek, github] = await Promise.allSettled([
      fetch('https://api.npmjs.org/downloads/point/last-year/@teamvelix/velix').then((r) => r.json()),
      fetch('https://api.npmjs.org/downloads/point/last-week/@teamvelix/velix').then((r) => r.json()),
      fetch('https://api.github.com/repos/Velixteam/velix', {
        headers: { 'User-Agent': 'Velix-Website' },
      }).then((r) => r.json()),
    ]);

    return Response.json({
      totalDownloads: npmYear.status === 'fulfilled' && typeof npmYear.value?.downloads === 'number' ? npmYear.value.downloads : null,
      weeklyDownloads: npmWeek.status === 'fulfilled' && typeof npmWeek.value?.downloads === 'number' ? npmWeek.value.downloads : null,
      githubStars: github.status === 'fulfilled' && typeof github.value?.stargazers_count === 'number' ? github.value.stargazers_count : null,
    });
  } catch {
    return Response.json({ totalDownloads: null, weeklyDownloads: null, githubStars: null }, { status: 500 });
  }
}
