import React, { useState } from 'react'
import { createQuiz } from '../lib/api'

export default function Admin(){
  const [title,setTitle]=useState('Quick Poll')
  const [questions,setQuestions]=useState([{ text:'What is your favorite color?', type:'single', options:['Red','Blue','Green'] }])
  const [created, setCreated] = useState(null)

  function updateQuestion(i, key, value){
    const copy = [...questions]; copy[i][key] = value; setQuestions(copy);
  }
  function addOption(qIdx){
    const copy = [...questions]; copy[qIdx].options.push('New option'); setQuestions(copy);
  }
  function addQuestion(){
    setQuestions([...questions, { text:'New question', type:'single', options:['Option 1','Option 2'] }])
  }

  async function handleCreate(){
    // transform into backend format
    const payload = { title, questions: questions.map(q=>({
      text: q.text, type: q.type, options: q.options ? q.options.map(o=>({ text: o })) : []
    }))};
    const res = await createQuiz(payload);
    setCreated(res);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Create Quiz (Admin)</h1>
      <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border p-2 mb-4" />
      {questions.map((q, i)=>(
        <div key={i} className="mb-4 p-3 border rounded">
          <input value={q.text} onChange={e=>updateQuestion(i,'text',e.target.value)} className="w-full mb-2 p-2 border" />
          <select value={q.type} onChange={e=>updateQuestion(i,'type',e.target.value)} className="mb-2">
            <option value="single">Single choice</option>
            <option value="multiple">Multiple choice</option>
            <option value="open">Open text</option>
          </select>
          {q.type !== 'open' && (
            <>
              {q.options.map((opt,oi)=>(
                <input key={oi} value={opt} onChange={e=>{
                  const copy=[...questions]; copy[i].options[oi]=e.target.value; setQuestions(copy);
                }} className="w-full mb-1 p-2 border" />
              ))}
              <button onClick={()=>addOption(i)} className="mt-1 px-2 py-1 border rounded">Add option</button>
            </>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={addQuestion} className="px-4 py-2 bg-gray-200 rounded">Add question</button>
        <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded">Create Quiz</button>
      </div>

      {created && (
        <div className="mt-6 p-4 border rounded bg-green-50">
          <p className="font-medium">Quiz created!</p>
          <p>Share this link with participants:</p>
          <code className="block break-all"> {window.location.origin + '/q/' + created.quizId}</code>
          <p className="mt-2">Live results link:</p>
          <code className="block">{window.location.origin + '/results/' + created.quizId}</code>
        </div>
      )}
    </div>
  )
}
