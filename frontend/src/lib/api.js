const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export async function createQuiz(payload) {
  const res = await fetch(BACKEND + '/api/quizzes', {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  return res.json();
}
export async function getQuiz(quizId) {
  return fetch(BACKEND + '/api/quizzes/' + quizId).then(r => r.json());
}
export async function submitAnswers(quizId, answers, participantId) {
  return fetch(BACKEND + `/api/quizzes/${quizId}/answer`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ participantId, answers })
  }).then(r=>r.json());
}
export async function getResults(quizId) {
  return fetch(BACKEND + `/api/quizzes/${quizId}/results`).then(r=>r.json());
}
