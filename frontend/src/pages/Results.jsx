import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getResults, getQuiz } from '../lib/api'
import { io } from 'socket.io-client'

export default function Results(){
  const { quizId } = useParams()
  const [data, setData] = useState(null)
  const [quiz, setQuiz] = useState(null)
  useEffect(()=>{
    // initial load
    (async()=>{
      const q = await getQuiz(quizId);
      setQuiz(q);
      const res = await getResults(quizId);
      setData(res);
    })();

    // realtime
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000');
    socket.on('connect', ()=> socket.emit('join', quizId));
    socket.on('results:update', (payload) => {
      setData(payload);
    });
    return () => {
      socket.emit('leave', quizId);
      socket.disconnect();
    }
  }, [quizId]);

  if (!quiz || !data) return <div className="p-6">Loading results...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{quiz.title} — Live Results</h2>
      <div className="mb-2">Total responses: {data.responses}</div>

      {data.questions.map((q, i)=>(
        <div key={i} className="p-3 border rounded mb-3">
          <div className="font-medium mb-2">{i+1}. {q.text}</div>
          {q.counts ? (
            q.counts.map((c, idx)=>(
              <div key={idx} className="flex justify-between">
                <div>{(quiz.questions[i].options[idx] || {}).text || 'Option ' + (idx+1)}</div>
                <div>{c} votes</div>
              </div>
            ))
          ) : (
            <div>
              <div className="italic">Open answers:</div>
              {q.texts.map((t, j)=>(
                <div key={j} className="p-2 border rounded my-1">{t.value}</div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="mt-4">
        <p>Share this results page: <code>{window.location.href}</code></p>
      </div>
    </div>
  )
}
