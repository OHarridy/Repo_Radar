import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.github.com/repos/:owner/:repo', () => {
    return HttpResponse.json({
      stargazers_count: 100,
      open_issues_count: 5,
    });
  }),
  http.get('https://api.github.com/repos/:owner/:repo/commits', () => {
    return HttpResponse.json([
      { commit: { committer: { date: '2026-09-18T00:00:00Z' } } },
    ]);
  }),
];
