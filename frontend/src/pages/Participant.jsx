import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getQuiz, submitAnswers } from '../lib/api'
import { io } from 'socket.io-client'

export default function Participant(){
  const { quizId } = useParams()
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState([])
  const [participantId, setParticipantId] = useState(null)
  const navigate = useNavigate()

  useEffect(()=> {
    getQuiz(quizId).then(q=> {
      setQuiz(q)
      setAnswers(q.questions.map(()=>null))
    })
  }, [quizId])

  function setAnswer(i, val){
    const copy = [...answers]; copy[i] = val; setAnswers(copy);
  }

  async function handleSubmit(){
    // construct answer objects
    const payload = answers.map((v,i)=>({ qIndex: i, value: v }));
    const res = await submitAnswers(quizId, payload, participantId);
    if (res.participantId) setParticipantId(res.participantId);
    alert('Submitted — thank you!');
    navigate('/results/' + quizId);
  }

  if (!quiz) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{quiz.title}</h2>
      {quiz.questions.map((q, i)=>(
        <div key={i} className="mb-4 p-3 border rounded">
          <div className="mb-2">{i+1}. {q.text}</div>
          {q.type === 'open' ? (
            <textarea className="w-full border p-2" value={answers[i] || ''} onChange={e=>setAnswer(i, e.target.value)} />
          ) : (
            q.options.map((opt, oi)=>(
              <div key={oi}>
                <label className="inline-flex items-center gap-2">
                  <input
                    type={q.type === 'multiple' ? 'checkbox' : 'radio'}
                    name={`q-${i}`}
                    checked={ q.type === 'multiple' ? (Array.isArray(answers[i]) && answers[i].includes(oi)) : answers[i] === oi}
                    onChange={e=>{
                      if (q.type === 'multiple') {
                        const arr = Array.isArray(answers[i]) ? [...answers[i]] : [];
                        if (e.target.checked) arr.push(oi); else {
                          const idx = arr.indexOf(oi); if (idx>=0) arr.splice(idx,1);
                        }
                        setAnswer(i, arr)
                      } else {
                        setAnswer(i, oi)
                      }
                    }}
                  />
                  {opt.text}
                </label>
              </div>
            ))
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
        <button onClick={()=>navigate('/results/' + quizId)} className="px-4 py-2 border rounded">See Live Results</button>
      </div>
    </div>
  )
}
